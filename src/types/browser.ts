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

export interface OpenPageOptions {
  browser: Browser;
  url: string;
}

export interface WaitForNetworkIdleOptions {
  page: Page;
  timeout?: number;
  reason?: string;
}

export interface EvaluateClickOptions {
  page: Page;
  selector: string;
  timeout?: number;
  reason?: string;
}

export interface ReadElementTextOptions {
  page: Page;
  selector: string;
  timeout?: number;
}

export interface ClickElementOptions {
  context: PageContext;
  selector: string;
  timeout?: number;
  reason?: string;
}

export interface EnterTextOptions {
  context: PageContext;
  selector: string;
  text: string;
  reason?: string;
}

export interface ClearInputOptions {
  context: PageContext;
  selector: string;
}

export interface GetLoginFrameOptions {
  page: Page;
  iframeSelector: string;
}
