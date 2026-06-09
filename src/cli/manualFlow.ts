import { gameModules } from "../games/registry.js";
import type { ManualRunInput } from "../types/orchestrator.js";
import { logger } from "../utils/utils.js";
import { askChoice, askYesNo } from "./prompts.js";

export async function collectManualRunInput(): Promise<ManualRunInput> {
  logger.step("Manual mode — configure this run.");

  const choices = gameModules.map((module) => ({
    value: module.id,
    label: module.displayName,
  }));

  logger.info("Registered games:");
  for (const [index, choice] of choices.entries()) {
    logger.gray(`  ${index + 1}. ${choice.label} (${choice.value})`);
  }

  const gameId = await askChoice("Select game", choices);
  const selected = gameModules.find((module) => module.id === gameId);
  logger.gray(`Game: ${selected?.displayName ?? gameId} (${gameId})`);

  const shouldScrape = await askYesNo(
    "Fetch new codes from the wiki?",
    true,
  );

  return { gameId, shouldScrape };
}
