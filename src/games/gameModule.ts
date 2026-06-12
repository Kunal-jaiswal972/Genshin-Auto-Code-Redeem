import type { GameIdValue } from "../config/constants.js";
import type { ChromeSession } from "../types/browser.js";
import type { CodeRedeemResult, GameRedeemOptions } from "../domain/result/codeRedeemResult.js";
import type { ScrapedCodeRow } from "./scrapeTypes.js";

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
