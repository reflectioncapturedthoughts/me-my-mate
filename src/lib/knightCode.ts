/**
 * Knight Code — MeMyMate's custom little language.
 *
 *   <knightcode>
 *   <title>Know the Definitions</title>
 *   <topic1>Example Topic 1</topic1>
 *   <k1 5>A sentence to memorize<3/k>
 *   <k2>Auto-timed sentence (100 chars : 5 s)</k2>
 *   </knightcode>
 *
 *  • <kN S>  → the N-th card of the current topic, shown for S seconds.
 *              S omitted → auto from length (100 characters : 5 seconds).
 *              <k S> without a number works too.
 *  • <R/k>   → closing tag; R = consecutive repetitions (default 1).
 *              </k>, </kN> and <1/k> are all accepted.
 *  • <topicN>Name</topicN>  → starts a topic (</topic> also accepted).
 *
 * The parser is deliberately forgiving so students get helpful errors
 * instead of cryptic failures.
 */
import { autoSeconds } from "./time";
import type { PlayCard, Topic } from "./types";
import { newId } from "./types";

export interface CodeIssue {
  line: number;
  message: string;
  kind: "error" | "warning";
}

export interface ParsedCode {
  title: string;
  topics: Topic[];
  issues: CodeIssue[];
  ok: boolean;
}

export const KNIGHT_CODE_SAMPLE = `<knightcode>
<title>Know the Definitions</title>

<topic1>Physics Basics</topic1>
<k1 5>Force is a push or pull acting on an object.<2/k>
<k2 8>Newton's First Law: an object stays at rest or in uniform motion unless acted on by a force.</k>
<k3>Velocity is speed in a given direction — time is auto-set from length.<1/k>

<topic2>Chemistry Basics</topic2>
<k1 6>An atom is the smallest unit of matter that retains the properties of an element.<3/k>
<k2 4>The atomic number equals the number of protons in the nucleus.</k>
</knightcode>`;

const lineOf = (src: string, idx: number): number =>
  src.slice(0, idx).split("\n").length;

/**
 * Parse Knight Code into a title + topics/cards structure.
 * Never throws — returns { ok, issues } instead.
 */
export function parseKnightCode(input: string): ParsedCode {
  const issues: CodeIssue[] = [];
  const src = input.replace(/\r\n?/g, "\n");
  const topics: Topic[] = [];
  let title = "";

  const err = (line: number, message: string) =>
    issues.push({ line, message, kind: "error" });
  const warn = (line: number, message: string) =>
    issues.push({ line, message, kind: "warning" });

  const hasWrapper = /<knightcode>/i.test(src);
  if (!hasWrapper)
    warn(1, "Missing <knightcode> wrapper — parsed anyway. Add it to be safe.");

  // --- title ---
  const titleM = src.match(/<title>\s*([\s\S]*?)\s*<\/title>/i);
  if (titleM) title = titleM[1].trim();
  else warn(1, "No <title>…</title> found — the knight will be “Untitled Knight”.");

  // Walk through the source, picking up topic and card tags in order.
  // Token regex: topic open, card open, or anything else we must skip.
  const topicOpen = /<topic(\d*)>([\s\S]*?)(?:<\/topic\1>|<\/topic>)/gi;
  const cardOpen = /<k(\d*)(?:\s+(\d+(?:\.\d+)?))?\s*>([\s\S]*?)(?:<\s*(\d+(?:\.\d+)?)?\s*\/\s*k\d*\s*>|<\/\s*k\d*\s*>)/gi;

  // Merge tokens by position so topics and cards stay in order.
  type Tok =
    | { pos: number; type: "topic"; name: string }
    | { pos: number; type: "card"; seconds?: number; text: string; repeats: number; raw: string };
  const toks: Tok[] = [];

  for (const m of src.matchAll(topicOpen)) {
    toks.push({ pos: m.index!, type: "topic", name: m[2].trim() });
  }
  for (const m of src.matchAll(cardOpen)) {
    const text = m[3].trim();
    const repsRaw = m[4];
    const repeats = repsRaw ? Math.max(1, Math.round(parseFloat(repsRaw))) : 1;
    toks.push({
      pos: m.index!,
      type: "card",
      seconds: m[2] ? Math.max(1, Math.round(parseFloat(m[2]))) : undefined,
      text,
      repeats,
      raw: m[0],
    });
  }
  toks.sort((a, b) => a.pos - b.pos);

  let current: Topic | null = null;
  for (const t of toks) {
    if (t.type === "topic") {
      current = { id: newId(), name: t.name || `Topic ${topics.length + 1}`, cards: [] };
      topics.push(current);
    } else {
      if (!current) {
        // card before any topic → create a default topic
        current = { id: newId(), name: "Topic 1", cards: [] };
        topics.push(current);
        warn(lineOf(src, t.pos), "A card appeared before any <topic> — put it in a default “Topic 1”.");
      }
      if (!t.text) {
        err(lineOf(src, t.pos), "Empty card — every <k> needs some text to memorize.");
        continue;
      }
      const card: PlayCard = {
        id: newId(),
        text: t.text,
        seconds: t.seconds ?? autoSeconds(t.text),
        repeats: t.repeats,
        autoSeconds: t.seconds === undefined,
      };
      current.cards.push(card);
    }
  }

  // Detect malformed k tags that our forgiving regex couldn't match at all.
  const openCount = (src.match(/<k(\d*)(\s|>)/gi) || []).length;
  const matchedCards = toks.filter((t) => t.type === "card").length;
  if (openCount > matchedCards) {
    // find the first unmatched opening <k
    let idx = -1;
    let seen = 0;
    for (const m of src.matchAll(/<k(\d*)(\s|>)/gi)) {
      const closeIdx = src.slice(m.index).search(/<\s*\d*\s*\/\s*k\d*\s*>|<\/\s*k\d*\s*>/i);
      if (closeIdx < 0) {
        idx = m.index!;
        break;
      }
      seen++;
      if (seen > matchedCards && closeIdx < 0) {
        idx = m.index!;
        break;
      }
    }
    err(
      idx >= 0 ? lineOf(src, idx) : 1,
      "A <k …> card is missing its closing tag. Use </k> (or <2/k> for 2 repetitions)."
    );
  }

  const emptyTopics = topics.filter((t) => t.cards.length === 0);
  for (const t of emptyTopics) {
    const pos = src.search(new RegExp(`<topic\\d*>\\s*${escapeRe(t.name)}`, "i"));
    warn(pos >= 0 ? lineOf(src, pos) : 1, `Topic “${t.name}” has no cards.`);
  }

  const ok =
    !issues.some((i) => i.kind === "error") &&
    topics.some((t) => t.cards.length > 0);

  if (!ok && !issues.some((i) => i.kind === "error")) {
    err(1, "No play cards found. Cards look like: <k1 5>Say this out loud<2/k>");
  }

  return { title: title || "Untitled Knight", topics, issues, ok };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Generate Knight Code from structured topics (used by “View as Knight Code”). */
export function generateKnightCode(
  title: string,
  topics: Topic[],
  opts: { alwaysShowRepeats?: boolean } = {}
): string {
  const lines: string[] = ["<knightcode>", `<title>${title || "Untitled Knight"}</title>`];
  topics.forEach((topic, ti) => {
    lines.push("", `<topic${ti + 1}>${topic.name || `Topic ${ti + 1}`}</topic${ti + 1}>`);
    topic.cards.forEach((card, ci) => {
      const secs = card.seconds ?? autoSeconds(card.text);
      const reps = card.repeats ?? 1;
      const close =
        reps > 1 || opts.alwaysShowRepeats ? `<${reps}/k>` : `</k>`;
      lines.push(`<k${ci + 1} ${secs}>${card.text}${close}`);
    });
  });
  lines.push("</knightcode>");
  return lines.join("\n");
}

/**
 * Build the AI prompt students can paste into ChatGPT/Gemini/Claude
 * to convert a chapter into Knight Code.
 */
export function buildAiPrompt(chapterName: string, notes: string): string {
  const chapter = chapterName.trim() || "(your chapter name)";
  return `You are a study-content generator for the app MeMyMate.
Convert the study material below into "Knight Code" — a simple custom format.

STRICT RULES for Knight Code:
1. Wrap everything in <knightcode> … </knightcode>.
2. One <title>…</title> with the chapter name.
3. Split the content into logical topics: <topic1>Name</topic1>, <topic2>Name</topic2>, …
   (the topic name goes INSIDE the tags, on one line).
4. Every important sentence/definition/paragraph becomes one play card:
   <k1 SECONDS>text to memorize<REPEATS/k>
   - k1, k2, k3 … number the cards inside each topic (restart at k1 per topic).
   - SECONDS = time to say the card out loud. Use this ratio: 100 characters = 5 seconds,
     rounded up (e.g. 40 chars → 2s is too short, use minimum 3; 160 chars → 8).
   - Closing tag: </k> for 1 repetition, or <2/k>, <3/k> … for that many
     CONSECUTIVE repetitions. Repetitions: 3 for short key definitions,
     2 for medium sentences, 1 for long paragraphs.
5. Keep each card under ~300 characters. Split long paragraphs into cards.
6. Output ONLY the Knight Code — no explanations, no markdown fences.

EXAMPLE:
<knightcode>
<title>Cell Biology</title>
<topic1>Cell Structure</topic1>
<k1 4>The cell is the basic structural and functional unit of life.<3/k>
<k2 6>The nucleus controls all cell activities and contains DNA.<2/k>
</knightcode>

CHAPTER NAME: ${chapter}

STUDY MATERIAL:
${notes.trim() || "(paste your chapter text, notes, or list of definitions here)"}
`;
}
