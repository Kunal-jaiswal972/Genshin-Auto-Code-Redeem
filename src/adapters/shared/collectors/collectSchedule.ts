import { isPromptBack } from "../../ports/promptBack.js";
import type { ScheduleSpec } from "../../../scheduling/scheduleSpec.js";
import type { PromptPort } from "../../ports/promptPort.js";
import {
  collectMultipleWeekdays,
  collectOnceDateTime,
  collectSingleWeekday,
  collectTimeOfDay,
} from "./collectDateTime.js";

type ScheduleKind = "daily" | "weekly" | "once" | "weeklyOnce";

const SCHEDULE_KIND_CHOICES = [
  { value: "daily" as const, label: "Every day at a set time" },
  { value: "weekly" as const, label: "On selected days every week at a set time" },
  { value: "once" as const, label: "Once at a specific date and time" },
  { value: "weeklyOnce" as const, label: "Every week on one day at a set time" },
];

async function collectScheduleKind(port: PromptPort): Promise<ScheduleKind> {
  return port.choose<ScheduleKind>("How should this run?", SCHEDULE_KIND_CHOICES, {
    allowBack: true,
  });
}

async function collectDailySchedule(port: PromptPort): Promise<ScheduleSpec> {
  const at = await collectTimeOfDay(port);
  return { type: "daily", at };
}

async function collectWeeklySchedule(port: PromptPort): Promise<ScheduleSpec> {
  while (true) {
    const days = await collectMultipleWeekdays(port);

    try {
      const at = await collectTimeOfDay(port);
      return { type: "weekdays", days, at };
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function collectWeeklyOnceSchedule(port: PromptPort): Promise<ScheduleSpec> {
  while (true) {
    const day = await collectSingleWeekday(port);

    try {
      const at = await collectTimeOfDay(port);
      return { type: "weekdays", days: [day], at };
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function collectScheduleForKind(
  port: PromptPort,
  kind: ScheduleKind,
): Promise<ScheduleSpec> {
  switch (kind) {
    case "daily":
      return collectDailySchedule(port);
    case "weekly":
      return collectWeeklySchedule(port);
    case "once": {
      const at = await collectOnceDateTime(port);
      return { type: "once", at };
    }
    case "weeklyOnce":
      return collectWeeklyOnceSchedule(port);
  }
}

export async function collectScheduleSpec(port: PromptPort): Promise<ScheduleSpec> {
  while (true) {
    let kind: ScheduleKind;

    try {
      kind = await collectScheduleKind(port);
    } catch (error) {
      if (isPromptBack(error)) {
        throw error;
      }

      throw error;
    }

    try {
      return await collectScheduleForKind(port, kind);
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}
