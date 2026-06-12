import path from "node:path";
import type { ResolveCodeStorePathOptions } from "./codeStoreTypes.js";

export const DEFAULT_CODE_STORE_BASE_PATH = "./src/data";
export const DEFAULT_DATABASE_URL = "file:./src/data/redeemer.db";

export function resolveCodeStorePath(
  options: ResolveCodeStorePathOptions,
): string {
  return path.resolve(options.basePath, options.gameId, "codes.json");
}
