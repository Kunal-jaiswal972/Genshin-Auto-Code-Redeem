import { isPromptBack } from "../../contracts/promptBack.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { formatTimeOfDayLabel } from "../../../scheduling/timeOfDay.js";
import { promptTimeOfDay } from "./promptTimePicker.js";

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

type DateWhenChoice = "today" | "tomorrow" | "custom";
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
export async function promptOnceDateTime(port: PromptPort): Promise<string> {
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
      timeOfDay = await promptTimeOfDay(port);
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
