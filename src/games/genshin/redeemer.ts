import type { Browser, Page } from "puppeteer-core";
import { Delays, RedeemStatus, type GenshinServerValue } from "../../config/constants.js";
import { RedeemError } from "../../core/errors.js";
import type { ChromeSession } from "../../types/browser.js";
import type {
  CodeRedeemResult,
  GameRedeemOptions,
} from "../../types/redeem.js";
import {
  formatAccountLabel,
  formatWaitMs,
  getRandomDelay,
  logger,
  maskSecret,
  wait,
  waitUntil,
} from "../../utils/utils.js";
import {
  clearInput,
  clickElement,
  enterText,
  evaluateClick,
  getLoginFrame,
  openPage,
  readElementText,
  waitForNetworkIdle,
} from "../../browser/pageActions.js";
import {
  genshinConfig,
  genshinServerNthChild,
  getServerMenuSelector,
  isGenshinServer,
} from "./config.js";
import { parseRedeemMessage } from "../hoyoverse/parseRedeemMessage.js";

async function isLoggedIn(page: Page): Promise<boolean> {
  const userButton = await waitUntil({
    reason: "login check (account button)",
    operation: () =>
      page.waitForSelector(genshinConfig.selectors.userButton, {
        visible: true,
        timeout: Delays.LONG,
      }),
    maxMs: Delays.LONG,
  });

  if (!userButton) {
    return false;
  }

  await wait({ ms: Delays.SHORT, reason: "account button label to load" });

  const label = await page.evaluate(
    (element) => element.textContent?.trim() ?? "",
    userButton,
  );

  return label === genshinConfig.logOutLabel;
}

async function loginToGenshin(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const accountLabel = formatAccountLabel(email);

  await clickElement({
    context: page,
    selector: genshinConfig.selectors.userButton,
    timeout: Delays.LONG,
    reason: "account menu",
  });
  await waitForNetworkIdle({
    page,
    timeout: Delays.LONG,
    reason: "login dialog to load",
  });

  const frame = await getLoginFrame({
    page,
    iframeSelector: genshinConfig.selectors.loginIframe,
  });
  await wait({ ms: Delays.SHORT, reason: "login iframe to initialize" });

  await enterText({
    context: frame,
    selector: genshinConfig.selectors.emailInput,
    text: email,
    reason: "email field",
  });
  logger.gray(`Email entered: ${maskSecret(email)}`);
  await wait({
    ms: getRandomDelay({ min: Delays.RANDOM_ACTION_MIN, max: Delays.RANDOM_ACTION_MAX }),
    reason: "after entering email",
  });

  await enterText({
    context: frame,
    selector: genshinConfig.selectors.passwordInput,
    text: password,
    reason: "password field",
  });
  logger.gray("Password entered: ********");
  await wait({
    ms: getRandomDelay({ min: Delays.RANDOM_ACTION_MIN, max: Delays.RANDOM_ACTION_MAX }),
    reason: "after entering password",
  });

  await clickElement({
    context: frame,
    selector: genshinConfig.selectors.loginSubmit,
    timeout: Delays.LONG,
    reason: "login submit",
  });
  await wait({ ms: Delays.LONG, reason: "login request to complete" });

  const loggedIn = await isLoggedIn(page);

  if (!loggedIn) {
    throw new RedeemError("Login failed: incorrect email or password.");
  }

  logger.success(`Logged in to Hoyoverse account (${accountLabel}).`);
}

async function ensureLoggedIn(
  browser: Browser,
  page: Page,
  email: string,
  password: string,
): Promise<Page> {
  const accountLabel = formatAccountLabel(email);
  let activePage = page;

  if (await isLoggedIn(activePage)) {
    logger.success(`Already logged in via Chrome debug profile (${accountLabel}).`);
    return activePage;
  }

  logger.info(`Not logged in — signing in as ${accountLabel}.`);

  let loginAttempts = 0;

  while (loginAttempts < genshinConfig.maxLoginAttempts) {
    try {
      await loginToGenshin(activePage, email, password);
      return activePage;
    } catch (error) {
      loginAttempts += 1;
      const cause =
        error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Login attempt ${loginAttempts}/${genshinConfig.maxLoginAttempts} failed: ${cause.message}`,
      );

      if (loginAttempts >= genshinConfig.maxLoginAttempts) {
        throw new RedeemError(
          `Failed to login after ${genshinConfig.maxLoginAttempts} attempts.`,
          cause,
        );
      }

      await activePage.close();
      activePage = await openPage({
        browser,
        url: genshinConfig.redeemPageUrl,
      });
      await wait({ ms: Delays.LONG, reason: "before retrying login" });
    }
  }

  return activePage;
}

function serverLabelMatches(label: string, server: GenshinServerValue): boolean {
  const normalizedLabel = label.toLowerCase();
  const normalizedServer = server.toLowerCase();

  if (normalizedLabel.includes(normalizedServer)) {
    return true;
  }

  const firstToken = normalizedServer.split(/[,\s]+/)[0] ?? normalizedServer;
  return firstToken.length > 0 && normalizedLabel.includes(firstToken);
}

async function selectServer(
  page: Page,
  server: GenshinServerValue,
): Promise<void> {
  const currentLabel = await readElementText({
    page,
    selector: genshinConfig.selectors.serverButton,
    timeout: Delays.LONG,
  });

  if (serverLabelMatches(currentLabel, server)) {
    logger.gray(`Server already selected: ${server}`);
    return;
  }

  const nthChild = genshinServerNthChild[server];
  const serverSelector = getServerMenuSelector(nthChild);

  await evaluateClick({
    page,
    selector: genshinConfig.selectors.serverButton,
    timeout: Delays.LONG,
    reason: "open server dropdown",
  });
  await wait({ ms: Delays.SHORT, reason: "server dropdown to open" });
  await evaluateClick({
    page,
    selector: serverSelector,
    timeout: Delays.LONG,
    reason: `select server: ${server}`,
  });
  logger.gray(`Server selected: ${server}`);
  await wait({ ms: Delays.SHORT, reason: "apply server selection" });
}

async function isRedeemModalOpen(page: Page): Promise<boolean> {
  return page.evaluate((modalSelector) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) {
      return false;
    }

    const style = window.getComputedStyle(modal);
    return style.display !== "none" && style.visibility !== "hidden";
  }, genshinConfig.selectors.redeemModal);
}

async function dismissRedeemModal(page: Page): Promise<void> {
  try {
    const clicked = await page.evaluate(
      (closeSelector, modalSelector) => {
        const closeEl = document.querySelector(closeSelector);
        if (closeEl instanceof HTMLElement) {
          closeEl.click();
          return true;
        }

        const modal = document.querySelector(modalSelector);
        if (modal instanceof HTMLElement) {
          modal.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );
        }

        return false;
      },
      genshinConfig.selectors.redeemModalClose,
      genshinConfig.selectors.redeemModal,
    );

    if (!clicked) {
      await page.keyboard.press("Escape");
    }

    await wait({ ms: 500, reason: "redeem modal to close" });
  } catch {
    logger.warn("Could not dismiss redeem modal — continuing.");
  }
}

async function ensureRedeemModalClosed(page: Page): Promise<void> {
  if (!(await isRedeemModalOpen(page))) {
    return;
  }

  await dismissRedeemModal(page);

  const deadline = Date.now() + genshinConfig.modalCloseTimeoutMs;
  while (Date.now() < deadline) {
    if (!(await isRedeemModalOpen(page))) {
      return;
    }

    await wait({ ms: genshinConfig.modalPollIntervalMs });
  }

  logger.warn("Redeem modal still open — continuing anyway.");
}

async function waitForRedeemModalMessage(page: Page): Promise<string> {
  const messageSelector = genshinConfig.selectors.redeemModalMessage;
  const modalSelector = genshinConfig.selectors.redeemModal;
  const timeout = Delays.LONG;

  logger.wait(
    `Waiting — redeem result modal message (max ${formatWaitMs(timeout)})`,
  );

  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const text = await page.evaluate(
      (msgSel, modSel) => {
        const modal = document.querySelector(modSel);
        if (!modal) {
          return "";
        }

        const message = document.querySelector(msgSel);
        return message?.textContent?.trim() ?? "";
      },
      messageSelector,
      modalSelector,
    );

    if (text.length > 0) {
      return text;
    }

    await wait({ ms: genshinConfig.modalPollIntervalMs });
  }

  return "";
}

async function redeemSingleCode(
  page: Page,
  code: string,
): Promise<CodeRedeemResult> {
  for (let attempt = 1; attempt <= genshinConfig.maxRedeemRetries; attempt += 1) {
    await ensureRedeemModalClosed(page);
    await clearInput({ context: page, selector: genshinConfig.selectors.redeemInput });
    await enterText({
      context: page,
      selector: genshinConfig.selectors.redeemInput,
      text: code,
      reason: "redeem code input",
    });
    logger.gray(`Submitting code: ${code}${attempt > 1 ? ` (retry ${attempt})` : ""}`);
    await wait({
      ms: getRandomDelay({ min: 100, max: 500 }),
      reason: "before submitting code",
    });
    await clickElement({
      context: page,
      selector: genshinConfig.selectors.redeemSubmit,
      timeout: Delays.LONG,
      reason: "redeem submit",
    });

    const feedback = await waitForRedeemModalMessage(page);
    const parsed = parseRedeemMessage(feedback);

    logger.info(`[${code}] ${parsed.action}: ${parsed.message}`);

    if (parsed.action === "success") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      return {
        code,
        status: RedeemStatus.REDEEMED,
        message: parsed.message,
      };
    }

    if (parsed.action === "expired") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      return {
        code,
        status: RedeemStatus.EXPIRED,
        message: parsed.message,
      };
    }

    if (parsed.action === "retry") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "redeem cooldown before retry" });
      continue;
    }

    const noModalResponse =
      parsed.action === "pending" &&
      (parsed.message === "No redemption response detected." ||
        parsed.message.length === 0);

    if (noModalResponse && attempt < genshinConfig.maxRedeemRetries) {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      logger.warn(`No modal response for ${code} — retrying submit.`);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "no modal response, retrying" });
      continue;
    }

    if (parsed.action === "pending" && attempt < genshinConfig.maxRedeemRetries) {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      logger.warn(`Redeem inconclusive for ${code} — retrying submit.`);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "inconclusive response, retrying" });
      continue;
    }

    await dismissRedeemModal(page);
    await ensureRedeemModalClosed(page);
    logger.warn(`[${code}] remains pending: ${parsed.message}`);
    return {
      code,
      status: RedeemStatus.PENDING,
      message: parsed.message,
    };
  }

  logger.warn(`[${code}] remains pending after max retries.`);
  return {
    code,
    status: RedeemStatus.PENDING,
    message: "Max retries exceeded — will retry on next run.",
  };
}

export async function redeemGenshinCodes(
  session: ChromeSession,
  options: GameRedeemOptions,
): Promise<CodeRedeemResult[]> {
  const { browser } = session;
  const { credentials, codes } = options;
  const accountLabel = formatAccountLabel(credentials.email);

  if (codes.length === 0) {
    return [];
  }

  if (credentials.email.length === 0 || credentials.password.length === 0) {
    throw new RedeemError("Genshin credentials are required for redemption.");
  }

  let page = session.page;

  logger.gray(`Navigating to redeem page for ${accountLabel}...`);
  await page.goto(genshinConfig.redeemPageUrl, { waitUntil: "domcontentloaded" });
  await wait({ ms: Delays.SHORT, reason: "redeem page to load" });
  logger.gray(`Navigated to ${genshinConfig.redeemPageUrl}`);

  page = await ensureLoggedIn(
    browser,
    page,
    credentials.email,
    credentials.password,
  );
  await selectServer(page, isGenshinServer(credentials.server));

  const results: CodeRedeemResult[] = [];

  for (let index = 0; index < codes.length; index += 1) {
    const code = codes[index];
    if (!code) {
      continue;
    }

    const result = await redeemSingleCode(page, code);
    results.push(result);

    if (options.onCodeRedeemed) {
      await options.onCodeRedeemed(result);
    }

    const hasMoreCodes = index < codes.length - 1;
    if (hasMoreCodes) {
      await ensureRedeemModalClosed(page);
      await wait({ ms: genshinConfig.redeemCooldownMs, reason: "between redeem codes" });
    }
  }

  return results;
}
