import { InlineKeyboard, type Api } from "grammy";
import type { PromptChoice, PromptPort } from "../ports/promptPort.js";
import type {
  PendingPromptKind,
  TelegramChatSession,
} from "./telegramPromptSession.js";

const CHOOSE_PREFIX = "choose:";
const YES_PREFIX = "yesno:yes";
const NO_PREFIX = "yesno:no";

export class TelegramPromptPort implements PromptPort {
  private readonly api: Api;
  private readonly chatId: number;
  private readonly session: TelegramChatSession;

  constructor(api: Api, chatId: number, session: TelegramChatSession) {
    this.api = api;
    this.chatId = chatId;
    this.session = session;
  }

  async choose<T extends string>(
    message: string,
    choices: readonly PromptChoice<T>[],
  ): Promise<T> {
    if (choices.length === 0) {
      throw new Error("choose requires at least one option.");
    }

    const keyboard = new InlineKeyboard();

    for (const choice of choices) {
      keyboard.text(choice.label, `${CHOOSE_PREFIX}${choice.value}`).row();
    }

    await this.api.sendMessage(this.chatId, message, {
      reply_markup: keyboard,
    });

    const value = await this.waitForString("choose");

    const match = choices.find((choice) => choice.value === value);

    if (!match) {
      throw new Error(`Invalid choice: ${value}`);
    }

    return match.value;
  }

  async question(message: string): Promise<string> {
    await this.api.sendMessage(this.chatId, message);
    return this.waitForString("question");
  }

  async yesNo(message: string, defaultYes: boolean): Promise<boolean> {
    const keyboard = new InlineKeyboard()
      .text("Yes", YES_PREFIX)
      .text("No", NO_PREFIX);

    const hint = defaultYes ? " (default: Yes)" : " (default: No)";
    await this.api.sendMessage(this.chatId, `${message}${hint}`, {
      reply_markup: keyboard,
    });

    return this.waitForBoolean(defaultYes);
  }

  async username(message = "Username"): Promise<string> {
    await this.api.sendMessage(this.chatId, `${message}:`);
    const value = await this.waitForString("username");

    if (value.trim().length === 0) {
      throw new Error("Username is required.");
    }

    return value.trim();
  }

  async password(message = "Password"): Promise<string> {
    await this.api.sendMessage(
      this.chatId,
      `${message}: (send your password in the next message — delete it after if you like)`,
    );
    const value = await this.waitForString("password");

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

  private waitForString(kind: PendingPromptKind): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.session.pending = {
        kind,
        resolve: (value) => {
          if (typeof value !== "string") {
            reject(new Error("Expected string response."));
            return;
          }

          resolve(value);
        },
        reject,
      };
    });
  }

  private waitForBoolean(defaultYes: boolean): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.session.pending = {
        kind: "yesNo",
        defaultYes,
        resolve: (value) => {
          if (typeof value !== "boolean") {
            reject(new Error("Expected boolean response."));
            return;
          }

          resolve(value);
        },
        reject,
      };
    });
  }
}

export function resolveTelegramCallbackData(
  data: string,
): { kind: "choose"; value: string } | { kind: "yes" } | { kind: "no" } | null {
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
