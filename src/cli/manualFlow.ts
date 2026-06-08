import { getEnv } from "../config/env.js";
import { getGameModule } from "../games/registry.js";
import type { ManualRunInput } from "../types/orchestrator.js";
import { logger } from "../utils/utils.js";
import { askYesNo } from "./prompts.js";

export async function collectManualRunInput(): Promise<ManualRunInput> {
  logger.step("Manual mode — configure this run.");

  const env = getEnv();
  const gameModule = getGameModule(env.gameId);
  logger.gray(`Game: ${gameModule.displayName} (${env.gameId})`);

  const shouldScrape = await askYesNo(
    "Fetch new codes from the wiki?",
    true,
  );

  return { shouldScrape };
}
