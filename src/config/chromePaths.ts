import fs from "node:fs";
import path from "node:path";
import { ConfigError } from "../domain/errors.js";

/**
 * Inputs for auto-detecting chrome.exe when CHROME_EXECUTABLE_PATH is unset.
 * Populated in env.ts from the OS — these fields are not .env keys.
 */
export interface ChromePathSearchContext {
  /** Node built-in: win32 | linux | darwin */
  platform: NodeJS.Platform;
  /** Windows LOCALAPPDATA (e.g. C:\Users\<you>\AppData\Local) */
  localAppData: string;
  /** Windows PROGRAMFILES (e.g. C:\Program Files) */
  programFiles?: string;
  /** Windows PROGRAMFILES(X86) (e.g. C:\Program Files (x86)) */
  programFilesX86?: string;
}

export interface ResolveChromeExecutablePathOptions {
  configuredPath?: string;
  searchContext: ChromePathSearchContext;
}

export interface ExpandChromeUserDataDirOptions {
  configuredDir?: string;
  localAppData: string;
}

export function getChromeCandidates(context: ChromePathSearchContext): string[] {
  const candidates: string[] = [];

  if (context.platform === "win32") {
    if (context.programFiles) {
      candidates.push(
        path.join(
          context.programFiles,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
      );
    }

    if (context.programFilesX86) {
      candidates.push(
        path.join(
          context.programFilesX86,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe",
        ),
      );
    }

    candidates.push(
      path.join(
        context.localAppData,
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    );

    return candidates;
  }

  if (context.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );
    return candidates;
  }

  candidates.push(
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  );

  return candidates;
}

export function resolveChromeExecutablePath(
  options: ResolveChromeExecutablePathOptions,
): string {
  const trimmed = options.configuredPath?.trim();

  if (trimmed && trimmed.length > 0 && fs.existsSync(trimmed)) {
    return trimmed;
  }

  for (const candidate of getChromeCandidates(options.searchContext)) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new ConfigError(
    "Could not find a Chrome/Chromium executable. Set CHROME_EXECUTABLE_PATH in .env.",
  );
}

export function expandChromeUserDataDir(
  options: ExpandChromeUserDataDirOptions,
): string {
  const trimmed = options.configuredDir?.trim();

  const resolved =
    trimmed && trimmed.length > 0
      ? trimmed
      : path.join(options.localAppData, "Google", "Chrome", "DebugProfile");

  return resolved.replace(/%LOCALAPPDATA%/gi, options.localAppData);
}
