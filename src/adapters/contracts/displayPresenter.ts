import type { DisplayCard } from "../../domain/display/displayCard.js";

/** Renders structured cards (scheduled tasks, run history) for an adapter. */
export interface DisplayPresenter {
  displayCards(cards: readonly DisplayCard[]): void;
}
