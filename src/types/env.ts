import type { ExecutionModeValue, GameIdValue } from "../config/constants.js";
import type { GameLoginCredentials } from "./redeem.js";

export interface GetEnvOptions {
  gameId?: GameIdValue;
}

export interface ChromeEnvConfig {
  executablePath: string;
  userDataDir: string;
  debugPort: number;
  headless: boolean;
}

export interface AppEnv {
  executionMode: ExecutionModeValue;
  gameId: GameIdValue;
  codeStorePath: string;
  chrome: ChromeEnvConfig;
  credentials: GameLoginCredentials;
}
