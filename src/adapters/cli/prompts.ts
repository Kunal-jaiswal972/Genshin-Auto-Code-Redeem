import * as clack from "@clack/prompts";
import type { PromptOptions } from "../ports/promptPort.js";
import {
  PROMPT_BACK_CHOICE_VALUE,
  PROMPT_BACK_LABEL,
  PROMPT_BACK_TEXT,
  PromptBackError,
} from "../ports/promptBack.js";

function isBackText(answer: string): boolean {
  return answer.trim().toLowerCase() === PROMPT_BACK_TEXT;
}

function resolveClackCancel(allowBack: boolean): never {
  if (allowBack) {
    throw new PromptBackError();
  }

  throw new Error("Prompt cancelled.");
}

function unwrapClackResult<T>(result: T | symbol, allowBack = false): T {
  if (clack.isCancel(result)) {
    resolveClackCancel(allowBack);
  }

  return result;
}

export function closeActivePrompt(): void {
  // Clack manages its own readline lifecycle per prompt.
}

export async function askQuestion(prompt: string, options?: PromptOptions): Promise<string> {
  if (!process.stdin.isTTY) {
    return "";
  }

  const result = await clack.text({
    message: prompt,
  });

  const value = unwrapClackResult(result, options?.allowBack === true).trim();

  if (options?.allowBack === true && isBackText(value)) {
    throw new PromptBackError();
  }

  return value;
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

async function askClackChoice<T extends string>(
  prompt: string,
  choices: readonly ChoiceOption<T>[],
  allowBack: boolean,
): Promise<T> {
  const options: { value: string; label: string }[] = [];

  if (allowBack) {
    options.push({
      value: PROMPT_BACK_CHOICE_VALUE,
      label: PROMPT_BACK_LABEL,
    });
  }

  for (const choice of choices) {
    options.push({
      value: choice.value,
      label: choice.label,
    });
  }

  const firstSelectable = allowBack ? options[1] : options[0];

  const result = await clack.select({
    message: prompt,
    options,
    initialValue: firstSelectable?.value,
    maxItems: Math.min(options.length, 12),
  });

  if (clack.isCancel(result)) {
    resolveClackCancel(allowBack);
  }

  if (result === PROMPT_BACK_CHOICE_VALUE) {
    throw new PromptBackError();
  }

  return result as T;
}

export async function askChoice<T extends string>(
  prompt: string,
  choices: readonly ChoiceOption<T>[],
  options?: PromptOptions,
): Promise<T> {
  if (choices.length === 0) {
    throw new Error("askChoice requires at least one choice.");
  }

  if (!process.stdin.isTTY) {
    const first = choices[0];
    if (!first) {
      throw new Error("askChoice requires at least one choice.");
    }
    return first.value;
  }

  return askClackChoice(prompt, choices, options?.allowBack === true);
}

export async function askUsername(message = "Username"): Promise<string> {
  if (!process.stdin.isTTY) {
    return askQuestion(`${message}: `);
  }

  const result = await clack.text({
    message,
    validate: (value) => {
      if ((value ?? "").trim().length === 0) {
        return "Username is required.";
      }

      return undefined;
    },
  });

  return unwrapClackResult(result).trim();
}

export async function askPassword(message = "Password"): Promise<string> {
  if (!process.stdin.isTTY) {
    return askQuestion(`${message}: `);
  }

  const result = await clack.password({
    message,
    validate: (value) => {
      if ((value ?? "").length === 0) {
        return "Password is required.";
      }

      return undefined;
    },
  });

  return unwrapClackResult(result);
}

export async function askYesNo(prompt: string, defaultYes: boolean): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return defaultYes;
  }

  const result = await clack.confirm({
    message: prompt,
    initialValue: defaultYes,
  });

  if (clack.isCancel(result)) {
    return defaultYes;
  }

  return result;
}

export async function askPositiveInteger(prompt: string): Promise<number> {
  while (true) {
    const result = await clack.text({
      message: `${prompt} (enter a number ≥ 1)`,
      validate: (value) => {
        const parsed = Number.parseInt((value ?? "").trim(), 10);

        if (Number.isNaN(parsed) || parsed < 1) {
          return "Enter a whole number ≥ 1.";
        }

        return undefined;
      },
    });

    const value = unwrapClackResult(result).trim();
    const parsed = Number.parseInt(value, 10);

    if (!Number.isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
  }
}
