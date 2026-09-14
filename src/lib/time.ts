/** Time helpers — the golden rule of MeMyMate: 100 characters : 5 seconds. */

export const CHARS_PER_SECOND = 20; // 100 chars / 5 s
export const MIN_SECONDS = 3;
export const MAX_SECONDS = 120;

/**
 * Auto-compute the seconds for a play card from its text length
 * (letters, punctuation, symbols, numbers and spaces all count).
 * 100 characters → 5 s, rounded up, minimum 3 s.
 */
export function autoSeconds(text: string): number {
  const len = text.length;
  if (len === 0) return MIN_SECONDS;
  const secs = Math.ceil(len / CHARS_PER_SECOND);
  return Math.max(MIN_SECONDS, Math.min(MAX_SECONDS, secs));
}

/** Format seconds as m:ss (or just "42s" under a minute). */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}m ${rest.toString().padStart(2, "0")}s`;
}
