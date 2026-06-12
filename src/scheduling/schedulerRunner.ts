import { randomUUID } from "node:crypto";
import type { RedeemTask } from "../domain/task/redeemTask.js";
import type { ScheduledTask } from "../domain/task/scheduledTask.js";
import type { ScheduledTaskStore } from "../infrastructure/storage/stores/scheduledTaskStore.js";
import { formatSchedulerInstant } from "./scheduleTime.js";
import { logger } from "../utils/utils.js";
import {
  computeNextRunAt,
  rescheduleAfterRun,
} from "./drivers/scheduleDrivers.js";
import type {
  RegisterScheduleOptions,
  SchedulerTriggerHandler,
  TaskScheduler,
} from "./scheduler.js";
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const MAX_DUE_TIMER_MS = 2_147_483_647;

export interface SchedulerRunnerOptions {
  store: ScheduledTaskStore;
  onTrigger: SchedulerTriggerHandler;
  pollIntervalMs?: number;
}

function materializeRedeemTask(
  template: RegisterScheduleOptions["redeemTask"],
  scheduledTaskId: string,
): RedeemTask {
  return {
    id: randomUUID(),
    gameId: template.gameId,
    credentials: template.credentials,
    scrapePolicy: template.scrapePolicy,
    source: "scheduler",
    createdAt: new Date().toISOString(),
    metadata: {
      scheduledTaskId,
      ...template.metadata,
    },
  };
}

export class SchedulerRunner implements TaskScheduler {
  private readonly store: ScheduledTaskStore;
  private readonly onTrigger: SchedulerTriggerHandler;
  private readonly pollIntervalMs: number;
  private pollTimer: NodeJS.Timeout | null = null;
  private dueTimer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(options: SchedulerRunnerOptions) {
    this.store = options.store;
    this.onTrigger = options.onTrigger;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  }

  async register(options: RegisterScheduleOptions): Promise<ScheduledTask> {
    const task: ScheduledTask = {
      id: randomUUID(),
      redeemTaskTemplate: options.redeemTask,
      schedule: options.schedule,
      enabled: true,
      lastRunAt: null,
      nextRunAt: computeNextRunAt(options.schedule),
    };

    await this.store.upsert(task);
    this.armDueTimer();
    return task;
  }

  async cancel(taskId: string): Promise<void> {
    await this.store.delete(taskId);
    this.armDueTimer();
  }

  async list(): Promise<ScheduledTask[]> {
    return this.store.list();
  }

  async start(): Promise<void> {
    if (this.pollTimer) {
      return;
    }

    this.pollTimer = setInterval(() => {
      void this.tick();
    }, this.pollIntervalMs);

    void this.tick();
    this.armDueTimer();
  }

  async stop(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.dueTimer) {
      clearTimeout(this.dueTimer);
      this.dueTimer = null;
    }
  }

  private armDueTimer(): void {
    if (this.dueTimer) {
      clearTimeout(this.dueTimer);
      this.dueTimer = null;
    }

    void this.scheduleDueTimer();
  }

  private async scheduleDueTimer(): Promise<void> {
    const tasks = await this.store.list();
    const now = Date.now();
    let nearestDueMs: number | null = null;

    for (const scheduled of tasks) {
      if (!scheduled.enabled || !scheduled.nextRunAt) {
        continue;
      }

      const dueAt = new Date(scheduled.nextRunAt).getTime();

      if (Number.isNaN(dueAt) || dueAt <= now) {
        continue;
      }

      if (nearestDueMs === null || dueAt < nearestDueMs) {
        nearestDueMs = dueAt;
      }
    }

    if (nearestDueMs === null) {
      return;
    }

    const delay = Math.min(nearestDueMs - now, MAX_DUE_TIMER_MS);

    this.dueTimer = setTimeout(() => {
      void this.tick();
    }, delay);
  }

  private async tick(): Promise<void> {
    if (this.ticking) {
      return;
    }

    this.ticking = true;

    try {
      const now = Date.now();
      const tasks = await this.store.list();

      for (const scheduled of tasks) {
        if (!scheduled.enabled || !scheduled.nextRunAt) {
          continue;
        }

        const dueAt = new Date(scheduled.nextRunAt).getTime();

        if (Number.isNaN(dueAt) || dueAt > now) {
          continue;
        }

        await this.runScheduledTask(scheduled);
      }
    } finally {
      this.ticking = false;
      this.armDueTimer();
    }
  }

  private async runScheduledTask(scheduled: ScheduledTask): Promise<void> {
    const claimedAt = new Date();
    const nextRunAt = rescheduleAfterRun(scheduled.schedule, claimedAt);

    await this.store.upsert({
      ...scheduled,
      lastRunAt: claimedAt.toISOString(),
      nextRunAt,
      enabled: nextRunAt !== null,
    });

    const redeemTask = materializeRedeemTask(
      scheduled.redeemTaskTemplate,
      scheduled.id,
    );

    logger.step(
      `Scheduled task ${scheduled.id} triggered at ${formatSchedulerInstant(claimedAt.toISOString())}.`,
    );

    if (nextRunAt) {
      logger.gray(`Next run: ${formatSchedulerInstant(nextRunAt)}`);
    }

    try {
      await this.onTrigger(redeemTask);
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      logger.error(`Scheduled task ${scheduled.id} failed:`, cause);
    }

    if (!nextRunAt) {
      logger.info(`Scheduled task ${scheduled.id} completed (one-shot).`);
    }
  }
}
