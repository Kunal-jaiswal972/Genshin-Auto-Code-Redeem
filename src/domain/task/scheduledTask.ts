import type { RedeemTask } from "./redeemTask.js";
import type { ScheduleSpec } from "../schedule/scheduleSpec.js";

export interface ScheduledTask {
  readonly id: string;
  readonly redeemTaskTemplate: Omit<RedeemTask, "id" | "createdAt" | "source">;
  readonly schedule: ScheduleSpec;
  readonly enabled: boolean;
  readonly lastRunAt: string | null;
  readonly nextRunAt: string | null;
}
