import { GameId } from "../../config/constants.js";
import type { GameModule } from "../gameModule.js";
import { hsrConfig } from "./config.js";
import { redeemHsrCodes } from "./redeemer.js";
import { scrapeHsrCodes } from "./scraper.js";

export const hsrGameModule: GameModule = {
  id: GameId.HSR,
  displayName: "Honkai: Star Rail",
  source: hsrConfig.source,
  scrapeCodes: scrapeHsrCodes,
  redeemCodes: redeemHsrCodes,
};
