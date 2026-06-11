import * as clack from "@clack/prompts";
import { logger } from "../../utils/utils.js";
import type { DisplayPresenter } from "../contracts/displayPresenter.js";
import type { PromptPort } from "../contracts/promptPort.js";
import { formatDisplayCardCliBody } from "./formatters/formatDisplayCard.js";
import {
  askChoice,
  askPassword,
  askPositiveInteger,
  askQuestion,
  askUsername,
  askYesNo,
} from "../cli/lib/prompts.js";

/** Shared terminal I/O — scheduler fallback and optional CLI menu adapter. */
export interface TerminalPorts {
  readonly prompt: PromptPort;
  readonly display: DisplayPresenter;
}

export function createTerminalPorts(): TerminalPorts {
  const display: DisplayPresenter = {
    displayCards: (cards) => {
      for (const card of cards) {
        clack.note(formatDisplayCardCliBody(card), card.title);
      }
    },
  };

  const prompt: PromptPort = {
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
  };

  return { prompt, display };
}
