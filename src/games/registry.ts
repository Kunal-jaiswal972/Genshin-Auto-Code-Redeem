import { GameId, type GameIdValue } from "../config/constants.js";
import { ConfigError } from "../core/errors.js";
import type { GameAdapter } from "../types/games.js";
import { genshinAdapter } from "./genshin/index.js";

const adapterEntries: [GameIdValue, GameAdapter][] = [
  [GameId.GENSHIN, genshinAdapter],
];

const adapters = new Map<GameIdValue, GameAdapter>(adapterEntries);

export function getGameAdapter(gameId: GameIdValue): GameAdapter {
  const adapter = adapters.get(gameId);

  if (!adapter) {
    throw new ConfigError(`No game adapter registered for gameId: ${gameId}`);
  }

  return adapter;
}

export function listRegisteredGameIds(): GameIdValue[] {
  return adapterEntries.map(([gameId]) => gameId);
}
