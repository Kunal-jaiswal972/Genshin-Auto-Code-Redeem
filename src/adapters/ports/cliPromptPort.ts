import * as clack from "@clack/prompts";
import { logger } from "../../utils/utils.js";
import type { DisplayCard } from "../shared/display/displayCard.js";
import { formatDisplayCardCliBody } from "../shared/display/displayCard.js";
import type { PromptPort } from "./promptPort.js";
import {
  askChoice,
  askPassword,
  askPositiveInteger,
  askQuestion,
  askUsername,
  askYesNo,
} from "../cli/prompts.js";

export function createCliPromptPort(): PromptPort {
  return {
    choose: askChoice,
    question: askQuestion,
    yesNo: askYesNo,
    username: askUsername,
    password: askPassword,
    positiveInteger: askPositiveInteger,
    step: (message) => logger.step(message),
    info: (message) => logger.info(message),
    success: (message) => logger.success(message),
    warn: (message) => logger.warn(message),
    gray: (message) => logger.gray(message),
    error: (message, error) => logger.error(message, error),
    displayCards: (cards: readonly DisplayCard[]) => {
      for (const card of cards) {
        clack.note(formatDisplayCardCliBody(card), card.title);
      }
    },
  };
}
