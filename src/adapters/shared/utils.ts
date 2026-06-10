import type { RunResult } from "../../domain/result/runResult.js";
import type { PromptPort } from "../ports/promptPort.js";

export function displayRunResult(port: PromptPort, result: RunResult): void {
  port.step(`Run finished — status: ${result.status}`);

  if (result.scraped && result.scrapeStats) {
    port.gray(
      `Scrape: ${result.scrapeStats.codesUpserted} codes (${result.scrapeStats.newCodes.length} new)`,
    );
  }

  if (result.redeemSummary) {
    const summary = result.redeemSummary;
    port.gray(
      `Redeem: ${summary.redeemed} redeemed, ${summary.expired} expired, ${summary.stillPending} pending`,
    );
  }

  if (result.error) {
    port.error(result.error);
  }
}
