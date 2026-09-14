/** Core data types for MeMyMate. */

/** A single play card: one sentence/paragraph to memorize. */
export interface PlayCard {
  id: string;
  /** The sentence/paragraph the player must say out loud. */
  text: string;
  /** Seconds the card stays on screen. */
  seconds: number;
  /** How many consecutive times this card is repeated. Default 1. */
  repeats: number;
  /** True while `seconds` is being auto-derived from text length (100 chars : 5 s). */
  autoSeconds?: boolean;
}

/** A topic groups several play cards inside a knight. */
export interface Topic {
  id: string;
  name: string;
  cards: PlayCard[];
}

/** A Knight = a deck the player battles through. */
export interface Knight {
  id: string;
  ownerUsername: string;
  title: string;
  topics: Topic[];
  /** Original Knight Code, when the knight was created via code. */
  code?: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  theme: string; // theme id, see THEMES in settings
  mode: "light" | "dark" | "system";
  sound: boolean;
  guideSeen: boolean; // quick-guide overlay shown once after signup
}

export interface User {
  username: string;
  name: string;
  settings: UserSettings;
  createdAt: number;
}

export const defaultSettings = (): UserSettings => ({
  theme: "arct",
  mode: "system",
  sound: true,
  guideSeen: false,
});

export const newId = (): string =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
