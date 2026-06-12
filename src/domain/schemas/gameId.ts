import { z } from "zod";
import { GameId, type GameIdValue } from "../../config/constants.js";

export const gameIdValues = [GameId.GENSHIN, GameId.HSR] as [
  GameIdValue,
  ...GameIdValue[],
];

export const gameIdSchema = z.enum(gameIdValues);
