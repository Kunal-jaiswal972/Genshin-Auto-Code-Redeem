import type { Browser, Frame, Page } from "puppeteer-core";
import { BrowserConfig, Delays } from "../config/constants.js";
import { BrowserError } from "../core/errors.js";import type { PageContext } from "../types/browser.js";
import { getRandomDelay, logger, waitUntil } from "../utils/utils.js";

function configurePage(page: Page): void {
  page.setDefaultTimeout(BrowserConfig.PAGE_TIMEOUT);
  page.setDefaultNavigationTimeout(BrowserConfig.NAVIGATION_TIMEOUT);
}

export async function openPage(browser: Browser, url: string): Promise<Page> {
  logger.gray(`Opening page: ${url}`);
  const page = await browser.newPage();
  configurePage(page);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  return page;
}

export async function waitForNetworkIdle(
  page: Page,
  timeout: number = Delays.LONG,
  reason: string = "page network to settle",
): Promise<void> {
  await waitUntil(reason, () => page.waitForNetworkIdle({ timeout }), timeout);
}

export async function evaluateClick(
  page: Page,
  selector: string,
  timeout: number = Delays.LONG,
  reason?: string,
): Promise<void> {
  await waitUntil(
    reason ?? `evaluate click (${selector})`,
    async () => {
      await page.waitForSelector(selector, { visible: true, timeout });

      const clicked = await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!(element instanceof HTMLElement)) {
          return false;
        }

        element.click();
        return true;
      }, selector);

      if (!clicked) {
        throw new BrowserError(`Could not click element: ${selector}`);
      }
    },
    timeout,
  );
}

export async function readElementText(
  page: Page,
  selector: string,
  timeout: number = Delays.LONG,
): Promise<string> {
  await page.waitForSelector(selector, { visible: true, timeout });

  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element?.textContent?.trim() ?? "";
  }, selector);
}

export async function clickElement(
  context: PageContext,
  selector: string,
  timeout: number = Delays.LONG,
  reason?: string,
): Promise<void> {
  await waitUntil(
    reason ?? `clickable element (${selector})`,
    async () => {
      const element = await context.waitForSelector(selector, {
        visible: true,
        timeout,
      });

      if (!element) {
        throw new BrowserError(`Element not found for selector: ${selector}`);
      }

      await element.click();
    },
    timeout,
  );
}

export async function enterText(
  context: PageContext,
  selector: string,
  text: string,
  reason?: string,
): Promise<void> {
  const element = await waitUntil(
    reason ?? `input field (${selector})`,
    () =>
      context.waitForSelector(selector, {
        visible: true,
        timeout: Delays.LONG,
      }),
    Delays.LONG,
  );

  if (!element) {
    throw new BrowserError(`Input not found for selector: ${selector}`);
  }

  await element.type(text, {
    delay: getRandomDelay(Delays.TYPE_MIN, Delays.TYPE_MAX),
  });
}

export async function clearInput(
  context: PageContext,
  selector: string,
): Promise<void> {
  await context.$eval(selector, (element) => {
    const input = element as HTMLInputElement;
    input.value = "";
  });
}

export async function getLoginFrame(
  page: Page,
  iframeSelector: string,
): Promise<Frame> {
  logger.gray(`Looking for login iframe — ${iframeSelector}`);

  const frameHandle = await page.$(iframeSelector);

  if (!frameHandle) {
    throw new BrowserError(`Login iframe not found: ${iframeSelector}`);
  }

  const frame = await frameHandle.contentFrame();

  if (!frame) {
    throw new BrowserError(`Could not access login iframe: ${iframeSelector}`);
  }

  return frame;
}
