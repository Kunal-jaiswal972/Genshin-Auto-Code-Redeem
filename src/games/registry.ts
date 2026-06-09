import { GameId, type GameIdValue } from "../config/constants.js";
import { ConfigError } from "../domain/errors.js";
import type { GameModule } from "../types/games.js";
import { genshinGameModule } from "./genshin/index.js";
import { hsrGameModule } from "./hsr/index.js";

/**
 * Single registration point for all games.
 * To add a game: create `src/games/<gameId>/`, then append its module here.
 * See AGENTS.md → "Adding a new game".
 */
export const gameModules = [genshinGameModule, hsrGameModule] as const satisfies readonly GameModule[];

const modulesById = new Map<GameIdValue, GameModule>(
  gameModules.map((module) => [module.id, module]),
);

function validateRegisteredModules(): void {
  for (const module of gameModules) {
    const knownIds = Object.values(GameId);
    if (!knownIds.includes(module.id)) {
      throw new ConfigError(
        `Game module "${module.id}" is not declared in GameId (src/config/constants.ts).`,
      );
    }
  }
}

validateRegisteredModules();

export const registeredGameIds = gameModules.map(
  (module) => module.id,
) as [GameIdValue, ...GameIdValue[]];

export function getGameModule(gameId: GameIdValue): GameModule {
  const module = modulesById.get(gameId);

  if (!module) {
    throw new ConfigError(
      `No game module registered for gameId: ${gameId}. Add it to src/games/registry.ts.`,
    );
  }

  return module;
}
