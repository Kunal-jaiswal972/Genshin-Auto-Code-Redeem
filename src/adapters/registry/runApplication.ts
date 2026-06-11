import { registerShutdownHook } from "../../browser/lifecycle.js";
import { getAppConfig } from "../../config/appConfig.js";
import { createScheduler } from "../../scheduling/createScheduler.js";
import { logger } from "../../utils/utils.js";
import type { ScheduledRunNotifier } from "../contracts/scheduledRunNotifier.js";
import { createCliAdapterPorts } from "../cli/core/cliPorts.js";
import { createSchedulerOnTrigger } from "../shared/schedulerOnTrigger.js";
import { createEnabledAdapters } from "./createEnabledAdapters.js";

export async function runApplication(): Promise<void> {
  const appConfig = getAppConfig();
  const { prompt: logPort, display: logDisplay } = createCliAdapterPorts();
  let scheduledRunNotifiers: readonly ScheduledRunNotifier[] = [];

  const scheduler = createScheduler({
    onTrigger: createSchedulerOnTrigger({
      fallbackPort: logPort,
      getScheduledRunNotifiers: () => scheduledRunNotifiers,
    }),
  });

  const enabled = createEnabledAdapters({
    scheduler,
    logPort,
    logDisplay,
    appConfig,
  });

  scheduledRunNotifiers = enabled.scheduledRunNotifiers;

  await scheduler.start();

  registerShutdownHook(async () => {
    for (const adapter of [...enabled.background].reverse()) {
      await adapter.stop();
    }

    if (enabled.foreground !== null) {
      await enabled.foreground.stop();
    }

    await scheduler.stop();
  });

  const adapterLabels =
    enabled.labels.length > 0 ? enabled.labels.join(", ") : "none (scheduler only)";

  logger.success("Auto Code Redeemer — scheduler + enabled input adapters");
  logger.gray(`Database: ${appConfig.databaseUrl}`);
  logger.gray(`Scheduler poll: ${appConfig.schedulerPollIntervalMs}ms`);
  logger.info(`Active adapters: ${adapterLabels}`);

  if (!appConfig.cliAdapterEnabled) {
    logger.gray("CLI menu: off (set CLI_ADAPTER_ENABLED=true to enable)");
  }

  if (!appConfig.telegramEnabled && appConfig.telegramBotToken) {
    logger.gray("Telegram: off (set TELEGRAM_ENABLED=true)");
  }

  await Promise.all(enabled.background.map((adapter) => adapter.start()));

  if (enabled.foreground !== null) {
    await enabled.foreground.start();
    return;
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
