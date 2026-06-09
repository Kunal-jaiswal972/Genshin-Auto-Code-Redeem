export function isServerMode(argv: readonly string[] = process.argv): boolean {
  return argv.includes("--server");
}

export function isCliMode(argv: readonly string[] = process.argv): boolean {
  return argv.includes("--cli");
}
