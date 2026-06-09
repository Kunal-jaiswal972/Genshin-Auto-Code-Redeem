import { Bot } from "grammy";
import { ConfigError } from "../../domain/errors.js";
import type { RedeemTask } from "../../domain/task/redeemTask.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import { logger } from "../../utils/utils.js";
import type { TaskInputAdapter } from "../ports/taskInputAdapter.js";
import {
  createSchedulerTriggerHandler,
  runInteractiveApp,
} from "../shared/interactiveApp.js";
import {
  resolveTelegramCallbackData,
  TelegramPromptPort,
} from "./telegramPromptPort.js";
import {
  clearTelegramChatSession,
  getTelegramChatSession,
} from "./telegramPromptSession.js";

export interface CreateTelegramAdapterOptions {
  botToken: string;
  scheduler: TaskScheduler;
}

export interface TelegramAdapterBundle {
  adapter: TaskInputAdapter;
  bot: Bot;
}

export function createTelegramAdapter(
  options: CreateTelegramAdapterOptions,
): TelegramAdapterBundle {
  const bot = new Bot(options.botToken);
  const scheduler = options.scheduler;
  let running = false;

  bot.command("start", async (ctx) => {
    const chatId = ctx.chat?.id;

    if (chatId === undefined) {
      return;
    }

    const session = getTelegramChatSession(chatId);

    if (session.activeLoop) {
      await ctx.reply("A session is already in progress. Finish or send /stop first.");
      return;
    }

    session.activeLoop = true;
    const port = new TelegramPromptPort(bot.api, chatId, session);

    try {
      await runInteractiveApp({
        port,
        scheduler,
        source: "telegram",
        title: "Auto Code Redeemer (Telegram)",
        metadata: { telegramChatId: String(chatId) },
      });
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      port.error("Session ended with an error.", cause);
    } finally {
      session.activeLoop = false;
      session.pending = null;
    }
  });

  bot.command("stop", async (ctx) => {
    const chatId = ctx.chat?.id;

    if (chatId === undefined) {
      return;
    }

    const session = getTelegramChatSession(chatId);

    if (session.pending) {
      session.pending.reject(new Error("Session stopped by user."));
      session.pending = null;
    }

    session.activeLoop = false;
    clearTelegramChatSession(chatId);
    await ctx.reply("Session stopped. Send /start to begin again.");
  });

  bot.on("callback_query:data", async (ctx) => {
    const chatId = ctx.chat?.id;

    if (chatId === undefined) {
      await ctx.answerCallbackQuery();
      return;
    }

    const session = getTelegramChatSession(chatId);
    const pending = session.pending;
    const data = ctx.callbackQuery.data;
    const parsed = resolveTelegramCallbackData(data);

    if (!pending || !parsed) {
      await ctx.answerCallbackQuery({ text: "Nothing waiting for that action." });
      return;
    }

    if (pending.kind === "choose" && parsed.kind === "choose") {
      pending.resolve(parsed.value);
      session.pending = null;
      await ctx.answerCallbackQuery();
      return;
    }

    if (pending.kind === "yesNo") {
      if (parsed.kind === "yes") {
        pending.resolve(true);
        session.pending = null;
        await ctx.answerCallbackQuery();
        return;
      }

      if (parsed.kind === "no") {
        pending.resolve(false);
        session.pending = null;
        await ctx.answerCallbackQuery();
        return;
      }
    }

    await ctx.answerCallbackQuery();
  });

  bot.on("message:text", async (ctx) => {
    const chatId = ctx.chat?.id;
    const text = ctx.message.text?.trim() ?? "";

    if (chatId === undefined || text.length === 0) {
      return;
    }

    if (text.startsWith("/")) {
      return;
    }

    const session = getTelegramChatSession(chatId);
    const pending = session.pending;

    if (!pending) {
      return;
    }

    const textKinds = new Set(["question", "username", "password"]);

    if (textKinds.has(pending.kind)) {
      pending.resolve(text);
      session.pending = null;
    }
  });

  const adapter: TaskInputAdapter = {
    id: "telegram",
    label: "Telegram bot",

    async start(): Promise<void> {
      if (running) {
        return;
      }

      running = true;
      logger.success("Telegram adapter started. Users can send /start to the bot.");
      void bot.start();
    },

    async stop(): Promise<void> {
      if (!running) {
        return;
      }

      await bot.stop();
      running = false;
      logger.info("Telegram adapter stopped.");
    },
  };

  return { adapter, bot };
}

export function createTelegramAdapterFromConfig(
  botToken: string | null,
  scheduler: TaskScheduler,
): TelegramAdapterBundle {
  if (!botToken) {
    throw new ConfigError("TELEGRAM_BOT_TOKEN is required when Telegram adapter is enabled.");
  }

  return createTelegramAdapter({ botToken, scheduler });
}

export async function notifyTelegramScheduledRun(
  bot: Bot,
  task: RedeemTask,
): Promise<void> {
  const chatIdRaw = task.metadata?.telegramChatId;
  const chatId =
    chatIdRaw !== undefined ? Number.parseInt(chatIdRaw, 10) : Number.NaN;

  if (Number.isNaN(chatId)) {
    return;
  }

  const session = getTelegramChatSession(chatId);
  const port = new TelegramPromptPort(bot.api, chatId, session);
  const handler = createSchedulerTriggerHandler(port);
  await handler(task);
}
