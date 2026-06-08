import { GameId } from "../../config/constants.js";
import type { GameAdapter } from "../../types/games.js";
import { scrapeGenshinCodes } from "./scraper.js";

export const genshinAdapter: GameAdapter = {
  id: GameId.GENSHIN,
  scrapeCodes: scrapeGenshinCodes,
};
