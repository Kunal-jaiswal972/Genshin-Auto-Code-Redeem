import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { ScheduledTask } from "../domain/task/scheduledTask.js";
import type { ScheduleSpec } from "../domain/schedule/scheduleSpec.js";

export interface RegisterScheduleOptions {
  redeemTask: Omit<RedeemTask, "id" | "createdAt" | "source">;
  schedule: ScheduleSpec;
}

export interface TaskScheduler {
  register(options: RegisterScheduleOptions): Promise<ScheduledTask>;
  cancel(taskId: string): Promise<void>;
  list(): Promise<ScheduledTask[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type SchedulerTriggerHandler = (task: RedeemTask) => Promise<void>;
