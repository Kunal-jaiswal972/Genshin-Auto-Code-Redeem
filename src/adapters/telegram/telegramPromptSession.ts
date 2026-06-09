import type { PromptChoice } from "../ports/promptPort.js";

export type PendingPromptKind = "choose" | "question" | "yesNo" | "username" | "password";

export interface PendingPrompt {
  readonly kind: PendingPromptKind;
  readonly choices?: readonly PromptChoice[];
  readonly defaultYes?: boolean;
  readonly resolve: (value: string | boolean) => void;
  readonly reject: (error: Error) => void;
}

export interface TelegramChatSession {
  activeLoop: boolean;
  pending: PendingPrompt | null;
}

export function createTelegramChatSession(): TelegramChatSession {
  return {
    activeLoop: false,
    pending: null,
  };
}

const chatSessions = new Map<number, TelegramChatSession>();

export function getTelegramChatSession(chatId: number): TelegramChatSession {
  const existing = chatSessions.get(chatId);

  if (existing) {
    return existing;
  }

  const session = createTelegramChatSession();
  chatSessions.set(chatId, session);
  return session;
}

export function clearTelegramChatSession(chatId: number): void {
  chatSessions.delete(chatId);
}
