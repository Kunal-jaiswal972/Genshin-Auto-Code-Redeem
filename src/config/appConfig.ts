import os from "node:os";
import { z } from "zod";
import {
  expandChromeUserDataDir,
  resolveChromeExecutablePath,
  type ChromePathSearchContext,
} from "./chromePaths.js";
import path from "node:path";
import {
  DEFAULT_CODE_STORE_BASE_PATH,
  DEFAULT_DATABASE_URL,
} from "../infrastructure/storage/stores/codeStorePath.js";
import type { AppConfig } from "../types/appConfig.js";
import { isValidIanaTimeZone } from "../utils/utils.js";

const DEFAULT_SCHEDULER_POLL_INTERVAL_MS = 60_000;
const DEFAULT_SCHEDULER_TIMEZONE = "Asia/Kolkata";

const booleanFromEnv = z
  .string()
  .default("false")
  .transform((value) => /^(1|true|yes|on)$/i.test(value));

function resolveTelegramEnabled(
  flag: string | undefined,
  hasToken: boolean,
): boolean {
  if (flag === undefined || flag.trim().length === 0) {
    return hasToken;
  }

  const normalized = flag.trim();

  if (/^(0|false|no|off)$/i.test(normalized)) {
    return false;
  }

  return /^(1|true|yes|on)$/i.test(normalized);
}

const appConfigSchema = z.object({
  CODE_STORE_BASE_PATH: z.string().min(1).default(DEFAULT_CODE_STORE_BASE_PATH),
  DATABASE_URL: z.string().min(1).default(DEFAULT_DATABASE_URL),
  SCHEDULER_TIMEZONE: z
    .string()
    .min(1)
    .default(DEFAULT_SCHEDULER_TIMEZONE)
    .refine((timeZone) => isValidIanaTimeZone(timeZone), {
      message: "Must be a valid IANA timezone identifier",
    }),
  SCHEDULER_POLL_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(5_000)
    .max(3_600_000)
    .default(DEFAULT_SCHEDULER_POLL_INTERVAL_MS),
  CHROME_EXECUTABLE_PATH: z.string().optional(),
  CHROME_USER_DATA_DIR: z.string().optional(),
  CHROME_DEBUG_PORT: z.coerce
    .number()
    .int()
    .min(1024)
    .max(65535)
    .default(9222),
  HEADLESS: booleanFromEnv,
  CLI_ADAPTER_ENABLED: z
    .string()
    .default("true")
    .transform((value) => /^(1|true|yes|on)$/i.test(value)),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ENABLED: z.string().optional(),
});

let cachedAppConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  const result = appConfigSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid application configuration:\n${details}`);
  }

  const raw = result.data;

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
  const telegramToken = raw.TELEGRAM_BOT_TOKEN?.trim();
  const hasTelegramToken =
    telegramToken !== undefined && telegramToken.length > 0;

  cachedAppConfig = {
    codeStoreBasePath: path.resolve(raw.CODE_STORE_BASE_PATH),
    databaseUrl: raw.DATABASE_URL,
    schedulerTimezone: raw.SCHEDULER_TIMEZONE,
    schedulerPollIntervalMs: raw.SCHEDULER_POLL_INTERVAL_MS,
    cliAdapterEnabled: raw.CLI_ADAPTER_ENABLED,
    telegramBotToken: hasTelegramToken ? telegramToken : null,
    telegramEnabled: resolveTelegramEnabled(raw.TELEGRAM_ENABLED, hasTelegramToken),
    chrome: {
      executablePath: resolveChromeExecutablePath({
        configuredPath: chromeExecutablePath,
        searchContext: chromeSearchContext,
      }),
      userDataDir: chromeUserDataDir,
      debugPort: raw.CHROME_DEBUG_PORT,
      headless: raw.HEADLESS,
    },
  };

  return cachedAppConfig;
}
