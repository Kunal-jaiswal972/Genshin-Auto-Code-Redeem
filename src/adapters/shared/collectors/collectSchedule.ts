import { formatWeekdayLabels } from "../../../scheduling/nextRunAt.js";
import type { ScheduleSpec } from "../../../scheduling/scheduleSpec.js";
import type { PromptPort } from "../../ports/promptPort.js";

type ScheduleKind =
  | "once"
  | "daily"
  | "intervalHours"
  | "intervalMinutes"
  | "weekdays"
  | "cron";

async function collectWeekdays(port: PromptPort): Promise<number[]> {
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
    { value: "once", label: "Run once at specific date/time" },
    { value: "daily", label: "Run daily at time" },
    { value: "intervalHours", label: "Run every X hours" },
    { value: "intervalMinutes", label: "Run every X minutes" },
    { value: "weekdays", label: "Run on selected weekdays" },
    { value: "cron", label: "Custom cron expression" },
  ]);

  switch (kind) {
    case "once": {
      const at = await port.question(
        "Date/time (ISO, e.g. 2026-06-08T18:30:00):",
      );
      return { type: "once", at };
    }
    case "daily": {
      const at = await port.question("Daily time (HH:mm, 24-hour):");
      return { type: "daily", at };
    }
    case "intervalHours": {
      const every = await port.positiveInteger("Every how many hours?");
      return { type: "intervalHours", every };
    }
    case "intervalMinutes": {
      const every = await port.positiveInteger("Every how many minutes?");
      return { type: "intervalMinutes", every };
    }
    case "weekdays": {
      const days = await collectWeekdays(port);
      const at = await port.question("Time on those days (HH:mm, 24-hour):");
      return { type: "weekdays", days, at };
    }
    case "cron": {
      const expression = await port.question(
        'Cron expression (5 fields, e.g. "30 9 * * *" for 09:30 daily):',
      );
      return { type: "cron", expression };
    }
  }
}
