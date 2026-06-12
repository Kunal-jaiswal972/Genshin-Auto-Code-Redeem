import { isPromptBack } from "../../contracts/promptBack.js";
import type { PromptPort } from "../../contracts/promptPort.js";
import {
  getWeekdayPickerLabel,
  WEEKDAY_PICKER_CHOICES,
} from "../../../scheduling/weekdays.js";

type WeekdayPickValue = (typeof WEEKDAY_PICKER_CHOICES)[number]["value"] | "done";

export async function promptSingleWeekday(port: PromptPort): Promise<number> {
  const day = await port.choose("Which day of the week?", [...WEEKDAY_PICKER_CHOICES], {
    allowBack: true,
  });
  return Number.parseInt(day, 10);
}

/** Tap days to include, then choose Done — no numeric codes. */
export async function promptMultipleWeekdays(port: PromptPort): Promise<number[]> {
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
        port.gray(`${getWeekdayPickerLabel(pick)} removed.`);
      } else {
        selected.add(day);
        port.gray(`${getWeekdayPickerLabel(pick)} added.`);
      }
    } catch (error) {
      if (isPromptBack(error)) {
        throw error;
      }

      throw error;
    }
  }
}
