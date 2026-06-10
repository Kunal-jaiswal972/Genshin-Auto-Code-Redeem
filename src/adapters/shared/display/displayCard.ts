export interface DisplayCardRow {
  readonly label: string;
  readonly value: string;
}

export interface DisplayCard {
  readonly title: string;
  readonly rows: readonly DisplayCardRow[];
  readonly footer?: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function formatDisplayCardPlainText(card: DisplayCard): string {
  const lines = card.rows.map((row) => `${row.label}: ${row.value}`);

  if (card.footer) {
    lines.push(card.footer);
  }

  return lines.join("\n");
}

const CLI_LABEL_WIDTH = 12;

function formatCliRow(label: string, value: string): string {
  const labelColumn = label.padEnd(CLI_LABEL_WIDTH);
  const valueLines = value.split("\n");
  const firstLine = valueLines[0] ?? "";
  const continuationIndent = " ".repeat(CLI_LABEL_WIDTH + 1);

  if (valueLines.length <= 1) {
    return `${labelColumn} ${firstLine}`;
  }

  const formatted = [`${labelColumn} ${firstLine}`];

  for (const line of valueLines.slice(1)) {
    formatted.push(`${continuationIndent}${line}`);
  }

  return formatted.join("\n");
}

export function formatDisplayCardCliBody(card: DisplayCard): string {
  const lines = card.rows.map((row) => formatCliRow(row.label, row.value));

  if (card.footer) {
    lines.push("");
    lines.push(card.footer);
  }

  return lines.join("\n");
}

export function formatDisplayCardTelegramHtml(card: DisplayCard): string {
  const lines = [
    `<b>${escapeHtml(card.title)}</b>`,
    ...card.rows.map(
      (row) => `<b>${escapeHtml(row.label)}:</b> ${escapeHtml(row.value)}`,
    ),
  ];

  if (card.footer) {
    lines.push(`<i>${escapeHtml(card.footer)}</i>`);
  }

  return lines.join("\n");
}
