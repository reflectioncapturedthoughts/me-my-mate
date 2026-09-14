/** Derived stats for a knight (cards, repetitions, total battle time). */
import type { Knight, Topic } from "./types";

export function topicStats(topic: Topic) {
  let cards = 0;
  let plays = 0; // cards × repeats
  let seconds = 0;
  for (const c of topic.cards) {
    cards += 1;
    plays += c.repeats || 1;
    seconds += (c.seconds || 0) * (c.repeats || 1);
  }
  return { cards, plays, seconds };
}

export function knightStats(knight: Knight) {
  let topics = knight.topics.length;
  let cards = 0;
  let plays = 0;
  let seconds = 0;
  for (const t of knight.topics) {
    const s = topicStats(t);
    cards += s.cards;
    plays += s.plays;
    seconds += s.seconds;
  }
  return { topics, cards, plays, seconds };
}

/** Build the public share link for a knight. */
export function shareLink(knight: Knight, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://me-my-mate.web.app");
  return `${base}/knight?by=${encodeURIComponent(knight.ownerUsername)}&id=${encodeURIComponent(knight.id)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
