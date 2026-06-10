import { InlineKeyboard, type Api } from "grammy";
import type { DisplayCard } from "../shared/display/displayCard.js";
import { formatDisplayCardTelegramHtml } from "../shared/display/displayCard.js";
import type { PromptChoice, PromptOptions, PromptPort } from "../ports/promptPort.js";
import {
  PROMPT_BACK_LABEL,
  PromptBackError,
  TELEGRAM_BACK_CALLBACK,
} from "../ports/promptBack.js";
import {
  createAdapterLogger,
  type AdapterLogger,
} from "../shared/adapterLogger.js";
import type {
  PendingPromptKind,
  TelegramChatSession,
} from "./telegramPromptSession.js";

const TELEGRAM_ADAPTER_ID = "telegram";

const CHOOSE_PREFIX = "choose:";
const YES_PREFIX = "yesno:yes";
const NO_PREFIX = "yesno:no";

export class TelegramPromptPort implements PromptPort {
  private readonly api: Api;
  private readonly chatId: number;
  private readonly session: TelegramChatSession;
  private readonly adapterLog: AdapterLogger;

  constructor(api: Api, chatId: number, session: TelegramChatSession) {
    this.api = api;
    this.chatId = chatId;
    this.session = session;
    this.adapterLog = createAdapterLogger(TELEGRAM_ADAPTER_ID, chatId);
  }

  async choose<T extends string>(
    message: string,
    choices: readonly PromptChoice<T>[],
    options?: PromptOptions,
  ): Promise<T> {
    if (choices.length === 0) {
      throw new Error("choose requires at least one option.");
    }

    const allowBack = options?.allowBack === true;
    const valuePromise = this.waitForString("choose", allowBack);
    this.adapterLog.debug(`Prompt choose: ${message} (${choices.length} options)`);

    const keyboard = new InlineKeyboard();

    if (allowBack) {
      keyboard.text(PROMPT_BACK_LABEL, TELEGRAM_BACK_CALLBACK).row();
    }

    for (const choice of choices) {
      keyboard.text(choice.label, `${CHOOSE_PREFIX}${choice.value}`).row();
    }

    await this.api.sendMessage(this.chatId, message, {
      reply_markup: keyboard,
    });

    const value = await valuePromise;

    const match = choices.find((choice) => choice.value === value);

    if (!match) {
      throw new Error(`Invalid choice: ${value}`);
    }

    return match.value;
  }

  async question(message: string, options?: PromptOptions): Promise<string> {
    const allowBack = options?.allowBack === true;
    const valuePromise = this.waitForString("question", allowBack);
    this.adapterLog.debug(`Prompt question: ${message}`);

    const replyMarkup = allowBack
      ? new InlineKeyboard().text(PROMPT_BACK_LABEL, TELEGRAM_BACK_CALLBACK)
      : undefined;

    await this.api.sendMessage(this.chatId, message, {
      reply_markup: replyMarkup,
    });

    return valuePromise;
  }

  async yesNo(message: string, defaultYes: boolean): Promise<boolean> {
    const answerPromise = this.waitForBoolean(defaultYes);
    this.adapterLog.debug(`Prompt yesNo: ${message}`);

    const keyboard = new InlineKeyboard()
      .text("Yes", YES_PREFIX)
      .text("No", NO_PREFIX);

    const hint = defaultYes ? " (default: Yes)" : " (default: No)";
    await this.api.sendMessage(this.chatId, `${message}${hint}`, {
      reply_markup: keyboard,
    });

    return answerPromise;
  }

  async username(message = "Username"): Promise<string> {
    const valuePromise = this.waitForString("username");
    this.adapterLog.debug("Prompt username");
    await this.api.sendMessage(this.chatId, `${message}:`);
    const value = await valuePromise;

    if (value.trim().length === 0) {
      throw new Error("Username is required.");
    }

    return value.trim();
  }

  async password(message = "Password"): Promise<string> {
    const valuePromise = this.waitForString("password");
    this.adapterLog.debug("Prompt password");
    await this.api.sendMessage(
      this.chatId,
      `${message}: (send your password in the next message — delete it after if you like)`,
    );
    const value = await valuePromise;

    if (value.length === 0) {
      throw new Error("Password is required.");
    }

    return value;
  }

  async positiveInteger(message: string): Promise<number> {
    while (true) {
      const answer = await this.question(`${message} (enter a number ≥ 1):`);
      const value = Number.parseInt(answer.trim(), 10);

      if (!Number.isNaN(value) && value >= 1) {
        return value;
      }

      await this.api.sendMessage(this.chatId, "Please enter a whole number ≥ 1.");
    }
  }

  step(message: string): void {
    void this.api.sendMessage(this.chatId, `▶ ${message}`);
  }

  info(message: string): void {
    void this.api.sendMessage(this.chatId, message);
  }

  success(message: string): void {
    void this.api.sendMessage(this.chatId, `✅ ${message}`);
  }

  warn(message: string): void {
    void this.api.sendMessage(this.chatId, `⚠ ${message}`);
  }

  gray(message: string): void {
    void this.api.sendMessage(this.chatId, message);
  }

  error(message: string, error?: Error): void {
    const detail = error?.message ?? "";
    const text = detail.length > 0 ? `${message} ${detail}` : message;
    void this.api.sendMessage(this.chatId, `❌ ${text}`);
  }

  displayCards(cards: readonly DisplayCard[]): void {
    for (const card of cards) {
      void this.api.sendMessage(this.chatId, formatDisplayCardTelegramHtml(card), {
        parse_mode: "HTML",
      });
    }
  }

  private waitForString(kind: PendingPromptKind, allowBack = false): Promise<string> {
    if (this.session.pending) {
      this.session.pending.reject(new Error("Replaced by a new prompt."));
    }

    return new Promise<string>((resolve, reject) => {
      this.session.pending = {
        kind,
        allowBack,
        resolve: (value) => {
          if (typeof value !== "string") {
            reject(new Error("Expected string response."));
            return;
          }

          this.session.pending = null;
          resolve(value);
        },
        reject: (error) => {
          this.session.pending = null;
          reject(error);
        },
      };
    });
  }

  private waitForBoolean(defaultYes: boolean): Promise<boolean> {
    if (this.session.pending) {
      this.session.pending.reject(new Error("Replaced by a new prompt."));
    }

    return new Promise<boolean>((resolve, reject) => {
      this.session.pending = {
        kind: "yesNo",
        defaultYes,
        resolve: (value) => {
          if (typeof value !== "boolean") {
            reject(new Error("Expected boolean response."));
            return;
          }

          this.session.pending = null;
          resolve(value);
        },
        reject: (error) => {
          this.session.pending = null;
          reject(error);
        },
      };
    });
  }
}

export function resolveTelegramCallbackData(
  data: string,
): { kind: "choose"; value: string } | { kind: "yes" } | { kind: "no" } | { kind: "back" } | null {
  if (data === TELEGRAM_BACK_CALLBACK) {
    return { kind: "back" };
  }

  if (data.startsWith(CHOOSE_PREFIX)) {
    return { kind: "choose", value: data.slice(CHOOSE_PREFIX.length) };
  }

  if (data === YES_PREFIX) {
    return { kind: "yes" };
  }

  if (data === NO_PREFIX) {
    return { kind: "no" };
  }

  return null;
}

export function rejectTelegramPromptBack(
  pending: NonNullable<TelegramChatSession["pending"]>,
): void {
  pending.reject(new PromptBackError());
}
