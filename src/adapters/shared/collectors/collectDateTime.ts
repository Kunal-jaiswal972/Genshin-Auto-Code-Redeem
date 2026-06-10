import { isPromptBack } from "../../ports/promptBack.js";
import type { PromptPort } from "../../ports/promptPort.js";
import {
  formatTimeOfDayLabel,
  formatTimeOfDayString,
  to24Hour,
} from "../../../scheduling/timeOfDay.js";

const HOUR_CHOICES = [
  { value: "12" as const, label: "12 o'clock" },
  { value: "1" as const, label: "1 o'clock" },
  { value: "2" as const, label: "2 o'clock" },
  { value: "3" as const, label: "3 o'clock" },
  { value: "4" as const, label: "4 o'clock" },
  { value: "5" as const, label: "5 o'clock" },
  { value: "6" as const, label: "6 o'clock" },
  { value: "7" as const, label: "7 o'clock" },
  { value: "8" as const, label: "8 o'clock" },
  { value: "9" as const, label: "9 o'clock" },
  { value: "10" as const, label: "10 o'clock" },
  { value: "11" as const, label: "11 o'clock" },
];

const PERIOD_CHOICES = [
  { value: "AM" as const, label: "AM (morning)" },
  { value: "PM" as const, label: "PM (afternoon/evening)" },
];

const MINUTE_CHOICES = Array.from({ length: 12 }, (_, index) => {
  const minute = index * 5;
  const label = minute === 0 ? ":00 (on the hour)" : `:${minute.toString().padStart(2, "0")}`;
  return {
    value: minute.toString().padStart(2, "0") as `${number}`,
    label,
  };
});

const MONTH_CHOICES = [
  { value: "0" as const, label: "January" },
  { value: "1" as const, label: "February" },
  { value: "2" as const, label: "March" },
  { value: "3" as const, label: "April" },
  { value: "4" as const, label: "May" },
  { value: "5" as const, label: "June" },
  { value: "6" as const, label: "July" },
  { value: "7" as const, label: "August" },
  { value: "8" as const, label: "September" },
  { value: "9" as const, label: "October" },
  { value: "10" as const, label: "November" },
  { value: "11" as const, label: "December" },
];

export const WEEKDAY_PICKER_CHOICES = [
  { value: "1" as const, label: "Monday" },
  { value: "2" as const, label: "Tuesday" },
  { value: "3" as const, label: "Wednesday" },
  { value: "4" as const, label: "Thursday" },
  { value: "5" as const, label: "Friday" },
  { value: "6" as const, label: "Saturday" },
  { value: "0" as const, label: "Sunday" },
] as const;

type DateWhenChoice = "today" | "tomorrow" | "custom";
type TimeStep = "hour" | "period" | "minute";
type DateStep = "month" | "day";

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function applyTimeToDate(date: Date, timeOfDay: string): Date {
  const [hourText, minuteText] = timeOfDay.split(":");
  const hours = Number.parseInt(hourText ?? "", 10);
  const minutes = Number.parseInt(minuteText ?? "", 10);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

/** Guided 12-hour clock picker; returns 24-hour HH:mm for storage. */
export async function collectTimeOfDay(port: PromptPort): Promise<string> {
  let step: TimeStep = "hour";
  let hour12 = "";
  let period: "AM" | "PM" = "AM";

  while (true) {
    if (step === "hour") {
      try {
        hour12 = await port.choose("What hour?", HOUR_CHOICES, { allowBack: true });
        step = "period";
      } catch (error) {
        if (isPromptBack(error)) {
          throw error;
        }

        throw error;
      }

      continue;
    }

    if (step === "period") {
      try {
        period = await port.choose("Morning or afternoon/evening?", PERIOD_CHOICES, {
          allowBack: true,
        });
        step = "minute";
      } catch (error) {
        if (isPromptBack(error)) {
          step = "hour";
          continue;
        }

        throw error;
      }

      continue;
    }

    try {
      const minuteText = await port.choose("What minute?", MINUTE_CHOICES, {
        allowBack: true,
      });
      const hours = to24Hour(Number.parseInt(hour12, 10), period);
      const minutes = Number.parseInt(minuteText, 10);
      const at = formatTimeOfDayString({ hours, minutes });
      port.gray(`Time: ${formatTimeOfDayLabel(at)}`);
      return at;
    } catch (error) {
      if (isPromptBack(error)) {
        step = "period";
        continue;
      }

      throw error;
    }
  }
}

async function collectCustomDate(port: PromptPort): Promise<Date> {
  let step: DateStep = "month";
  let monthIndex = 0;
  const now = new Date();
  const year = now.getFullYear();

  while (true) {
    if (step === "month") {
      try {
        const monthValue = await port.choose("Which month?", MONTH_CHOICES, {
          allowBack: true,
        });
        monthIndex = Number.parseInt(monthValue, 10);
        step = "day";
      } catch (error) {
        if (isPromptBack(error)) {
          throw error;
        }

        throw error;
      }

      continue;
    }

    const dayCount = daysInMonth(year, monthIndex);
    const dayChoices = Array.from({ length: dayCount }, (_, index) => {
      const day = index + 1;
      return {
        value: day.toString() as `${number}`,
        label: day.toString(),
      };
    });

    try {
      const dayValue = await port.choose("Which day of the month?", dayChoices, {
        allowBack: true,
      });
      const day = Number.parseInt(dayValue, 10);
      const date = startOfLocalDay(new Date(year, monthIndex, day));
      const today = startOfLocalDay(new Date());

      if (date < today) {
        port.warn("That date is in the past. Pick a future date.");
        continue;
      }

      port.gray(`Date: ${formatLongDate(date)}`);
      return date;
    } catch (error) {
      if (isPromptBack(error)) {
        step = "month";
        continue;
      }

      throw error;
    }
  }
}

async function collectCalendarDate(port: PromptPort): Promise<Date> {
  const when = await port.choose<DateWhenChoice>("Which date?", [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "custom", label: "Pick a specific date" },
  ], { allowBack: true });

  if (when === "today") {
    const date = startOfLocalDay(new Date());
    port.gray(`Date: ${formatLongDate(date)}`);
    return date;
  }

  if (when === "tomorrow") {
    const date = startOfLocalDay(new Date());
    date.setDate(date.getDate() + 1);
    port.gray(`Date: ${formatLongDate(date)}`);
    return date;
  }

  return collectCustomDate(port);
}

/** Guided date + time picker for one-shot schedules; returns ISO string. */
export async function collectOnceDateTime(port: PromptPort): Promise<string> {
  while (true) {
    let date: Date;

    try {
      date = await collectCalendarDate(port);
    } catch (error) {
      if (isPromptBack(error)) {
        throw error;
      }

      throw error;
    }

    let timeOfDay: string;

    try {
      timeOfDay = await collectTimeOfDay(port);
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }

    const runAt = applyTimeToDate(date, timeOfDay);
    const now = new Date();

    if (runAt <= now) {
      port.warn("That date and time are already in the past. Please pick a future time.");
      continue;
    }

    port.gray(`Runs once on ${formatLongDate(runAt)} at ${formatTimeOfDayLabel(timeOfDay)}`);
    return runAt.toISOString();
  }
}

export async function collectSingleWeekday(port: PromptPort): Promise<number> {
  const day = await port.choose("Which day of the week?", [...WEEKDAY_PICKER_CHOICES], {
    allowBack: true,
  });
  return Number.parseInt(day, 10);
}

type WeekdayPickValue = (typeof WEEKDAY_PICKER_CHOICES)[number]["value"] | "done";

/** Tap days to include, then choose Done — no numeric codes. */
export async function collectMultipleWeekdays(port: PromptPort): Promise<number[]> {
  const selected = new Set<number>();

  while (true) {
    const choices: { value: WeekdayPickValue; label: string }[] = WEEKDAY_PICKER_CHOICES.map(
      (choice) => {
        const day = Number.parseInt(choice.value, 10);
        const mark = selected.has(day) ? " ✓" : "";
        return {
          value: choice.value,
          label: `${choice.label}${mark}`,
        };
      },
    );

    if (selected.size > 0) {
      choices.push({
        value: "done",
        label: "Done selecting days",
      });
    }

    const prompt =
      selected.size === 0
        ? "Tap each day this should run on"
        : "Add another day, or tap Done";

    try {
      const pick = await port.choose<WeekdayPickValue>(prompt, choices, { allowBack: true });

      if (pick === "done") {
        return [...selected].sort((left, right) => left - right);
      }

      const day = Number.parseInt(pick, 10);

      if (selected.has(day)) {
        selected.delete(day);
        port.gray(`${WEEKDAY_PICKER_CHOICES.find((choice) => choice.value === pick)?.label ?? "Day"} removed.`);
      } else {
        selected.add(day);
        port.gray(`${WEEKDAY_PICKER_CHOICES.find((choice) => choice.value === pick)?.label ?? "Day"} added.`);
      }
    } catch (error) {
      if (isPromptBack(error)) {
        throw error;
      }

      throw error;
    }
  }
}
