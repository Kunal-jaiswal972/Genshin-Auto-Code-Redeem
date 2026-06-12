import type { RedeemSummary } from "../../domain/result/redeemSummary.js";
import type { RunResult } from "../../domain/result/runResult.js";
import type { ScrapeStats } from "../../domain/result/scrapeStats.js";

function formatScrapeStatsLine(stats: ScrapeStats): string {
  return `Scrape: ${stats.codesUpserted} codes (${stats.newCodes.length} new)`;
}

function formatRedeemSummaryLine(summary: RedeemSummary): string {
  return `Redeem: ${summary.redeemed} redeemed, ${summary.expired} expired, ${summary.stillPending} pending`;
}

export function formatRedeemSummaryLogLine(summary: RedeemSummary): string {
  return `attempted=${summary.codesAttempted}, redeemed=${summary.redeemed}, expired=${summary.expired}, stillPending=${summary.stillPending}, unavailable=${summary.unavailable}`;
}

export interface RunResultDisplayLines {
  readonly title: string;
  readonly grayLines: string[];
  readonly error?: string;
}

export function formatRunResultForDisplay(result: RunResult): RunResultDisplayLines {
  const grayLines: string[] = [];

  if (result.scraped && result.scrapeStats) {
    grayLines.push(formatScrapeStatsLine(result.scrapeStats));
  }

  if (result.redeemSummary) {
    grayLines.push(formatRedeemSummaryLine(result.redeemSummary));
  }

  return {
    title: `Run finished — status: ${result.status}`,
    grayLines,
    error: result.error,
  };
}
