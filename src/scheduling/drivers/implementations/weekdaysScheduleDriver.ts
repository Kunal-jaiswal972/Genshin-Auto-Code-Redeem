import type { ScheduleSpec } from "../../../domain/schedule/scheduleSpec.js";
import {
  addCalendarDaysInTimezone,
  atTimeOnDateInTimezone,
  getSchedulerTimezone,
  getWeekdayInTimezone,
} from "../../schedulerTimezone.js";
import type { ScheduleDriver } from "../createScheduleDriverRegistry.js";

type WeekdaysSchedule = Extract<ScheduleSpec, { type: "weekdays" }>;

function computeWeekdaysNextRun(
  days: number[],
  at: string,
  from: Date,
): Date {
  if (days.length === 0) {
    throw new Error("Select at least one weekday.");
  }

  const timeZone = getSchedulerTimezone();
  const sortedDays = [...days].sort((left, right) => left - right);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = addCalendarDaysInTimezone(from, offset, timeZone);
    const weekday = getWeekdayInTimezone(candidateDate, timeZone);

    if (!sortedDays.includes(weekday)) {
      continue;
    }

    const candidate = atTimeOnDateInTimezone(candidateDate, at, timeZone);

    if (candidate > from) {
      return candidate;
    }
  }

  throw new Error("Could not compute next weekday run time.");
}

export const weekdaysScheduleDriver: ScheduleDriver<WeekdaysSchedule> = {
  type: "weekdays",

  computeNextRunAt(schedule, from): string | null {
    return computeWeekdaysNextRun(schedule.days, schedule.at, from).toISOString();
  },

  isOneShot(_schedule): boolean {
    return false;
  },
};
