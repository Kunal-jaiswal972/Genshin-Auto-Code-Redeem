import type { AppConfig } from "../../types/appConfig.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import type { ScheduledRunNotifier } from "../contracts/scheduledRunNotifier.js";
import type { TaskInputAdapter } from "../contracts/taskInputAdapter.js";
import type { TerminalPorts } from "../shared/terminalPorts.js";
import { cliAdapterModule } from "../cli/core/cliAdapterModule.js";
import { telegramAdapterModule } from "../telegram/core/telegramAdapterModule.js";

export type AdapterLifecycle = "background" | "foreground";

export interface AdapterModuleCreateOptions {
  readonly scheduler: TaskScheduler;
  readonly terminal: TerminalPorts;
  readonly appConfig: AppConfig;
}

export interface AdapterModuleInstance {
  readonly adapter: TaskInputAdapter;
  readonly scheduledRunNotifier?: ScheduledRunNotifier;
}

/** Plug-in input surface. Register implementations in `adapterModules` below. */
export interface AdapterModule {
  readonly id: string;
  readonly label: string;
  readonly lifecycle: AdapterLifecycle;
  isEnabled(appConfig: AppConfig): boolean;
  create(options: AdapterModuleCreateOptions): AdapterModuleInstance;
}

/**
 * Central adapter registry. To add an adapter (e.g. Discord, HTTP API):
 * 1. Implement `AdapterModule` under `adapters/<name>/`
 * 2. Append it here
 */
export const adapterModules = [
  cliAdapterModule,
  telegramAdapterModule,
] as const satisfies readonly AdapterModule[];
