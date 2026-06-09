import type { Bot } from "grammy";
import { getAppConfig } from "../../config/appConfig.js";
import { ConfigError } from "../../domain/errors.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import { logger } from "../../utils/utils.js";
import type { TaskInputAdapter } from "../ports/taskInputAdapter.js";
import {
  createTelegramAdapterFromConfig,
  type TelegramAdapterBundle,
} from "../telegram/createTelegramAdapter.js";

export interface EnabledAdaptersResult {
  adapters: TaskInputAdapter[];
  telegramBot: Bot | null;
}

export function createEnabledAdapters(
  scheduler: TaskScheduler,
): EnabledAdaptersResult {
  const appConfig = getAppConfig();
  const adapters: TaskInputAdapter[] = [];
  let telegramBot: Bot | null = null;

  if (appConfig.telegramEnabled) {
    if (!appConfig.telegramBotToken) {
      throw new ConfigError(
        "TELEGRAM_ENABLED is true but TELEGRAM_BOT_TOKEN is missing.",
      );
    }

    const bundle: TelegramAdapterBundle = createTelegramAdapterFromConfig(
      appConfig.telegramBotToken,
      scheduler,
    );
    adapters.push(bundle.adapter);
    telegramBot = bundle.bot;
  } else if (appConfig.telegramBotToken) {
    logger.gray("Telegram token present but TELEGRAM_ENABLED=false — bot off.");
  }

  return { adapters, telegramBot };
}
