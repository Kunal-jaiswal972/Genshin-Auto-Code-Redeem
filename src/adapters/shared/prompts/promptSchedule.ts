import { isPromptBack } from "../../contracts/promptBack.js";
import type { ScheduleSpec } from "../../../domain/schedule/scheduleSpec.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import { promptOnceDateTime } from "./promptDatePicker.js";
import { promptTimeOfDay } from "./promptTimePicker.js";
import {
  promptMultipleWeekdays,
  promptSingleWeekday,
} from "./promptWeekdays.js";

type ScheduleKind = "daily" | "weekly" | "once" | "weeklyOnce";

const SCHEDULE_KIND_CHOICES = [
  { value: "daily" as const, label: "Every day at a set time" },
  { value: "weekly" as const, label: "On selected days every week at a set time" },
  { value: "once" as const, label: "Once at a specific date and time" },
  { value: "weeklyOnce" as const, label: "Every week on one day at a set time" },
];

async function promptScheduleKind(port: PromptPort): Promise<ScheduleKind> {
  return port.choose<ScheduleKind>("How should this run?", SCHEDULE_KIND_CHOICES, {
    allowBack: true,
  });
}

async function promptDailySchedule(port: PromptPort): Promise<ScheduleSpec> {
  const at = await promptTimeOfDay(port);
  return { type: "daily", at };
}

async function promptWeeklySchedule(port: PromptPort): Promise<ScheduleSpec> {
  while (true) {
    const days = await promptMultipleWeekdays(port);

    try {
      const at = await promptTimeOfDay(port);
      return { type: "weekdays", days, at };
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function promptWeeklyOnceSchedule(port: PromptPort): Promise<ScheduleSpec> {
  while (true) {
    const day = await promptSingleWeekday(port);

    try {
      const at = await promptTimeOfDay(port);
      return { type: "weekdays", days: [day], at };
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function promptScheduleForKind(
  port: PromptPort,
  kind: ScheduleKind,
): Promise<ScheduleSpec> {
  switch (kind) {
    case "daily":
      return promptDailySchedule(port);
    case "weekly":
      return promptWeeklySchedule(port);
    case "once": {
      const at = await promptOnceDateTime(port);
      return { type: "once", at };
    }
    case "weeklyOnce":
      return promptWeeklyOnceSchedule(port);
  }
}

export async function promptScheduleSpec(port: PromptPort): Promise<ScheduleSpec> {
  while (true) {
    let kind: ScheduleKind;

    try {
      kind = await promptScheduleKind(port);
    } catch (error) {
      if (isPromptBack(error)) {
        throw error;
      }

      throw error;
    }

    try {
      return await promptScheduleForKind(port, kind);
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}
