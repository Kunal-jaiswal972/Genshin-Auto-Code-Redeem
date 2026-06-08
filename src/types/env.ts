import type {
  ExecutionModeValue,
  GameIdValue,
  GenshinServerValue,
} from "../config/constants.js";

export interface ChromeEnvConfig {
  executablePath: string;
  userDataDir: string;
  debugPort: number;
  headless: boolean;
}

export interface GenshinEnvConfig {
  email: string;
  password: string;
  server: GenshinServerValue;
}

export interface AppEnv {
  executionMode: ExecutionModeValue;
  gameId: GameIdValue;
  codeStorePath: string;
  chrome: ChromeEnvConfig;
  genshin: GenshinEnvConfig;
}
