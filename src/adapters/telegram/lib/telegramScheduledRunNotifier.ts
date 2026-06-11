import type { Bot } from "grammy";
import type { RedeemTask } from "../../../domain/task/redeemTask.js";
import type { ScheduledRunNotifier } from "../../contracts/scheduledRunNotifier.js";
import { createScheduledRunHandler } from "../../shared/scheduledRunHandler.js";
import { TelegramPromptPort } from "../core/telegramPromptPort.js";
import { getTelegramChatSession } from "./telegramPromptSession.js";

function resolveTelegramChatId(task: RedeemTask): number | null {
  const chatIdRaw = task.metadata?.telegramChatId;
  const chatId =
    chatIdRaw !== undefined ? Number.parseInt(chatIdRaw, 10) : Number.NaN;

  return Number.isNaN(chatId) ? null : chatId;
}

export function createTelegramScheduledRunNotifier(
  bot: Bot,
): ScheduledRunNotifier {
  return {
    canNotify(task: RedeemTask): boolean {
      return resolveTelegramChatId(task) !== null;
    },

    async notify(task: RedeemTask): Promise<void> {
      const chatId = resolveTelegramChatId(task);

      if (chatId === null) {
        return;
      }

      const session = getTelegramChatSession(chatId);
      const port = new TelegramPromptPort(bot.api, chatId, session);
      const handler = createScheduledRunHandler(port);
      await handler(task);
    },
  };
}
