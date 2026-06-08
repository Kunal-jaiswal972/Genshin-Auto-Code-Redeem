import { ExecutionMode } from "../config/constants.js";
import { hasScrapedToday } from "../storage/codeStore.js";
import type { ScrapeGateResult, ResolveScrapeGateOptions } from "../types/services.js";
import { getTodayRunDate } from "../utils/utils.js";

export async function resolveScrapeGate(
  options: ResolveScrapeGateOptions,
): Promise<ScrapeGateResult> {
  const runDate = getTodayRunDate();

  if (options.executionMode === ExecutionMode.CRON) {
    const alreadyScraped = await hasScrapedToday(options.gameId);

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

  const shouldScrape = options.manualShouldScrape ?? true;

  return {
    shouldScrape,
    runDate,
    reason: shouldScrape
      ? "Manual mode — scrape requested."
      : "Manual mode — scrape skipped by caller.",
  };
}
