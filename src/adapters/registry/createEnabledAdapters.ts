import { ConfigError } from "../../domain/errors.js";
import type { AppConfig } from "../../types/appConfig.js";
import type { TaskScheduler } from "../../scheduling/scheduler.js";
import type { ScheduledRunNotifier } from "../contracts/scheduledRunNotifier.js";
import type { TaskInputAdapter } from "../contracts/taskInputAdapter.js";
import type { TerminalPorts } from "../shared/terminalPorts.js";
import { adapterModules, type AdapterModuleCreateOptions } from "./adapterModules.js";

export interface CreateEnabledAdaptersOptions {
  readonly scheduler: TaskScheduler;
  readonly terminal: TerminalPorts;
  readonly appConfig: AppConfig;
}

export interface EnabledAdapters {
  readonly background: readonly TaskInputAdapter[];
  readonly foreground: TaskInputAdapter | null;
  readonly scheduledRunNotifiers: readonly ScheduledRunNotifier[];
  readonly labels: readonly string[];
}

export function createEnabledAdapters(
  options: CreateEnabledAdaptersOptions,
): EnabledAdapters {
  const { appConfig } = options;
  const createOptions: AdapterModuleCreateOptions = {
    scheduler: options.scheduler,
    terminal: options.terminal,
    appConfig,
  };

  const background: TaskInputAdapter[] = [];
  let foreground: TaskInputAdapter | null = null;
  const scheduledRunNotifiers: ScheduledRunNotifier[] = [];
  const labels: string[] = [];

  for (const module of adapterModules) {
    if (!module.isEnabled(appConfig)) {
      continue;
    }

    const instance = module.create(createOptions);

    if (module.lifecycle === "foreground") {
      if (foreground !== null) {
        throw new ConfigError(
          `Multiple foreground adapters enabled (${foreground.id}, ${module.id}). Only one is allowed.`,
        );
      }

      foreground = instance.adapter;
    } else {
      background.push(instance.adapter);
    }

    if (instance.scheduledRunNotifier) {
      scheduledRunNotifiers.push(instance.scheduledRunNotifier);
    }

    labels.push(instance.adapter.label);
  }

  return {
    background,
    foreground,
    scheduledRunNotifiers,
    labels,
  };
}
