export interface DisplayCardRow {
  readonly label: string;
  readonly value: string;
}

export interface DisplayCard {
  readonly title: string;
  readonly rows: readonly DisplayCardRow[];
  readonly footer?: string;
}
