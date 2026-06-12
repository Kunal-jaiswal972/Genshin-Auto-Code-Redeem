import type { ScrapedCodeRow } from "../scrapeTypes.js";
import { hsrStubCodes } from "./config.js";

export async function scrapeHsrCodes(): Promise<ScrapedCodeRow[]> {
  return hsrStubCodes.map((code) => ({
    codes: [code],
    expired: false,
  }));
}
