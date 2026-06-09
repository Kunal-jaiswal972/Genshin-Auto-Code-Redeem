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

  while (true) {
    const answer = (await askQuestion(
      `${prompt} [1-${choices.length} or id]: `,
    )).trim();

    if (answer.length === 0) {
      const first = choices[0];
      if (first) {
        return first.value;
      }
    }

    const index = Number.parseInt(answer, 10);
    if (
      !Number.isNaN(index) &&
      index >= 1 &&
      index <= choices.length
    ) {
      const selected = choices[index - 1];
      if (selected) {
        return selected.value;
      }
    }

    const byId = choices.find((choice) => choice.value === answer);
    if (byId) {
      return byId.value;
    }
  }
}

export async function askYesNo(prompt: string, defaultYes: boolean): Promise<boolean> {
  const hint = defaultYes ? "Y/n" : "y/N";

  while (true) {
    const answer = (await askQuestion(`${prompt} (${hint}): `)).toLowerCase();

    if (answer.length === 0) {
      return defaultYes;
    }

    if (answer === "y" || answer === "yes") {
      return true;
    }

    if (answer === "n" || answer === "no") {
      return false;
    }
  }
}
