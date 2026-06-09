import { GameId, GenshinServer, type GameIdValue } from "../../../config/constants.js";
import { HsrServer } from "../../../games/hsr/constants.js";
import type { GameLoginCredentials } from "../../../types/redeem.js";
import type { PromptPort } from "../../ports/promptPort.js";

function getServerChoices(gameId: GameIdValue) {
  switch (gameId) {
    case GameId.GENSHIN:
      return [
        { value: GenshinServer.AMERICA, label: GenshinServer.AMERICA },
        { value: GenshinServer.EUROPE, label: GenshinServer.EUROPE },
        { value: GenshinServer.ASIA, label: GenshinServer.ASIA },
        { value: GenshinServer.TW_HK_MO, label: GenshinServer.TW_HK_MO },
      ];
    case GameId.HSR:
      return [
        { value: HsrServer.AMERICA, label: HsrServer.AMERICA },
        { value: HsrServer.EUROPE, label: HsrServer.EUROPE },
        { value: HsrServer.ASIA, label: HsrServer.ASIA },
        { value: HsrServer.TW_HK_MO, label: HsrServer.TW_HK_MO },
      ];
    default: {
      const exhaustive: never = gameId;
      throw new Error(`Unsupported game: ${exhaustive}`);
    }
  }
}

export async function collectCredentials(
  port: PromptPort,
  gameId: GameIdValue,
): Promise<GameLoginCredentials> {
  const username = await port.username();
  const password = await port.password();
  const serverChoices = getServerChoices(gameId);
  const server = await port.choose("Server", serverChoices);

  return {
    username: username.trim(),
    password,
    server,
  };
}
