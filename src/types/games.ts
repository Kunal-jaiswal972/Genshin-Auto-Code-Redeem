import type { GameIdValue } from "../config/constants.js";
import type { CodeStatusValue } from "../config/constants.js";
import type { ChromeSession } from "./browser.js";
import type { CodeRedeemResult, GameRedeemOptions } from "./redeem.js";

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

export type GameScraper = () => Promise<ScrapedCodeRow[]>;

export type GameRedeemer = (
  session: ChromeSession,
  options: GameRedeemOptions,
) => Promise<CodeRedeemResult[]>;

/**
 * Full game plug-in. Register new games in `src/games/registry.ts` only.
 * See AGENTS.md → "Adding a new game".
 */
export interface GameModule {
  readonly id: GameIdValue;
  readonly displayName: string;
  readonly source: string;
  readonly scrapeCodes: GameScraper;
  readonly redeemCodes: GameRedeemer;
}
