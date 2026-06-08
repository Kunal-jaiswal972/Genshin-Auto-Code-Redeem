import type { ManualRunInput } from "../types/orchestrator.js";
import { logger } from "../utils/utils.js";
import { askYesNo } from "./prompts.js";

export async function collectManualRunInput(): Promise<ManualRunInput> {
  logger.step("Manual mode — configure this run.");

  const shouldScrape = await askYesNo(
    "Fetch new codes from the wiki?",
    true,
  );

  return { shouldScrape };
}
