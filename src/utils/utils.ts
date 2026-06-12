import chalk from "chalk";
import { DATE_FORMAT_RUN } from "../config/constants.js";
import type {
  GetRandomDelayOptions,
  WaitOptions,
  WaitUntilOptions,
} from "../types/utils.js";

export function getTodayRunDate(): string {
  return new Date().toISOString().slice(0, DATE_FORMAT_RUN.length);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomDelay(options: GetRandomDelayOptions): number {
  return randomInt(options.min, options.max);
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

export function formatAccountLabel(username: string): string {
  return maskSecret(username.trim());
}

export function formatWaitMs(ms: number): string {
  return `${ms}ms`;
}

export interface FormatScheduleInstantOptions {
  timeZone?: string;
}

export function formatScheduleInstant(
  iso: string | null | undefined,
  options?: FormatScheduleInstantOptions,
): string {
  if (!iso) {
    return "none";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(options?.timeZone !== undefined ? { timeZone: options.timeZone } : {}),
  });
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function formatTimeUntil(iso: string, now: Date = new Date()): string {
  const target = new Date(iso);

  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "due now";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "due now";
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    const dayLabel = diffDays === 1 ? "day" : "day(s)";
    return `${diffDays} ${dayLabel} left`;
  }

  if (diffHours >= 1) {
    return `${diffHours} hr left`;
  }

  return `${diffMinutes} min left`;
}

/** Fixed delay. Logs planned duration before waiting starts. */
export async function wait(options: WaitOptions): Promise<void> {
  if (options.reason) {
    logger.wait(`Waiting ${formatWaitMs(options.ms)} — ${options.reason}`);
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, options.ms);
  });
}

/** Async wait (selector, network, modal, etc.). Logs before waiting; pass maxMs when there is a timeout. */
export async function waitUntil<T>(options: WaitUntilOptions<T>): Promise<T> {
  const maxLabel =
    options.maxMs !== undefined ? ` (max ${formatWaitMs(options.maxMs)})` : "";
  logger.wait(`Waiting — ${options.reason}${maxLabel}`);
  return options.operation();
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
