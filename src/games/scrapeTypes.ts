import type { CodeStatusValue } from "../config/constants.js";

/** Raw row returned by a game-specific scraper before normalization. */
export interface ScrapedCodeRow {
  codes: string[];
  expired: boolean;
}

/** Flattened code ready for JSON store upsert. */
export interface NormalizedScrapedCode {
  code: string;
  status: CodeStatusValue;
}
