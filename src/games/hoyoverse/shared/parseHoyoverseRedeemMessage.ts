import type { ParsedRedeemMessage } from "./redeemMessageTypes.js";

/**
 * Default parser for Hoyoverse gift-page modal text (Genshin, HSR, ZZZ share the same cdkey UI).
 */
export function parseHoyoverseRedeemMessage(rawMessage: string): ParsedRedeemMessage {
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
