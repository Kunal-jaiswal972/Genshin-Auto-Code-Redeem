export const ExecutionMode = {
  MANUAL: "manual",
  CRON: "cron",
} as const;

export type ExecutionModeValue =
  (typeof ExecutionMode)[keyof typeof ExecutionMode];

export const CodeStatus = {
  ACTIVE: "active",
  EXPIRED: "expired",
} as const;

export type CodeStatusValue = (typeof CodeStatus)[keyof typeof CodeStatus];

export const codeStatusValues: [CodeStatusValue, ...CodeStatusValue[]] = [
  CodeStatus.ACTIVE,
  CodeStatus.EXPIRED,
];

export const RedeemStatus = {
  PENDING: "pending",
  REDEEMED: "redeemed",
  FAILED: "failed",
  EXPIRED: "expired",
  UNAVAILABLE: "unavailable",
} as const;

export type RedeemStatusValue =
  (typeof RedeemStatus)[keyof typeof RedeemStatus];

export const redeemStatusValues: [RedeemStatusValue, ...RedeemStatusValue[]] = [
  RedeemStatus.PENDING,
  RedeemStatus.REDEEMED,
  RedeemStatus.FAILED,
  RedeemStatus.EXPIRED,
  RedeemStatus.UNAVAILABLE,
];

export const GameId = {
  GENSHIN: "genshin",
  HSR: "hsr",
} as const;

export type GameIdValue = (typeof GameId)[keyof typeof GameId];

export const GenshinServer = {
  AMERICA: "America",
  EUROPE: "Europe",
  ASIA: "Asia",
  TW_HK_MO: "TW, HK, MO",
} as const;

export type GenshinServerValue =
  (typeof GenshinServer)[keyof typeof GenshinServer];

export const Delays = {
  SHORT: 5_000,
  LONG: 10_000,
  TYPE_MIN: 10,
  TYPE_MAX: 100,
  RANDOM_ACTION_MIN: 300,
  RANDOM_ACTION_MAX: 1_000,
  CHROME_CLOSE_TIMEOUT: 4_000,
  WS_FETCH_INTERVAL: 1_000,
  POST_KILL: 1_000,
} as const;

export const BrowserConfig = {
  WS_FETCH_RETRIES: 20,
  PROTOCOL_TIMEOUT: 180_000,
  PAGE_TIMEOUT: 30_000,
  NAVIGATION_TIMEOUT: 60_000,
} as const;

export const DATE_FORMAT_RUN = "YYYY-MM-DD";
