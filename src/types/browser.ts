import type { Browser, Frame, Page } from "puppeteer-core";

export interface ChromeLaunchOptions {
  executablePath: string;
  userDataDir: string;
  debugPort: number;
  headless: boolean;
}

export interface ChromeSession {
  browser: Browser;
  page: Page;
}

export interface ChromeVersionResponse {
  webSocketDebuggerUrl: string;
}

export type PageContext = Page | Frame;
