import chalk from "chalk";
import { DATE_FORMAT_RUN } from "../config/constants.js";

export function getTodayRunDate(): string {
  return new Date().toISOString().slice(0, DATE_FORMAT_RUN.length);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomDelay(min: number, max: number): number {
  return randomInt(min, max);
}

export function maskSecret(text: string): string {
  if (text.length === 0) {
    return "[empty]";
  }

  if (text.length <= 2) {
    return "*".repeat(text.length);
  }

  return `${text.substring(0, 2)}${"*".repeat(text.length - 2)}`;
}

export function formatAccountLabel(email: string): string {
  return maskSecret(email.trim());
}

export function formatWaitMs(ms: number): string {
  return `${ms}ms`;
}

/** Fixed delay. Logs planned duration before waiting starts. */
export async function wait(ms: number, reason?: string): Promise<void> {
  if (reason) {
    logger.wait(`Waiting ${formatWaitMs(ms)} — ${reason}`);
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Async wait (selector, network, modal, etc.). Logs before waiting; pass maxMs when there is a timeout. */
export async function waitUntil<T>(
  reason: string,
  operation: () => Promise<T>,
  maxMs?: number,
): Promise<T> {
  const maxLabel = maxMs !== undefined ? ` (max ${formatWaitMs(maxMs)})` : "";
  logger.wait(`Waiting — ${reason}${maxLabel}`);
  return operation();
}

export const logger = {
  info(message: string): void {
    console.log(chalk.cyan(message));
  },

  success(message: string): void {
    console.log(chalk.green(message));
  },

  warn(message: string): void {
    console.log(chalk.yellow(message));
  },

  error(message: string, error?: Error): void {
    if (error) {
      console.error(chalk.red(message), error.message);
      return;
    }

    console.error(chalk.red(message));
  },

  step(message: string): void {
    console.log(chalk.blueBright(message));
  },

  gray(message: string): void {
    console.log(chalk.gray(message));
  },

  wait(message: string): void {
    console.log(chalk.magenta(message));
  },
};
