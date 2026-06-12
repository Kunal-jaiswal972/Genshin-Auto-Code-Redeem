import type { SchedulerTriggerHandler } from "../../scheduling/scheduler.js";
import type { PromptPort } from "../contracts/promptPort.js";
import type { ScheduledRunNotifier } from "../contracts/scheduledRunNotifier.js";
import { createScheduledRunHandler } from "./scheduledRunHandler.js";

export interface CreateSchedulerOnTriggerOptions {
  readonly terminalPrompt: PromptPort;
  readonly getScheduledRunNotifiers: () => readonly ScheduledRunNotifier[];
}

export function createSchedulerOnTrigger(
  options: CreateSchedulerOnTriggerOptions,
): SchedulerTriggerHandler {
  const { terminalPrompt, getScheduledRunNotifiers } = options;

  return async (task) => {
    for (const notifier of getScheduledRunNotifiers()) {
      if (notifier.canNotify(task)) {
        await notifier.notify(task);
        return;
      }
    }

    const handler = createScheduledRunHandler(terminalPrompt);
    await handler(task);
  };
}
