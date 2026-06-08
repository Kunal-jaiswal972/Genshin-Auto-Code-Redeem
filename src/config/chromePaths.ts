import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ConfigError } from "../core/errors.js";

function getChromeCandidates(): string[] {
  const candidates: string[] = [];
  const programFiles = process.env.PROGRAMFILES;
  const programFilesX86 = process.env["PROGRAMFILES(X86)"];
  const localAppData = process.env.LOCALAPPDATA ?? os.homedir();

  if (programFiles) {
    candidates.push(
      path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    );
  }

  if (programFilesX86) {
    candidates.push(
      path.join(
        programFilesX86,
        "Google",
        "Chrome",
        "Application",
        "chrome.exe",
      ),
    );
  }

  candidates.push(
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
  );

  return candidates;
}

export function resolveChromeExecutablePath(configuredPath?: string): string {
  if (configuredPath && configuredPath.length > 0 && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  for (const candidate of getChromeCandidates()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new ConfigError(
    "Could not find chrome.exe. Set CHROME_EXECUTABLE_PATH in .env.",
  );
}
