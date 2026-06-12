export interface ChromeEnvConfig {
  executablePath: string;
  userDataDir: string;
  debugPort: number;
  headless: boolean;
}

export interface AppConfig {
  codeStoreBasePath: string;
  databaseUrl: string;
  schedulerPollIntervalMs: number;
  cliAdapterEnabled: boolean;
  telegramBotToken: string | null;
  telegramEnabled: boolean;
  chrome: ChromeEnvConfig;
}
