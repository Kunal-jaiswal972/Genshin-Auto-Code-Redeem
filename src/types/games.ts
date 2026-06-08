import type { CodeStatusValue, GameIdValue } from "../config/constants.js";

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

/** Contract every game adapter must implement. */
export interface GameAdapter {
  readonly id: GameIdValue;
  scrapeCodes(): Promise<ScrapedCodeRow[]>;
}
