import type { ScheduleSpec } from "../../../domain/schedule/scheduleSpec.js";
import { atTimeOnDate } from "../../timeOfDay.js";
import type { ScheduleDriver } from "../createScheduleDriverRegistry.js";

type DailySchedule = Extract<ScheduleSpec, { type: "daily" }>;

function computeDailyNextRun(at: string, from: Date): Date {
  const candidate = atTimeOnDate(from, at);

  if (candidate <= from) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

export const dailyScheduleDriver: ScheduleDriver<DailySchedule> = {
  type: "daily",

  computeNextRunAt(schedule, from): string | null {
    return computeDailyNextRun(schedule.at, from).toISOString();
  },

  isOneShot(_schedule): boolean {
    return false;
  },
};
