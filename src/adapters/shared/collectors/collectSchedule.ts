import { formatWeekdayLabels } from "../../../scheduling/nextRunAt.js";
import type { ScheduleSpec } from "../../../scheduling/scheduleSpec.js";
import type { PromptPort } from "../../ports/promptPort.js";

type ScheduleKind = "daily" | "weekly" | "once" | "weeklyOnce";

const WEEKDAY_CHOICES = [
  { value: "0" as const, label: "Sunday" },
  { value: "1" as const, label: "Monday" },
  { value: "2" as const, label: "Tuesday" },
  { value: "3" as const, label: "Wednesday" },
  { value: "4" as const, label: "Thursday" },
  { value: "5" as const, label: "Friday" },
  { value: "6" as const, label: "Saturday" },
];

async function collectDailyTime(port: PromptPort): Promise<string> {
  return port.question("Daily time (HH:mm, 24-hour, e.g. 09:30):");
}

async function collectSingleWeekday(port: PromptPort): Promise<number> {
  const day = await port.choose("Which day of the week?", WEEKDAY_CHOICES);
  return Number.parseInt(day, 10);
}

async function collectMultipleWeekdays(port: PromptPort): Promise<number[]> {
  const raw = await port.question(
    `Weekdays (comma-separated numbers 0-6, e.g. 1,3,5 for ${formatWeekdayLabels([1, 3, 5])}):`,
  );

  const days = raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((day) => !Number.isNaN(day) && day >= 0 && day <= 6);

  if (days.length === 0) {
    throw new Error("Select at least one weekday (0=Sun … 6=Sat).");
  }

  return [...new Set(days)].sort((left, right) => left - right);
}

export async function collectScheduleSpec(port: PromptPort): Promise<ScheduleSpec> {
  const kind = await port.choose<ScheduleKind>("How should this run?", [
    { value: "daily", label: "Every day at a set time" },
    { value: "weekly", label: "On selected days every week at a set time" },
    { value: "once", label: "Once at a specific date and time" },
    { value: "weeklyOnce", label: "Every week on one day at a set time" },
  ]);

  switch (kind) {
    case "daily": {
      const at = await collectDailyTime(port);
      return { type: "daily", at };
    }
    case "weekly": {
      const days = await collectMultipleWeekdays(port);
      const at = await collectDailyTime(port);
      return { type: "weekdays", days, at };
    }
    case "once": {
      const at = await port.question(
        "Date/time (ISO, e.g. 2026-06-08T18:30:00):",
      );
      return { type: "once", at };
    }
    case "weeklyOnce": {
      const day = await collectSingleWeekday(port);
      const at = await collectDailyTime(port);
      return { type: "weekdays", days: [day], at };
    }
  }
}
