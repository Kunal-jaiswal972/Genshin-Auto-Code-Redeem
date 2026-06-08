import { normalizeScrapedRows } from "../games/normalizeCodes.js";
import { mergeScrapedCodes } from "../storage/codeStore.js";
import type { GameAdapter } from "../types/games.js";
import type { ScrapeServiceParams, ScrapeStats } from "../types/services.js";
import { logger } from "../utils/utils.js";

export async function runScrape(
  adapter: GameAdapter,
  params: ScrapeServiceParams,
): Promise<ScrapeStats> {
  logger.gray("Fetching codes from Fandom wiki...");
  const rows = await adapter.scrapeCodes();
  const normalized = normalizeScrapedRows(rows);
  const merge = await mergeScrapedCodes(
    params.gameId,
    normalized,
    params.source,
  );

  logger.success(
    `Scrape saved — codes: ${normalized.length}, new: ${merge.newCodes.length}, active: ${merge.activeCodes}, expired: ${merge.expiredCodes}`,
  );

  return {
    rowsFound: rows.length,
    codesUpserted: normalized.length,
    activeCodes: merge.activeCodes,
    expiredCodes: merge.expiredCodes,
    newCodes: merge.newCodes,
  };
}
