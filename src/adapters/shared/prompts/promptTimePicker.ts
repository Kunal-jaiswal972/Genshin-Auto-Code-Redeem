import { isPromptBack } from "../../contracts/promptBack.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import {
  formatTimeOfDayLabel,
  formatTimeOfDayString,
  to24Hour,
} from "../../../scheduling/scheduleTime.js";

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

type TimeStep = "hour" | "period" | "minute";

/** Guided 12-hour clock picker; returns 24-hour HH:mm for storage. */
export async function promptTimeOfDay(port: PromptPort): Promise<string> {
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
