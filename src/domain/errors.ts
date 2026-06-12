export class AppError extends Error {
  readonly code: string;

  constructor(message: string, code: string, cause?: Error) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
  }
}

export class ConfigError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, "CONFIG_ERROR", cause);
    this.name = "ConfigError";
  }
}

export class ScrapeError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, "SCRAPE_ERROR", cause);
    this.name = "ScrapeError";
  }
}

export class RedeemError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, "REDEEM_ERROR", cause);
    this.name = "RedeemError";
  }
}

export class BrowserError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, "BROWSER_ERROR", cause);
    this.name = "BrowserError";
  }
}

export class StorageError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, "STORAGE_ERROR", cause);
    this.name = "StorageError";
  }
}
