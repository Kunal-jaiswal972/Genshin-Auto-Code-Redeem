import type { GameIdValue } from "../../../config/constants.js";
import { gameModules } from "../../../games/registry.js";
import type { PromptOptions, PromptPort } from "../../ports/promptPort.js";

export async function collectGameSelection(
  port: PromptPort,
  options?: PromptOptions,
): Promise<GameIdValue> {
  const choices = gameModules.map((module) => ({
    value: module.id,
    label: `${module.displayName} (${module.id})`,
  }));

  const gameId = await port.choose("Select game", choices, options);
  const selected = gameModules.find((module) => module.id === gameId);
  port.gray(`Game: ${selected?.displayName ?? gameId} (${gameId})`);

  return gameId;
}
