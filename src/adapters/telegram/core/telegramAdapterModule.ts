import { ConfigError } from "../../../domain/errors.js";
import type { AdapterModule } from "../../registry/adapterModules.js";
import { createTelegramAdapter } from "./telegramAdapter.js";
import { createTelegramScheduledRunNotifier } from "../lib/telegramScheduledRunNotifier.js";

export const telegramAdapterModule: AdapterModule = {
  id: "telegram",
  label: "Telegram bot",
  lifecycle: "background",

  isEnabled(appConfig): boolean {
    return appConfig.telegramEnabled;
  },

  create(options) {
    const token = options.appConfig.telegramBotToken;

    if (!token) {
      throw new ConfigError(
        "TELEGRAM_ENABLED is true but TELEGRAM_BOT_TOKEN is missing.",
      );
    }

    const bundle = createTelegramAdapter({
      botToken: token,
      scheduler: options.scheduler,
    });

    return {
      adapter: bundle.adapter,
      scheduledRunNotifier: createTelegramScheduledRunNotifier(bundle.bot),
    };
  },
};
