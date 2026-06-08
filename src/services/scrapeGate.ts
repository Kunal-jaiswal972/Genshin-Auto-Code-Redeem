import { ExecutionMode, type ExecutionModeValue, type GameIdValue } from "../config/constants.js";
import { hasScrapedToday } from "../storage/codeStore.js";
import type { ScrapeGateResult } from "../types/services.js";
import { getTodayRunDate } from "../utils/utils.js";

export async function resolveScrapeGate(
  executionMode: ExecutionModeValue,
  gameId: GameIdValue,
  manualShouldScrape: boolean | null,
): Promise<ScrapeGateResult> {
  const runDate = getTodayRunDate();

  if (executionMode === ExecutionMode.CRON) {
    const alreadyScraped = await hasScrapedToday(gameId);

    if (alreadyScraped) {
      return {
        shouldScrape: false,
        runDate,
        reason: "Codes already scraped today (cron gate).",
      };
    }

    return {
      shouldScrape: true,
      runDate,
      reason: "Daily scrape not yet recorded (cron).",
    };
  }

  const shouldScrape = manualShouldScrape ?? true;

  return {
    shouldScrape,
    runDate,
    reason: shouldScrape
      ? "Manual mode — scrape requested."
      : "Manual mode — scrape skipped by caller.",
  };
}
