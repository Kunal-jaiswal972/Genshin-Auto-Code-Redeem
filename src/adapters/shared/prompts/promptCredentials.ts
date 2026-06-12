import type { GameIdValue } from "../../../config/constants.js";
import { getServerPromptChoices } from "../../../games/credentials.js";
import type { GameLoginCredentials } from "../../../domain/credentials/gameLoginCredentials.js";
import type { PromptPort } from "../../contracts/promptPort.js";

export async function promptCredentials(
  port: PromptPort,
  gameId: GameIdValue,
): Promise<GameLoginCredentials> {
  const username = await port.username();
  const password = await port.password();
  const serverChoices = getServerPromptChoices(gameId);
  const server = await port.choose("Server", serverChoices);

  return {
    username: username.trim(),
    password,
    server,
  };
}
