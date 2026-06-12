import type { ScheduleSpec } from "../../../domain/schedule/scheduleSpec.js";
import {
  addCalendarDaysInTimezone,
  atTimeOnDateInTimezone,
  getSchedulerTimezone,
} from "../../schedulerTimezone.js";
import type { ScheduleDriver } from "../createScheduleDriverRegistry.js";

type DailySchedule = Extract<ScheduleSpec, { type: "daily" }>;

function computeDailyNextRun(at: string, from: Date): Date {
  const timeZone = getSchedulerTimezone();
  const candidate = atTimeOnDateInTimezone(from, at, timeZone);

  if (candidate <= from) {
    const nextDay = addCalendarDaysInTimezone(from, 1, timeZone);
    return atTimeOnDateInTimezone(nextDay, at, timeZone);
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
