import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Modal from "../components/Modal";
import {
  IcAlert, IcBook, IcBot, IcCards, IcCheck, IcClock, IcCode, IcCopy, IcLayers, IcPen, IcPlus, IcRotate, IcShield, IcX,
} from "../components/Icons";
import { useApp } from "../context/AppContext";
import { buildAiPrompt, generateKnightCode, KNIGHT_CODE_SAMPLE, parseKnightCode } from "../lib/knightCode";
import { copyText, knightStats } from "../lib/knightStats";
import { sfx } from "../lib/sound";
import { autoSeconds, formatDuration } from "../lib/time";
import type { Knight, PlayCard, Topic } from "../lib/types";
import { newId } from "../lib/types";

type Mode = "form" | "code";

const emptyCard = (): PlayCard => ({
  id: newId(),
  text: "",
  seconds: 3,
  repeats: 1,
  autoSeconds: true,
});

const emptyTopic = (n: number): Topic => ({
  id: newId(),
  name: `Topic ${n}`,
  cards: [emptyCard()],
});

export default function CreatePage() {
  const { user, knights, saveKnight, toast } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const editing = useMemo(
    () => knights.find((k) => k.id === editId) ?? null,
    [knights, editId]
  );

  const [mode, setMode] = useState<Mode>("form");
  const [title, setTitle] = useState("");
  const [topics, setTopics] = useState<Topic[]>([emptyTopic(1)]);
  const [code, setCode] = useState(KNIGHT_CODE_SAMPLE);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [codeViewOpen, setCodeViewOpen] = useState(false);

  /* load knight when editing (knights may still be loading on first render) */
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!editing || loadedFor.current === editing.id) return;
    loadedFor.current = editing.id;
    setTitle(editing.title);
    if (editing.code) {
      setCode(editing.code);
      setMode("code");
    } else {
      setTopics(JSON.parse(JSON.stringify(editing.topics)));
      setMode("form");
    }
  }, [editing]);

  const parsed = useMemo(() => parseKnightCode(code), [code]);

  /* ------------------------- form helpers ------------------------- */

  const patchTopic = (ti: number, patch: Partial<Topic>) =>
    setTopics((ts) => ts.map((t, i) => (i === ti ? { ...t, ...patch } : t)));

  const patchCard = (ti: number, ci: number, patch: Partial<PlayCard>) =>
    setTopics((ts) =>
      ts.map((t, i) =>
        i === ti ? { ...t, cards: t.cards.map((c, j) => (j === ci ? { ...c, ...patch } : c)) } : t
      )
    );

  /** Typing in a card auto-updates its seconds (100 chars : 5 s) — unless the
   *  student changed the seconds by hand (autoSeconds === false). */
  const onCardText = (ti: number, ci: number, text: string) => {
    setTopics((ts) =>
      ts.map((t, i) =>
        i === ti
          ? {
              ...t,
              cards: t.cards.map((c, j) =>
                j === ci
                  ? { ...c, text, seconds: c.autoSeconds === false ? c.seconds : autoSeconds(text) }
                  : c
              ),
            }
          : t
      )
    );
  };

  const formStats = useMemo(() => {
    const clean = topics
      .map((t) => ({ ...t, cards: t.cards.filter((c) => c.text.trim()) }))
      .filter((t) => t.cards.length > 0);
    return knightStats({ topics: clean } as Knight);
  }, [topics]);

  /* ------------------------- save ------------------------- */

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let finalTitle = title.trim();
      let finalTopics: Topic[];
      let finalCode: string | undefined;

      if (mode === "code") {
        if (!parsed.ok) {
          toast("Fix the Knight Code errors first.");
          sfx.fail();
          return;
        }
        finalTitle = finalTitle || parsed.title;
        finalTopics = parsed.topics;
        finalCode = code;
      } else {
        finalTopics = topics
          .map((t) => ({
            ...t,
            name: t.name.trim() || "Topic",
            cards: t.cards
              .filter((c) => c.text.trim())
              .map((c) => ({
                ...c,
                text: c.text.trim(),
                seconds: Math.max(1, Math.min(600, Math.round(c.seconds) || autoSeconds(c.text))),
                repeats: Math.max(1, Math.min(50, Math.round(c.repeats) || 1)),
              })),
          }))
          .filter((t) => t.cards.length > 0);

        if (finalTopics.length === 0) {
          toast("Add at least one card with some text.");
          sfx.fail();
          return;
        }
        finalCode = undefined;
      }

      if (!finalTitle) finalTitle = "Untitled Knight";

      const knight: Knight = editing
        ? { ...editing, title: finalTitle, topics: finalTopics, code: finalCode, updatedAt: Date.now() }
        : {
            id: newId(),
            ownerUsername: user.username,
            title: finalTitle,
            topics: finalTopics,
            code: finalCode,
            isPublic: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

      await saveKnight(knight);
      sfx.success();
      toast(editing ? "Knight updated." : "Knight forged — ready to play.");
      navigate(editing ? "/" : `/play/${knight.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  /* ------------------------- render ------------------------- */

  return (
    <main className="page">
      <>
      <span className="overline">{editing ? "Workshop" : "Workshop"}</span>
      <h1 className="page-title">{editing ? "Edit Knight" : "Forge a Knight"}</h1>
      </>
      <p className="subtitle">
        A Knight holds the sentences & paragraphs you must memorize, grouped into
        topics. Pick how you want to build it:
      </p>

      {!editing && (
        <div className="mode-switch">
          <button
            className={`mode-card ${mode === "form" ? "selected" : ""}`}
            onClick={() => { setMode("form"); sfx.click(); }}
          >
            <span className="mc-ico"><IcPen /></span>
            <b>Type it</b>
            <span>Fill topics and cards in a friendly form. Time auto-sets as you type.</span>
          </button>
          <button
            className={`mode-card ${mode === "code" ? "selected" : ""}`}
            onClick={() => { setMode("code"); sfx.click(); }}
          >
            <span className="mc-ico"><IcCode /></span>
            <b>Knight Code</b>
            <span>Write — or AI-generate — the whole knight in our mini language.</span>
          </button>
        </div>
      )}

      <div className="field">
        <label htmlFor="ktitle">Knight title</label>
        <input
          id="ktitle"
          className="input"
          placeholder="e.g. Science — Chapter 3: Force & Laws of Motion"
          value={mode === "code" ? title || parsed.title : title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={90}
        />
        {mode === "code" && !title && (
          <span className="hint">Falls back to the &lt;title&gt; in your code.</span>
        )}
      </div>

      {mode === "form" ? (
        <FormEditor
          topics={topics}
          setTopics={setTopics}
          patchTopic={patchTopic}
          patchCard={patchCard}
          onCardText={onCardText}
          onViewCode={() => setCodeViewOpen(true)}
        />
      ) : (
        <CodeEditor
          code={code}
          setCode={setCode}
          parsed={parsed}
          onAi={() => setAiOpen(true)}
          onEditAsForm={() => {
            if (parsed.ok) {
              setTitle(title || parsed.title);
              setTopics(JSON.parse(JSON.stringify(parsed.topics)));
              setMode("form");
              toast("Loaded into the form editor.");
            } else {
              toast("Fix the code errors first, then switch to the form.");
            }
          }}
        />
      )}

      {/* sticky save bar */}
      <div className="summary-bar">
        <div className="row small" style={{ fontWeight: 800 }}>
          <span className="chip"><IcLayers size={13} /> {mode === "form" ? formStats.topics : (parsed.ok ? parsed.topics.length : 0)} topics</span>
          <span className="chip"><IcCards size={13} /> {mode === "form" ? formStats.cards : (parsed.ok ? parsed.topics.reduce((n, t) => n + t.cards.length, 0) : 0)} cards</span>
          <span className="chip"><IcClock size={13} /> {formatDuration(mode === "form" ? formStats.seconds : parsed.ok ? parsed.topics.reduce((s, t) => s + t.cards.reduce((x, c) => x + c.seconds * c.repeats, 0), 0) : 0)}</span>
        </div>
        <div className="row">
          <button className="btn btn-ghost" onClick={() => navigate("/")}>Cancel</button>
          <button className="btn btn-accent btn-lg" onClick={save} disabled={saving}>
            {saving ? "Forging…" : editing ? "Save changes" : "Forge Knight"}
            {!saving && <IcShield size={16} />}
          </button>
        </div>
      </div>

      {/* AI prompt modal */}
      <AiPromptModal open={aiOpen} onClose={() => setAiOpen(false)}
        onUseCode={(c) => { setCode(c); setMode("code"); setAiOpen(false); toast("Knight Code pasted — check the live preview below."); }} />

      {/* form → code view modal */}
      <Modal open={codeViewOpen} onClose={() => setCodeViewOpen(false)} title="Your Knight as Code" wide>
        <p className="hint" style={{ marginTop: 0 }}>
          Same knight, in Knight Code. Copy it to share as text, or paste it into
          the Code editor later.
        </p>
        <pre className="code-sample mono">{generateKnightCode(title || "Untitled Knight", topics.filter((t) => t.cards.some((c) => c.text.trim())))}</pre>
        <div className="row mt-2">
          <button
            className="btn btn-primary"
            onClick={async () => {
              const ok = await copyText(generateKnightCode(title || "Untitled Knight", topics));
              toast(ok ? "Knight Code copied." : "Copy failed — select it manually.");
            }}
          >
            <IcCopy size={15} /> Copy code
          </button>
          <button className="btn btn-ghost" onClick={() => setCodeViewOpen(false)}>Close</button>
        </div>
      </Modal>
    </main>
  );
}

/* ================================================================= */
/* Form editor                                                        */
/* ================================================================= */

function FormEditor({
  topics, setTopics, patchTopic, patchCard, onCardText, onViewCode,
}: {
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
  patchTopic: (ti: number, patch: Partial<Topic>) => void;
  patchCard: (ti: number, ci: number, patch: Partial<PlayCard>) => void;
  onCardText: (ti: number, ci: number, text: string) => void;
  onViewCode: () => void;
}) {
  return (
    <div>
      {topics.map((topic, ti) => (
        <div className="topic-block" key={topic.id}>
          <div className="topic-head">
            <span className="num">{ti + 1}</span>
            <input
              className="input"
              style={{ flex: 1, minWidth: 160 }}
              placeholder={`Topic ${ti + 1} name — e.g. “Definitions”`}
              value={topic.name}
              onChange={(e) => patchTopic(ti, { name: e.target.value })}
              maxLength={60}
              aria-label={`Topic ${ti + 1} name`}
            />
            <button
              className="btn btn-danger btn-icon"
              title="Delete topic"
              onClick={() => {
                if (topics.length === 1) return;
                sfx.click();
                setTopics((ts) => ts.filter((_, i) => i !== ti));
              }}
              disabled={topics.length === 1}
            >
              <IcX size={16} />
            </button>
          </div>

          {topic.cards.map((card, ci) => (
            <div className="card-row" key={card.id}>
              <div className="card-row-head">
                <b className="small">Card {ci + 1}</b>
                <div className="row" style={{ gap: 6 }}>
                  {card.autoSeconds !== false && card.text.length > 0 && (
                    <span className="badge-auto">auto time</span>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    title="Delete card"
                    onClick={() => {
                      sfx.click();
                      setTopics((ts) =>
                        ts.map((t, i) =>
                          i === ti ? { ...t, cards: t.cards.filter((_, j) => j !== ci) } : t
                        )
                      );
                    }}
                  >
                    <IcX size={14} />
                  </button>
                </div>
              </div>

              <textarea
                className="textarea"
                style={{ minHeight: 70 }}
                placeholder="Type the sentence/paragraph to memorize — seconds adjust automatically as you type (100 characters : 5 seconds)…"
                value={card.text}
                onChange={(e) => onCardText(ti, ci, e.target.value)}
                maxLength={1200}
                aria-label={`Card ${ci + 1} text`}
              />

              <div className="card-row-controls">
                <div className="ctl">
                  <span className="label">Seconds</span>
                  <div className="row" style={{ gap: 6 }}>
                    <input
                      className="input input-num"
                      type="number"
                      min={1}
                      max={600}
                      value={card.seconds}
                      onChange={(e) =>
                        patchCard(ti, ci, {
                          seconds: Math.max(1, Math.min(600, Number(e.target.value) || 1)),
                          autoSeconds: false, // student took manual control
                        })
                      }
                      aria-label={`Card ${ci + 1} seconds`}
                    />
                    {card.autoSeconds === false && (
                      <button
                        className="btn btn-soft btn-sm"
                        title="Go back to automatic time (100 chars : 5 s)"
                        onClick={() => patchCard(ti, ci, { autoSeconds: true, seconds: autoSeconds(card.text) })}
                      >
                        <IcRotate size={13} /> auto
                      </button>
                    )}
                  </div>
                </div>
                <div className="ctl">
                  <span className="label">Repetitions</span>
                  <input
                    className="input input-num"
                    type="number"
                    min={1}
                    max={50}
                    value={card.repeats}
                    onChange={(e) =>
                      patchCard(ti, ci, { repeats: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })
                    }
                    aria-label={`Card ${ci + 1} repetitions`}
                  />
                </div>
                <span className="hint" style={{ alignSelf: "center" }}>
                  {card.text.length} chars → auto {autoSeconds(card.text)}s · card plays {card.repeats}× consecutively
                </span>
              </div>
            </div>
          ))}

          <button
            className="btn btn-soft btn-sm"
            onClick={() => {
              sfx.click();
              patchTopic(ti, { cards: [...topic.cards, emptyCard()] });
            }}
          >
            <IcPlus size={14} /> Add card to this topic
          </button>
        </div>
      ))}

      <div className="row mt-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            sfx.click();
            setTopics((ts) => [...ts, { id: newId(), name: `Topic ${ts.length + 1}`, cards: [emptyCard()] }]);
          }}
        >
          <IcPlus size={15} /> Add topic
        </button>
        <button className="btn btn-ghost" onClick={onViewCode}><IcCode size={15} /> View as Knight Code</button>
      </div>
    </div>
  );
}

/* ================================================================= */
/* Code editor                                                        */
/* ================================================================= */

function CodeEditor({
  code, setCode, parsed, onAi, onEditAsForm,
}: {
  code: string;
  setCode: (c: string) => void;
  parsed: ReturnType<typeof parseKnightCode>;
  onAi: () => void;
  onEditAsForm: () => void;
}) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn btn-primary" onClick={onAi}><IcBot size={16} /> Create with AI</button>
        <button className="btn btn-soft" onClick={() => { sfx.click(); setCode(KNIGHT_CODE_SAMPLE); }}>Load sample</button>
        <button className="btn btn-soft" onClick={onEditAsForm}><IcPen size={15} /> Edit as form</button>
        <a className="btn btn-ghost" href="/guide#knight-code"><IcBook size={15} /> Syntax help</a>
      </div>

      <textarea
        className="textarea mono code-editor"
        spellCheck={false}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Knight Code editor"
      />

      <div className="issues">
        {parsed.issues.length === 0 && parsed.ok && (
          <div className="issue ok"><IcCheck size={15} /> Perfect Knight Code — {parsed.topics.length} topics, ready to forge.</div>
        )}
        {parsed.issues.map((is, i) => (
          <div className={`issue ${is.kind}`} key={i}>
            {is.kind === "error" ? <IcAlert size={15} /> : <IcAlert size={15} />} Line {is.line}: {is.message}
          </div>
        ))}
        {parsed.ok && parsed.topics.some((t) => t.cards.length > 0) && parsed.issues.length > 0 && (
          <div className="issue ok"><IcCheck size={15} /> Still forgeable — warnings won't stop you.</div>
        )}
      </div>
    </div>
  );
}

/* ================================================================= */
/* AI prompt modal                                                    */
/* ================================================================= */

function AiPromptModal({
  open, onClose, onUseCode,
}: {
  open: boolean;
  onClose: () => void;
  onUseCode: (code: string) => void;
}) {
  const { toast } = useApp();
  const [chapter, setChapter] = useState("");
  const [notes, setNotes] = useState("");
  const [paste, setPaste] = useState("");

  const prompt = useMemo(() => buildAiPrompt(chapter, notes), [chapter, notes]);

  return (
    <Modal open={open} onClose={onClose} title="Generate Knight Code with AI" wide>
      <div className="steps" style={{ marginBottom: 16 }}>
        <div className="step">
          <span className="n">1</span>
          <div>
            <b>Copy this prompt</b>
            <p>It teaches any AI (ChatGPT, Gemini, Claude…) the Knight Code format.</p>
          </div>
        </div>
        <div className="step">
          <span className="n">2</span>
          <div>
            <b>Paste it into your AI + add your chapter text</b>
            <p>Fill in the chapter name and study material below first — they're baked into the prompt.</p>
          </div>
        </div>
        <div className="step">
          <span className="n">3</span>
          <div>
            <b>Paste the AI's answer back here</b>
            <p>Use the box at the bottom — we'll drop it into the code editor for you.</p>
          </div>
        </div>
      </div>

      <div className="field">
        <label>Chapter / subject name</label>
        <input
          className="input"
          placeholder="e.g. Biology — Chapter 5: Photosynthesis"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Study material to memorize (paste your notes / textbook text)</label>
        <textarea
          className="textarea"
          style={{ minHeight: 120 }}
          placeholder="Paste the definitions, paragraphs or notes you must know…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <pre className="code-sample mono" style={{ maxHeight: 220, whiteSpace: "pre-wrap", fontSize: "0.78rem" }}>{prompt}</pre>
      <div className="row mt-1">
        <button
          className="btn btn-primary"
          onClick={async () => {
            const ok = await copyText(prompt);
            sfx.click();
            toast(ok ? "Prompt copied — paste it into your AI." : "Copy failed; select the text manually.");
          }}
        >
          <IcCopy size={15} /> Copy the AI prompt
        </button>
      </div>

      <div className="divider" />

      <div className="field">
        <label>Got the Knight Code back? Paste it here</label>
        <textarea
          className="textarea mono"
          style={{ minHeight: 110 }}
          placeholder="<knightcode>…"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
      </div>
      <div className="row">
        <button
          className="btn btn-accent"
          disabled={!paste.includes("<")}
          onClick={() => {
            sfx.success();
            onUseCode(paste);
            setPaste("");
          }}
        >
          <IcCode size={15} /> Use this code
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
