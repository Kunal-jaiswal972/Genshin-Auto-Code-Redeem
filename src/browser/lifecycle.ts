import type { Browser } from "puppeteer-core";
import { closeActivePrompt } from "../cli/prompts.js";
import { Delays } from "../config/constants.js";
import { wait } from "../utils/utils.js";

let activeBrowser: Browser | null = null;
let cleaningUp = false;

export function bindBrowser(browser: Browser): void {
  activeBrowser = browser;
}

export async function closeBrowser(reason: string): Promise<void> {
  if (cleaningUp || !activeBrowser) {
    return;
  }

  cleaningUp = true;

  try {
    await Promise.race([
      activeBrowser.close(),
      wait({ ms: Delays.CHROME_CLOSE_TIMEOUT }),
    ]);
  } catch {
    // best-effort — Chrome may already be gone
  } finally {
    activeBrowser = null;
    cleaningUp = false;
  }
}

async function shutdown(reason: string, exitCode: number): Promise<void> {
  closeActivePrompt();

  try {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  } catch {
    // stdin may not be a TTY
  }

  await closeBrowser(reason);
  process.exit(exitCode);
}

export function registerShutdownHandlers(): void {
  process.on("SIGINT", () => {
    void shutdown("SIGINT", 130);
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM", 0);
  });

  process.on("SIGHUP", () => {
    void shutdown("SIGHUP", 0);
  });
}
