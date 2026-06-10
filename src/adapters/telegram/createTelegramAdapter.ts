import { Bot, type Context } from "grammy";
import { ConfigError } from "../../domain/errors.js";
import type { RedeemTask } from "../../domain/task/redeemTask.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import { logger } from "../../utils/utils.js";
import type { TaskInputAdapter } from "../ports/taskInputAdapter.js";
import {
  createSchedulerTriggerHandler,
  runInteractiveApp,
} from "../shared/interactiveApp.js";
import { PROMPT_BACK_TEXT } from "../ports/promptBack.js";
import {
  rejectTelegramPromptBack,
  resolveTelegramCallbackData,
  TelegramPromptPort,
} from "./telegramPromptPort.js";
import { logAdapter } from "../shared/adapterLogger.js";
import {
  clearTelegramChatSession,
  getTelegramChatSession,
} from "./telegramPromptSession.js";

const TELEGRAM_ADAPTER_ID = "telegram";

function resolveTelegramChatId(ctx: Context): number | undefined {
  return ctx.chat?.id ?? ctx.callbackQuery?.message?.chat.id;
}

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

  bot.use(async (ctx, next) => {
    const chatId = resolveTelegramChatId(ctx);
    const updateKind = ctx.callbackQuery
      ? "callback_query"
      : ctx.message?.text?.startsWith("/")
        ? "command"
        : ctx.message?.text
          ? "message"
          : "other";
    logAdapter(TELEGRAM_ADAPTER_ID, `Update received (${updateKind})`, { scope: chatId });
    await next();
  });

  bot.catch((error) => {
    const cause = error.error instanceof Error ? error.error : new Error(String(error.error));
    logger.error("Telegram bot error:", cause);
  });

  bot.command("start", async (ctx) => {
    const chatId = resolveTelegramChatId(ctx);

    if (chatId === undefined) {
      return;
    }

    const session = getTelegramChatSession(chatId);

    if (session.activeLoop) {
      logAdapter(TELEGRAM_ADAPTER_ID, "Rejected /start — session already active", {
        scope: chatId,
      });
      await ctx.reply("A session is already in progress. Finish or send /stop first.");
      return;
    }

    session.activeLoop = true;
    const port = new TelegramPromptPort(bot.api, chatId, session);

    logAdapter(TELEGRAM_ADAPTER_ID, "Starting interactive session (background)", {
      scope: chatId,
    });

    void (async () => {
      try {
        await runInteractiveApp({
          port,
          scheduler,
          source: "telegram",
          title: "Auto Code Redeemer (Telegram)",
          metadata: { telegramChatId: String(chatId) },
        });
        logAdapter(TELEGRAM_ADAPTER_ID, "Interactive session finished normally", {
          scope: chatId,
        });
      } catch (error) {
        const cause = error instanceof Error ? error : new Error(String(error));
        logAdapter(TELEGRAM_ADAPTER_ID, `Session error: ${cause.message}`, {
          scope: chatId,
          level: "error",
        });
        port.error("Session ended with an error.", cause);
      } finally {
        session.activeLoop = false;
        session.pending = null;
        logAdapter(TELEGRAM_ADAPTER_ID, "Session cleanup complete", { scope: chatId });
      }
    })();
  });

  bot.command("stop", async (ctx) => {
    const chatId = ctx.chat?.id;

    if (chatId === undefined) {
      return;
    }

    const session = getTelegramChatSession(chatId);

    logAdapter(TELEGRAM_ADAPTER_ID, "Received /stop", { scope: chatId });

    if (session.pending) {
      session.pending.reject(new Error("Session stopped by user."));
      session.pending = null;
    }

    session.activeLoop = false;
    clearTelegramChatSession(chatId);
    await ctx.reply("Session stopped. Send /start to begin again.");
  });

  bot.on("callback_query:data", async (ctx) => {
    const chatId = resolveTelegramChatId(ctx);

    try {
      if (chatId === undefined) {
        await ctx.answerCallbackQuery();
        return;
      }

      const session = getTelegramChatSession(chatId);
      const pending = session.pending;
      const data = ctx.callbackQuery.data;
      const parsed = resolveTelegramCallbackData(data);

      logAdapter(
        TELEGRAM_ADAPTER_ID,
        `Callback data="${data}" pending=${pending?.kind ?? "none"} parsed=${parsed?.kind ?? "none"}`,
        { scope: chatId },
      );

      if (!pending || !parsed) {
        await ctx.answerCallbackQuery({ text: "Nothing waiting for that action." });
        return;
      }

      if (parsed.kind === "back") {
        if (pending.allowBack !== true) {
          await ctx.answerCallbackQuery({ text: "Can't go back here." });
          return;
        }

        await ctx.answerCallbackQuery();
        logAdapter(TELEGRAM_ADAPTER_ID, "Resolved prompt back", { scope: chatId });
        rejectTelegramPromptBack(pending);
        return;
      }

      if (pending.kind === "choose" && parsed.kind === "choose") {
        await ctx.answerCallbackQuery();
        logAdapter(TELEGRAM_ADAPTER_ID, `Resolved choose → ${parsed.value}`, {
          scope: chatId,
        });
        pending.resolve(parsed.value);
        return;
      }

      if (pending.kind === "yesNo") {
        if (parsed.kind === "yes") {
          await ctx.answerCallbackQuery();
          logAdapter(TELEGRAM_ADAPTER_ID, "Resolved yesNo → true", { scope: chatId });
          pending.resolve(true);
          return;
        }

        if (parsed.kind === "no") {
          await ctx.answerCallbackQuery();
          logAdapter(TELEGRAM_ADAPTER_ID, "Resolved yesNo → false", { scope: chatId });
          pending.resolve(false);
          return;
        }
      }

      await ctx.answerCallbackQuery();
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      logger.error("Telegram callback error:", cause);
      await ctx.answerCallbackQuery({ text: "Something went wrong. Try /stop then /start." });
    }
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
      if (pending.allowBack === true && text.toLowerCase() === PROMPT_BACK_TEXT) {
        logAdapter(TELEGRAM_ADAPTER_ID, `Resolved ${pending.kind} → back`, {
          scope: chatId,
        });
        rejectTelegramPromptBack(pending);
        return;
      }

      logAdapter(TELEGRAM_ADAPTER_ID, `Resolved ${pending.kind} from text message`, {
        scope: chatId,
      });
      pending.resolve(text);
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
      void bot.start().catch((error: unknown) => {
        const cause = error instanceof Error ? error : new Error(String(error));
        logger.error("Telegram polling stopped:", cause);
      });
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
