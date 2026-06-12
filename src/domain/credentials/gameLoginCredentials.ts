export interface GameLoginCredentials {
  username: string;
  password: string;
  server: string;
}

export function parseStoredCredentials(raw: unknown): GameLoginCredentials {
  if (typeof raw !== "object" || raw === null) {
    return { username: "", password: "", server: "" };
  }

  const record = raw as Record<string, unknown>;
  const legacyEmail = record.email;
  const username =
    typeof record.username === "string"
      ? record.username
      : typeof legacyEmail === "string"
        ? legacyEmail
        : "";

  return {
    username,
    password: typeof record.password === "string" ? record.password : "",
    server: typeof record.server === "string" ? record.server : "",
  };
}
