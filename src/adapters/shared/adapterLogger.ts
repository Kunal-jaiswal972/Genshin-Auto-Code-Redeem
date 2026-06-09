import chalk from "chalk";

export type AdapterLogLevel = "debug" | "info" | "warn" | "error";

export interface AdapterLogOptions {
  scope?: string | number;
  level?: AdapterLogLevel;
}

export interface AdapterLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
}

const ADAPTER_PREFIX_COLORS: Record<string, (text: string) => string> = {
  telegram: chalk.hex("#2AABEE"),
  cli: chalk.green,
  server: chalk.blueBright,
  discord: chalk.hex("#5865F2"),
  api: chalk.magenta,
};

function colorizeAdapterPrefix(adapterId: string, prefix: string): string {
  const colorize = ADAPTER_PREFIX_COLORS[adapterId] ?? chalk.cyan;
  return colorize(prefix);
}

export function formatAdapterLogPrefix(
  adapterId: string,
  scope?: string | number,
): string {
  if (scope !== undefined && String(scope).length > 0) {
    return `[${adapterId}:${scope}]`;
  }

  return `[${adapterId}]`;
}

function writeAdapterLogLine(
  adapterId: string,
  prefix: string,
  message: string,
  level: AdapterLogLevel,
  error?: Error,
): void {
  const coloredPrefix = colorizeAdapterPrefix(adapterId, prefix);

  switch (level) {
    case "info":
      console.log(`${coloredPrefix} ${chalk.cyan(message)}`);
      break;
    case "warn":
      console.log(`${coloredPrefix} ${chalk.yellow(message)}`);
      break;
    case "error":
      if (error) {
        console.error(`${coloredPrefix} ${chalk.red(message)}`, error.message);
        break;
      }

      console.error(`${coloredPrefix} ${chalk.red(message)}`);
      break;
    default:
      console.log(`${coloredPrefix} ${chalk.gray(message)}`);
  }
}

export function logAdapter(
  adapterId: string,
  message: string,
  options?: AdapterLogOptions,
): void {
  const prefix = formatAdapterLogPrefix(adapterId, options?.scope);
  const level = options?.level ?? "debug";
  writeAdapterLogLine(adapterId, prefix, message, level);
}

export function createAdapterLogger(
  adapterId: string,
  scope?: string | number,
): AdapterLogger {
  return {
    debug(message: string): void {
      logAdapter(adapterId, message, { scope, level: "debug" });
    },
    info(message: string): void {
      logAdapter(adapterId, message, { scope, level: "info" });
    },
    warn(message: string): void {
      logAdapter(adapterId, message, { scope, level: "warn" });
    },
    error(message: string, error?: Error): void {
      const prefix = formatAdapterLogPrefix(adapterId, scope);
      writeAdapterLogLine(adapterId, prefix, message, "error", error);
    },
  };
}
