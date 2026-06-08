import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { ExecutionMode, GameId, GenshinServer } from "./constants.js";
import { resolveChromeExecutablePath } from "./chromePaths.js";
import type { AppEnv } from "../types/env.js";

const executionModeSchema = z.enum([
  ExecutionMode.MANUAL,
  ExecutionMode.CRON,
]);

const genshinServerSchema = z.enum([
  GenshinServer.AMERICA,
  GenshinServer.EUROPE,
  GenshinServer.ASIA,
  GenshinServer.TW_HK_MO,
]);

const booleanFromEnv = z
  .string()
  .default("false")
  .transform((value) => /^(1|true|yes|on)$/i.test(value));

const envSchema = z
  .object({
    EXECUTION_MODE: executionModeSchema.default(ExecutionMode.MANUAL),
    GAME_ID: z.enum([GameId.GENSHIN]).default(GameId.GENSHIN),
    CODE_STORE_PATH: z.string().min(1).default("./src/data/codes.json"),
    CHROME_EXECUTABLE_PATH: z.string().optional(),
    CHROME_USER_DATA_DIR: z.string().optional(),
    CHROME_DEBUG_PORT: z.coerce
      .number()
      .int()
      .min(1024)
      .max(65535)
      .default(9222),
    HEADLESS: booleanFromEnv,
    GENSHIN_EMAIL: z.string().email("GENSHIN_EMAIL must be a valid email"),
    GENSHIN_PASSWORD: z.string().min(1, "GENSHIN_PASSWORD is required"),
    GENSHIN_SERVER: genshinServerSchema.default(GenshinServer.ASIA),
  })
  .transform((raw): AppEnv => {
    const localAppData = process.env.LOCALAPPDATA ?? os.homedir();

    const chromeUserDataDir =
      raw.CHROME_USER_DATA_DIR?.trim() ||
      path.join(localAppData, "Google", "Chrome", "DebugProfile");

    const expandedChromeUserDataDir = chromeUserDataDir.replace(
      /%LOCALAPPDATA%/gi,
      localAppData,
    );

    const chromeExecutablePath = raw.CHROME_EXECUTABLE_PATH?.trim();

    return {
      executionMode: raw.EXECUTION_MODE,
      gameId: raw.GAME_ID,
      codeStorePath: path.resolve(raw.CODE_STORE_PATH),
      chrome: {
        executablePath: resolveChromeExecutablePath(chromeExecutablePath),
        userDataDir: expandedChromeUserDataDir,
        debugPort: raw.CHROME_DEBUG_PORT,
        headless: raw.HEADLESS,
      },
      genshin: {
        email: raw.GENSHIN_EMAIL.trim(),
        password: raw.GENSHIN_PASSWORD,
        server: raw.GENSHIN_SERVER,
      },
    };
  });

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
