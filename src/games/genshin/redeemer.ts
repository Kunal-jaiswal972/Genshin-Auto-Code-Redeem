import { Delays } from "../../config/constants.js";
import { RedeemError } from "../../domain/errors.js";
import type { ChromeSession } from "../../types/browser.js";
import type {
  CodeRedeemResult,
  GameRedeemOptions,
} from "../../domain/result/codeRedeemResult.js";
import {
  formatAccountLabel,
  logger,
  wait,
} from "../../utils/utils.js";
import { genshinConfig, isGenshinServer } from "./config.js";
import { ensureLoggedIn } from "./login.js";
import { redeemSingleCode } from "./redeemCode.js";
import { ensureRedeemModalClosed } from "./redeemModal.js";
import { selectServer } from "./selectServer.js";

export async function redeemGenshinCodes(
  session: ChromeSession,
  options: GameRedeemOptions,
): Promise<CodeRedeemResult[]> {
  const { browser } = session;
  const { credentials, codes } = options;
  const accountLabel = formatAccountLabel(credentials.username);

  if (codes.length === 0) {
    return [];
  }

  if (credentials.username.length === 0 || credentials.password.length === 0) {
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
    credentials.username,
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
