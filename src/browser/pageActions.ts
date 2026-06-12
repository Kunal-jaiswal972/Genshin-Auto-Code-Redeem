import type { Browser, Frame, Page } from "puppeteer-core";
import { BrowserConfig, Delays } from "../config/constants.js";
import { BrowserError } from "../domain/errors.js";
import type {
  ClearInputOptions,
  ClickElementOptions,
  EnterTextOptions,
  EvaluateClickOptions,
  GetLoginFrameOptions,
  OpenPageOptions,
  PageContext,
  ReadElementTextOptions,
  WaitForNetworkIdleOptions,
} from "../types/browser.js";
import { getRandomDelay, logger, waitUntil } from "../utils/utils.js";

function configurePage(page: Page): void {
  page.setDefaultTimeout(BrowserConfig.PAGE_TIMEOUT);
  page.setDefaultNavigationTimeout(BrowserConfig.NAVIGATION_TIMEOUT);
}

export async function openPage(options: OpenPageOptions): Promise<Page> {
  logger.gray(`Opening page: ${options.url}`);
  const page = await options.browser.newPage();
  configurePage(page);
  await page.goto(options.url, { waitUntil: "domcontentloaded" });
  return page;
}

export async function waitForNetworkIdle(
  options: WaitForNetworkIdleOptions,
): Promise<void> {
  const timeout = options.timeout ?? Delays.LONG;
  const reason = options.reason ?? "page network to settle";

  await waitUntil({
    reason,
    operation: () => options.page.waitForNetworkIdle({ timeout }),
    maxMs: timeout,
  });
}

export async function evaluateClick(options: EvaluateClickOptions): Promise<void> {
  const timeout = options.timeout ?? Delays.LONG;

  await waitUntil({
    reason: options.reason ?? `evaluate click (${options.selector})`,
    operation: async () => {
      await options.page.waitForSelector(options.selector, {
        visible: true,
        timeout,
      });

      const clicked = await options.page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        element.click();
        return true;
      }, options.selector);

      if (!clicked) {
        throw new BrowserError(`Could not click element: ${options.selector}`);
      }
    },
    maxMs: timeout,
  });
}

export async function readElementText(
  options: ReadElementTextOptions,
): Promise<string> {
  const timeout = options.timeout ?? Delays.LONG;

  await options.page.waitForSelector(options.selector, {
    visible: true,
    timeout,
  });

  return options.page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element?.textContent?.trim() ?? "";
  }, options.selector);
}

export async function clickElement(options: ClickElementOptions): Promise<void> {
  const timeout = options.timeout ?? Delays.LONG;

  await waitUntil({
    reason: options.reason ?? `clickable element (${options.selector})`,
    operation: async () => {
      const element = await options.context.waitForSelector(options.selector, {
        visible: true,
        timeout,
      });

      if (!element) {
        throw new BrowserError(`Element not found for selector: ${options.selector}`);
      }

      await element.click();
    },
    maxMs: timeout,
  });
}

export async function enterText(options: EnterTextOptions): Promise<void> {
  const element = await waitUntil({
    reason: options.reason ?? `input field (${options.selector})`,
    operation: () =>
      options.context.waitForSelector(options.selector, {
        visible: true,
        timeout: Delays.LONG,
      }),
    maxMs: Delays.LONG,
  });

  if (!element) {
    throw new BrowserError(`Input not found for selector: ${options.selector}`);
  }

  await element.type(options.text, {
    delay: getRandomDelay({ min: Delays.TYPE_MIN, max: Delays.TYPE_MAX }),
  });
}

export async function clearInput(options: ClearInputOptions): Promise<void> {
  await options.context.$eval(options.selector, (element) => {
    const input = element as HTMLInputElement;
    input.value = "";
  });
}

export async function getLoginFrame(options: GetLoginFrameOptions): Promise<Frame> {
  logger.gray(`Looking for login iframe — ${options.iframeSelector}`);

  const frameHandle = await options.page.$(options.iframeSelector);

  if (!frameHandle) {
    throw new BrowserError(`Login iframe not found: ${options.iframeSelector}`);
  }

  const frame = await frameHandle.contentFrame();

  if (!frame) {
    throw new BrowserError(
      `Could not access login iframe: ${options.iframeSelector}`,
    );
  }

  return frame;
}

export type { PageContext };
