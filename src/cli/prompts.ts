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
