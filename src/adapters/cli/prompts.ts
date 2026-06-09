import { confirm, input, password, select } from "@inquirer/prompts";
import readline from "node:readline";

let activeRl: readline.Interface | null = null;

export function closeActivePrompt(): void {
  if (activeRl) {
    activeRl.close();
    activeRl = null;
  }
}

export function askQuestion(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  activeRl = rl;

  rl.on("SIGINT", () => {
    rl.close();
    activeRl = null;
    process.emit("SIGINT");
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      activeRl = null;
      rl.close();
      resolve(answer.trim());
    });
  });
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

export async function askChoice<T extends string>(
  prompt: string,
  choices: readonly ChoiceOption<T>[],
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

  return select({
    message: prompt,
    choices: choices.map((choice) => ({
      name: choice.label,
      value: choice.value,
    })),
  });
}

export async function askUsername(message = "Username"): Promise<string> {
  if (!process.stdin.isTTY) {
    return askQuestion(`${message}: `);
  }

  return input({
    message,
    validate: (value) => {
      if (value.trim().length === 0) {
        return "Username is required.";
      }
      return true;
    },
  });
}

export async function askPassword(message = "Password"): Promise<string> {
  if (!process.stdin.isTTY) {
    return askQuestion(`${message}: `);
  }

  return password({
    message,
    mask: "*",
    validate: (value) => {
      if (value.length === 0) {
        return "Password is required.";
      }
      return true;
    },
  });
}

export async function askYesNo(prompt: string, defaultYes: boolean): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return defaultYes;
  }

  return confirm({
    message: prompt,
    default: defaultYes,
  });
}

export async function askPositiveInteger(prompt: string): Promise<number> {
  while (true) {
    const answer = await askQuestion(`${prompt}: `);
    const value = Number.parseInt(answer, 10);

    if (!Number.isNaN(value) && value >= 1) {
      return value;
    }
  }
}
