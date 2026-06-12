import { CodeStatus } from "../config/constants.js";
import type {
  NormalizedScrapedCode,
  ScrapedCodeRow,
} from "./scrapeTypes.js";

/** Flattens scraper rows into individual codes with a status for store upsert. */
export function normalizeScrapedRows(
  rows: ScrapedCodeRow[],
): NormalizedScrapedCode[] {
  const normalized: NormalizedScrapedCode[] = [];

  for (const row of rows) {
    const status = row.expired ? CodeStatus.EXPIRED : CodeStatus.ACTIVE;

    for (const code of row.codes) {
      normalized.push({ code, status });
    }
  }

  return normalized;
}
