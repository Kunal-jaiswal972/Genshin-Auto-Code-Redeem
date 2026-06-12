import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { BrowserConfig, Delays } from "../config/constants.js";
import { getAppConfig } from "../config/appConfig.js";
import { BrowserError } from "../domain/errors.js";
import type {
  ChromeLaunchOptions,
  ChromeSession,
  ChromeVersionResponse,
} from "../types/browser.js";
import { logger, wait } from "../utils/utils.js";
import { bindBrowser } from "./lifecycle.js";
import { openPage } from "./pageActions.js";

function killExistingDebugChrome(userDataDir: string): void {
  if (process.platform !== "win32") {
    return;
  }

  const profileName = path.basename(userDataDir);

  try {
    execSync(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*${profileName}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
      { stdio: "ignore" },
    );
  } catch {
    // best-effort cleanup
  }
}

function buildChromeSpawnArgs(options: ChromeLaunchOptions): string[] {
  const args = [
    `--remote-debugging-port=${options.debugPort}`,
    `--user-data-dir=${options.userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
  ];

  if (options.headless) {
    args.push(
      "--headless=new",
      "--window-size=1280,800",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    );
  }

  return args;
}

function spawnChrome(options: ChromeLaunchOptions): void {
  const args = buildChromeSpawnArgs(options);

  const child = spawn(options.executablePath, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

async function fetchWebSocketDebuggerUrl(
  debugPort: number,
): Promise<string> {
  const versionUrl = `http://127.0.0.1:${debugPort}/json/version`;

  for (let attempt = 1; attempt <= BrowserConfig.WS_FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(versionUrl);

      if (response.ok) {
        const payload = (await response.json()) as ChromeVersionResponse;

        if (payload.webSocketDebuggerUrl.length > 0) {
          return payload.webSocketDebuggerUrl;
        }
      }
    } catch {
      // endpoint not up yet
    }

    await wait({
      ms: Delays.WS_FETCH_INTERVAL,
      reason: `Chrome debug port to respond (attempt ${attempt}/${BrowserConfig.WS_FETCH_RETRIES})`,
    });
  }

  throw new BrowserError(
    `Timed out waiting for Chrome remote-debugging endpoint at ${versionUrl}.`,
  );
}

export function buildChromeLaunchOptions(): ChromeLaunchOptions {
  const { chrome } = getAppConfig();

  return {
    executablePath: chrome.executablePath,
    userDataDir: chrome.userDataDir,
    debugPort: chrome.debugPort,
    headless: chrome.headless,
  };
}

export async function launchChromeSession(
  options: ChromeLaunchOptions,
): Promise<ChromeSession> {
  if (!fs.existsSync(options.executablePath)) {
    throw new BrowserError(
      `Chrome executable not found: ${options.executablePath}`,
    );
  }

  logger.gray(
    "Closing any existing debug-profile Chrome (normal Chrome is left alone)...",
  );
  killExistingDebugChrome(options.userDataDir);
  await wait({ ms: Delays.POST_KILL, reason: "debug-profile Chrome processes to exit" });

  logger.gray(`Using Chrome: ${options.executablePath}`);
  logger.info(
    `Launching Chrome (${options.headless ? "headless" : "visible"}) on debug profile...`,
  );

  spawnChrome(options);

  const browserWSEndpoint = await fetchWebSocketDebuggerUrl(options.debugPort);
  logger.gray(`Connected to: ${browserWSEndpoint}`);

  const browser = await puppeteer.connect({
    browserWSEndpoint,
    protocolTimeout: BrowserConfig.PROTOCOL_TIMEOUT,
  });
  bindBrowser(browser);

  const page = await openPage({ browser, url: "about:blank" });

  const viewport = await page.evaluate(() => ({
    width: window.screen.width,
    height: window.screen.height,
  }));
  await page.setViewport(viewport);

  return { browser, page };
}
