import type { GameIdValue } from "../config/constants.js";
import { getGameModule } from "../games/registry.js";
import { normalizeScrapedRows } from "../games/normalizeCodes.js";
import { mergeScrapedCodes } from "../infrastructure/storage/stores/codeStore.js";
import type { ScrapeStats } from "../domain/result/scrapeStats.js";
import { logger } from "../utils/utils.js";

export async function runScrape(gameId: GameIdValue): Promise<ScrapeStats> {
  const gameModule = getGameModule(gameId);

  logger.gray(`Fetching codes for ${gameModule.displayName}...`);
  const rows = await gameModule.scrapeCodes();
  const normalized = normalizeScrapedRows(rows);
  const merge = await mergeScrapedCodes({
    gameId,
    scraped: normalized,
    source: gameModule.source,
  });

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
