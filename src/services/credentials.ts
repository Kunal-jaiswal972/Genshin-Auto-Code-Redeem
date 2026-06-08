import { ConfigError } from "../core/errors.js";
import type { GenshinEnvConfig } from "../types/env.js";
import type { GenshinLoginCredentials } from "../types/redeem.js";

export function requireCredentials(
  genshin: GenshinEnvConfig,
): GenshinLoginCredentials {
  const email = genshin.email.trim();
  const password = genshin.password;

  if (email.length === 0 || password.length === 0) {
    throw new ConfigError(
      "GENSHIN_EMAIL and GENSHIN_PASSWORD are required in .env.",
    );
  }

  return {
    email,
    password,
    server: genshin.server,
  };
}
