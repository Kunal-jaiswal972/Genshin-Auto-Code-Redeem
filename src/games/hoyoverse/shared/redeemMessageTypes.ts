export type RedeemMessageAction = "success" | "expired" | "retry" | "pending";

export interface ParsedRedeemMessage {
  action: RedeemMessageAction;
  message: string;
}
