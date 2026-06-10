/** Sentinel choice value used by CLI when Back is offered in a select list. */
export const PROMPT_BACK_CHOICE_VALUE = "__prompt_back__";

export const PROMPT_BACK_LABEL = "← Back";

/** Telegram inline-button callback data for Back. */
export const TELEGRAM_BACK_CALLBACK = "prompt:back";

/** CLI/Telegram text reply that means Back on free-form prompts. */
export const PROMPT_BACK_TEXT = "back";

export class PromptBackError extends Error {
  constructor() {
    super("User chose to go back.");
    this.name = "PromptBackError";
  }
}

export function isPromptBack(error: unknown): error is PromptBackError {
  return error instanceof PromptBackError;
}
