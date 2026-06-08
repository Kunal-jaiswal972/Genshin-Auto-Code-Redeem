import type { GenshinServerValue, RedeemStatusValue } from "../config/constants.js";

export interface GenshinLoginCredentials {
  email: string;
  password: string;
  server: GenshinServerValue;
}

export interface CodeRedeemResult {
  code: string;
  status: RedeemStatusValue;
  message: string;
}

export interface GenshinRedeemOptions {
  credentials: GenshinLoginCredentials;
  codes: string[];
  onCodeRedeemed?: (result: CodeRedeemResult) => Promise<void>;
}
