import { GameId } from "../../config/constants.js";
import type { GameModule } from "../gameModule.js";
import { genshinConfig } from "./config.js";
import { redeemGenshinCodes } from "./redeemer.js";
import { scrapeGenshinCodes } from "./scraper.js";

export const genshinGameModule: GameModule = {
  id: GameId.GENSHIN,
  displayName: "Genshin Impact",
  source: genshinConfig.source,
  scrapeCodes: scrapeGenshinCodes,
  redeemCodes: redeemGenshinCodes,
};
