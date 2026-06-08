import os from "node:os";
import { z } from "zod";import { ExecutionMode } from "./constants.js";
import {
  expandChromeUserDataDir,
  resolveChromeExecutablePath,
  type ChromePathSearchContext,
} from "./chromePaths.js";
import {
  DEFAULT_CODE_STORE_BASE_PATH,
  resolveCodeStorePath,
} from "../storage/codeStorePath.js";
import {
  getGameModule,
  registeredGameIds,
} from "../games/registry.js";
import type { AppEnv } from "../types/env.js";

const executionModeSchema = z.enum([
  ExecutionMode.MANUAL,
  ExecutionMode.CRON,
]);

const booleanFromEnv = z
  .string()
  .default("false")
  .transform((value) => /^(1|true|yes|on)$/i.test(value));

const baseEnvSchema = z.object({
  EXECUTION_MODE: executionModeSchema.default(ExecutionMode.MANUAL),
  GAME_ID: z.enum(registeredGameIds).default(registeredGameIds[0]),
  CODE_STORE_BASE_PATH: z.string().min(1).default(DEFAULT_CODE_STORE_BASE_PATH),
  CHROME_EXECUTABLE_PATH: z.string().optional(),
  CHROME_USER_DATA_DIR: z.string().optional(),
  CHROME_DEBUG_PORT: z.coerce
    .number()
    .int()
    .min(1024)
    .max(65535)
    .default(9222),
  HEADLESS: booleanFromEnv,
});

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = baseEnvSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  const raw = result.data;
  const gameId = raw.GAME_ID;
  const gameModule = getGameModule(gameId);
  let credentials;

  try {
    credentials = gameModule.parseCredentials(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");

      throw new Error(
        `Invalid ${gameModule.displayName} credentials:\n${details}\nRequired env vars: ${gameModule.requiredEnvVars.join(", ")}`,
      );
    }

    throw error;
  }

  // Chrome path discovery uses OS-provided variables (not from .env).
  // Windows sets LOCALAPPDATA, PROGRAMFILES, PROGRAMFILES(X86) on every process.
  // process.platform is a Node built-in ("win32" | "linux" | "darwin").
  // Used only when CHROME_EXECUTABLE_PATH is empty — see chromePaths.ts candidates.
  const localAppData = process.env.LOCALAPPDATA ?? os.homedir();
  const chromeSearchContext: ChromePathSearchContext = {
    localAppData,
    platform: process.platform,
    programFiles: process.env.PROGRAMFILES,
    programFilesX86: process.env["PROGRAMFILES(X86)"],
  };

  const chromeUserDataDir = expandChromeUserDataDir({
    configuredDir: raw.CHROME_USER_DATA_DIR,
    localAppData,
  });

  const chromeExecutablePath = raw.CHROME_EXECUTABLE_PATH?.trim();
  const codeStorePath = resolveCodeStorePath({
    basePath: raw.CODE_STORE_BASE_PATH,
    gameId,
  });

  cachedEnv = {
    executionMode: raw.EXECUTION_MODE,
    gameId,
    codeStorePath,
    chrome: {
      executablePath: resolveChromeExecutablePath({
        configuredPath: chromeExecutablePath,
        searchContext: chromeSearchContext,
      }),
      userDataDir: chromeUserDataDir,
      debugPort: raw.CHROME_DEBUG_PORT,
      headless: raw.HEADLESS,
    },
    credentials,
  };

  return cachedEnv;
}
