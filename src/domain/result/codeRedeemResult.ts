import type { RedeemStatusValue } from "../../config/constants.js";
import type { GameLoginCredentials } from "../credentials/gameLoginCredentials.js";

export interface CodeRedeemResult {
  code: string;
  status: RedeemStatusValue;
  message: string;
}

export interface GameRedeemOptions {
  credentials: GameLoginCredentials;
  codes: string[];
  onCodeRedeemed?: (result: CodeRedeemResult) => Promise<void>;
}
