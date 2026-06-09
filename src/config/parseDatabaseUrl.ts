export interface ParsedDatabaseUrl {
  kind: "sqlite" | "json";
  path: string;
}

export function parseDatabaseUrl(databaseUrl: string): ParsedDatabaseUrl {
  if (databaseUrl.startsWith("json:")) {
    return {
      kind: "json",
      path: databaseUrl.slice("json:".length),
    };
  }

  if (databaseUrl.startsWith("file:")) {
    return {
      kind: "sqlite",
      path: databaseUrl.slice("file:".length),
    };
  }

  return {
    kind: "sqlite",
    path: databaseUrl,
  };
}
