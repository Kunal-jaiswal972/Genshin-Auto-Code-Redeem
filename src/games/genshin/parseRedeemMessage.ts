export type RedeemMessageAction = "success" | "expired" | "retry" | "pending";

export interface ParsedRedeemMessage {
  action: RedeemMessageAction;
  message: string;
}

export function parseRedeemMessage(rawMessage: string): ParsedRedeemMessage {
  const message = rawMessage.trim();
  const lower = message.toLowerCase();

  if (message.length === 0) {
    return {
      action: "pending",
      message: "No redemption response detected.",
    };
  }

  if (lower.includes("success")) {
    return { action: "success", message };
  }

  if (lower.includes("already") || lower.includes("in use")) {
    return { action: "success", message };
  }

  if (lower.includes("expired") || lower.includes("expire")) {
    return { action: "expired", message };
  }

  if (lower.includes("sec")) {
    return { action: "retry", message };
  }

  return { action: "pending", message };
}
