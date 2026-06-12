import { getAppConfig } from "../config/appConfig.js";
import { formatScheduleInstant } from "../utils/utils.js";
import { parseTimeOfDay } from "./timeOfDay.js";

interface ZonedParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly weekday: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getSchedulerTimezone(): string {
  return getAppConfig().schedulerTimezone;
}

export function formatSchedulerInstant(iso: string | null | undefined): string {
  return formatScheduleInstant(iso, { timeZone: getSchedulerTimezone() });
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const values: Record<string, string> = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const hourText = values.hour === "24" ? "0" : (values.hour ?? "0");

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: WEEKDAY_INDEX[values.weekday ?? ""] ?? 0,
    hours: Number(hourText),
    minutes: Number(values.minute ?? "0"),
    seconds: Number(values.second ?? "0"),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hours,
    parts.minutes,
    parts.seconds,
  );

  return asUtc - date.getTime();
}

export function zonedDateTimeToUtc(options: {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  timeZone: string;
}): Date {
  const { year, month, day, hours, minutes, timeZone } = options;
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);

  return new Date(utcGuess - offset);
}

export function startOfDayInTimezone(date: Date, timeZone: string): Date {
  const parts = getZonedParts(date, timeZone);

  return zonedDateTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hours: 0,
    minutes: 0,
    timeZone,
  });
}

export function addCalendarDaysInTimezone(
  date: Date,
  days: number,
  timeZone: string,
): Date {
  const parts = getZonedParts(date, timeZone);
  const shifted = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0),
  );

  return startOfDayInTimezone(shifted, timeZone);
}

export function atTimeOnDateInTimezone(
  base: Date,
  at: string,
  timeZone: string,
): Date {
  const { hours, minutes } = parseTimeOfDay(at);
  const parts = getZonedParts(base, timeZone);

  return zonedDateTimeToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hours,
    minutes,
    timeZone,
  });
}

export function getWeekdayInTimezone(date: Date, timeZone: string): number {
  return getZonedParts(date, timeZone).weekday;
}
