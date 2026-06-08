import path from "node:path";
import type { ResolveCodeStorePathOptions } from "../types/codeStore.js";

export const DEFAULT_CODE_STORE_BASE_PATH = "./src/data";

export function resolveCodeStorePath(
  options: ResolveCodeStorePathOptions,
): string {
  return path.resolve(options.basePath, options.gameId, "codes.json");
}
