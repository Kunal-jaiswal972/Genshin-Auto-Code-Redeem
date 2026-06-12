import { getAppConfig } from "../config/appConfig.js";
import { createScheduledTaskStore } from "../infrastructure/storage/stores/createScheduledTaskStore.js";
import type { SchedulerTriggerHandler } from "./scheduler.js";
import { SchedulerRunner } from "./schedulerRunner.js";

export interface CreateSchedulerOptions {
  onTrigger: SchedulerTriggerHandler;
}

export function createScheduler(options: CreateSchedulerOptions): SchedulerRunner {
  const appConfig = getAppConfig();
  const store = createScheduledTaskStore(appConfig);

  return new SchedulerRunner({
    store,
    onTrigger: options.onTrigger,
    pollIntervalMs: appConfig.schedulerPollIntervalMs,
  });
}
