import type { Bot } from "grammy";
import { getAppConfig } from "../../config/appConfig.js";
import { registerShutdownHook } from "../../browser/lifecycle.js";
import { createScheduler } from "../../scheduling/createScheduler.js";
import { logger } from "../../utils/utils.js";
import { createCliPromptPort } from "../ports/cliPromptPort.js";
import type { TaskInputAdapter } from "../ports/taskInputAdapter.js";
import { createSchedulerTriggerHandler } from "../shared/interactiveApp.js";
import { notifyTelegramScheduledRun } from "../telegram/createTelegramAdapter.js";
import { createEnabledAdapters } from "./createEnabledAdapters.js";

export async function runServerApp(): Promise<void> {
  const appConfig = getAppConfig();
  const logPort = createCliPromptPort();
  let telegramBot: Bot | null = null;

  const scheduler = createScheduler({
    onTrigger: async (task) => {
      const chatIdRaw = task.metadata?.telegramChatId;
      const chatId =
        chatIdRaw !== undefined ? Number.parseInt(chatIdRaw, 10) : Number.NaN;

      if (telegramBot && !Number.isNaN(chatId)) {
        await notifyTelegramScheduledRun(telegramBot, task);
        return;
      }

      const handler = createSchedulerTriggerHandler(logPort);
      await handler(task);
    },
  });

  const enabled = createEnabledAdapters(scheduler);
  const adapters: TaskInputAdapter[] = enabled.adapters;
  telegramBot = enabled.telegramBot;

  await scheduler.start();

  for (const adapter of adapters) {
    await adapter.start();
  }

  registerShutdownHook(async () => {
    for (const adapter of [...adapters].reverse()) {
      await adapter.stop();
    }

    await scheduler.stop();
  });

  const adapterLabels =
    adapters.length > 0
      ? adapters.map((adapter) => adapter.label).join(", ")
      : "none (scheduler only)";

  logger.success("Server mode — scheduler + Telegram (if enabled)");
  logger.gray(`Database: ${appConfig.databaseUrl}`);
  logger.gray(`Scheduler poll: ${appConfig.schedulerPollIntervalMs}ms`);
  logger.info(`Active adapters: ${adapterLabels}`);

  if (!appConfig.telegramEnabled) {
    logger.gray("Telegram: off (set TELEGRAM_BOT_TOKEN + TELEGRAM_ENABLED=true)");
  }

  logger.info("Press Ctrl+C to stop.");

  await waitUntilShutdown();
}

function waitUntilShutdown(): Promise<void> {
  return new Promise((resolve) => {
    process.once("SIGINT", () => {
      resolve();
    });
    process.once("SIGTERM", () => {
      resolve();
    });
  });
}
