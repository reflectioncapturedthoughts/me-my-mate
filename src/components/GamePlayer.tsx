import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "./Confetti";
import {
  IcArrowLeft, IcCheck, IcClock, IcDoor, IcLink, IcMic, IcRepeat, IcRotate, IcShield, IcTrophy, IcX, IcZap,
} from "./Icons";
import { bumpStat, setBestTime } from "../lib/backend";
import { useApp } from "../context/AppContext";
import { copyText, knightStats, shareLink, topicStats } from "../lib/knightStats";
import { sfx } from "../lib/sound";
import { formatDuration } from "../lib/time";
import type { Knight, PlayCard } from "../lib/types";

/* ---------------- step model ---------------- */

interface Step {
  topicIdx: number;
  topicName: string;
  cardIdx: number;
  card: PlayCard;
  rep: number; // 1-based repetition index
  reps: number;
}

function buildSteps(knight: Knight): Step[] {
  const steps: Step[] = [];
  knight.topics.forEach((topic, topicIdx) => {
    topic.cards.forEach((card, cardIdx) => {
      const reps = Math.max(1, card.repeats || 1);
      for (let r = 0; r < reps; r++) {
        steps.push({
          topicIdx,
          topicName: topic.name || `Topic ${topicIdx + 1}`,
          cardIdx,
          card,
          rep: r + 1,
          reps,
        });
      }
    });
  });
  return steps;
}

type Phase = "intro" | "playing" | "topicClear" | "failed" | "win";

const RING_R = 66; // px radius of the timer ring
const RING_C = 2 * Math.PI * RING_R;

/**
 * The full-screen game. Say each card out loud, then TAP before the
 * ring runs out. One miss → restart the battle.
 */
export default function GamePlayer({
  knight,
  onExit,
  onWinShare,
}: {
  knight: Knight;
  onExit: () => void;
  onWinShare?: () => void;
}) {
  const steps = useMemo(() => buildSteps(knight), [knight]);
  const ks = useMemo(() => knightStats(knight), [knight]);
  const { toast } = useApp();

  const [phase, setPhase] = useState<Phase>("intro");
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(0); // seconds left (float)
  const [okStamp, setOkStamp] = useState(0); // key to trigger "SAID IT!" stamp
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [shake, setShake] = useState(false);
  const [elapsedTotal, setElapsedTotal] = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);

  const stepStartRef = useRef(0); // performance.now when current step began
  const deadlineRef = useRef(0);
  const advancingRef = useRef(false);
  const tickRef = useRef(-1);
  const startWallRef = useRef(0);
  const timerInt = useRef<number | null>(null);

  const step = steps[stepIdx];

  /* --------- timer engine --------- */

  const stopTimer = () => {
    if (timerInt.current !== null) {
      window.clearInterval(timerInt.current);
      timerInt.current = null;
    }
  };

  const runStep = useCallback(
    (idx: number) => {
      const s = steps[idx];
      if (!s) return;
      advancingRef.current = false;
      const secs = Math.max(1, s.card.seconds || 3);
      stepStartRef.current = performance.now();
      deadlineRef.current = stepStartRef.current + secs * 1000;
      setStepIdx(idx);
      tickRef.current = -1;
      setRemaining(secs);
      setPhase("playing");
      sfx.cardIn();

      stopTimer();
      timerInt.current = window.setInterval(() => {
        const left = Math.max(0, (deadlineRef.current - performance.now()) / 1000);
        setRemaining(left);
        const whole = Math.ceil(left);
        if (whole <= 3 && whole >= 1 && whole !== tickRef.current) {
          tickRef.current = whole;
          sfx.tick();
        }
        if (left <= 0) {
          stopTimer();
          failStep();
        }
      }, 100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps]
  );

  const failStep = () => {
    sfx.fail();
    setFlash("bad");
    setShake(true);
    setTimeout(() => {
      setFlash(null);
      setShake(false);
    }, 600);
    setPhase("failed");
  };

  /* --------- tap = "I said it!" --------- */

  const tap = useCallback(() => {
    if (phase !== "playing" || advancingRef.current || !step) return;
    // tiny grace period so an eager double-tap doesn't skip the card
    if (performance.now() - stepStartRef.current < 350) return;
    advancingRef.current = true;
    stopTimer();
    sfx.tap();

    const isTopicLast =
      stepIdx + 1 >= steps.length || steps[stepIdx + 1].topicIdx !== step.topicIdx;
    const isLast = stepIdx + 1 >= steps.length;

    setOkStamp((k) => k + 1);
    setFlash("ok");
    setTimeout(() => setFlash(null), 560);
    sfx.success();

    setTimeout(() => {
      if (isLast) {
        const totalSecs = Math.round((performance.now() - startWallRef.current) / 1000);
        setElapsedTotal(totalSecs);
        bumpStat(knight.id, "playsCompleted");
        bumpStat(knight.id, "cardsSaid", steps.length);
        setBestTime(knight.id, totalSecs);
        sfx.win();
        setPhase("win");
      } else if (isTopicLast) {
        setPhase("topicClear");
        sfx.topicClear();
        setTimeout(() => runStep(stepIdx + 1), 1700);
      } else {
        runStep(stepIdx + 1);
      }
    }, 620);
  }, [phase, step, stepIdx, steps, knight.id, runStep]);

  /* keyboard: Space/Enter = tap */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        if (phase === "playing") {
          e.preventDefault();
          tap();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, tap]);

  useEffect(() => () => stopTimer(), []);

  /* --------- transitions --------- */

  const startGame = () => {
    sfx.tap();
    startWallRef.current = performance.now();
    tickRef.current = -1;
    setStepIdx(0);
    bumpStat(knight.id, "playsStarted");
    runStep(0);
  };

  const restart = () => {
    sfx.tap();
    tickRef.current = -1;
    setStepIdx(0);
    startWallRef.current = performance.now();
    bumpStat(knight.id, "playsStarted");
    runStep(0);
  };

  /* --------- render --------- */

  const urgent = remaining <= 3 && phase === "playing";
  const ringFrac = step ? Math.max(0, Math.min(1, remaining / Math.max(1, step.card.seconds))) : 1;

  return (
    <div className="play-stage" onClickCapture={(e) => {
      // tapping anywhere on the play area counts (but not on buttons/overlays)
      const t = e.target as HTMLElement;
      if (phase === "playing" && !t.closest("button") && !t.closest(".play-top")) tap();
    }}>
      {/* top bar */}
      <div className="play-top">
        <button className="btn btn-ghost btn-sm" onClick={() => (phase === "intro" ? onExit() : setConfirmQuit(true))}>
          <IcX size={14} /> Quit
        </button>
        <div className="row" style={{ gap: 6, minWidth: 0 }}>
          <span
            className="chip"
            style={{ maxWidth: "38vw", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {step ? step.topicName : knight.title}
          </span>
          {step && step.reps > 1 && (
            <span className="chip accent"><IcRepeat size={13} /> {step.rep}/{step.reps}</span>
          )}
        </div>
        <span className="chip">{Math.min(stepIdx + 1, steps.length)}/{steps.length}</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(stepIdx / steps.length) * 100}%` }} />
      </div>

      {/* body */}
      <div className="play-body">
        {phase !== "intro" && step && (
          <div className="playcard-wrap" style={{ width: "min(680px, 100%)" }}>
            <div className={`playcard ${shake ? "shake" : ""}`} key={stepIdx}>
              <div className="playcard-meta">
                <span className="chip">Card {step.cardIdx + 1}</span>
                <span className={`secs-left ${urgent ? "urgent" : ""}`}>
                  {phase === "playing" ? `${Math.ceil(remaining)}s` : `${step.card.seconds}s`}
                </span>
              </div>
              <div className="playcard-text">{step.card.text}</div>
            </div>

            <div className="tap-zone">
              <button
                className={`tap-btn ${urgent ? "urgent" : ""}`}
                onClick={(e) => { e.stopPropagation(); tap(); }}
                aria-label="I said it — next card"
              >
                <svg className="tap-ring" viewBox="0 0 160 160" width="100%" height="100%">
                  <circle className="track" cx="80" cy="80" r={RING_R} />
                  <circle
                    className={`bar ${urgent ? "urgent" : ""}`}
                    cx="80" cy="80" r={RING_R}
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - ringFrac)}
                  />
                </svg>
                <span style={{ position: "relative" }}>
                  {urgent ? <>QUICK!<br />TAP!</> : "TAP!"}
                </span>
              </button>
              <div className="tap-hint">
                <IcMic size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
                <b>Say it out loud</b>, then tap anywhere before the ring empties
              </div>
            </div>
          </div>
        )}
      </div>

      {/* feedback layers */}
      {flash === "ok" && <div className="flash-ok" />}
      {flash === "bad" && <div className="flash-bad" />}
      {okStamp > 0 && flash === "ok" && <div className="ok-stamp" key={okStamp}>SAID IT!</div>}

      {/* ---------- intro overlay ---------- */}
      {phase === "intro" && (
        <div className="play-overlay">
          <div className="overlay-card">
            <div className="overlay-ico"><IcShield /></div>
            <h2>{knight.title}</h2>
            <p>by @{knight.ownerUsername}</p>
            <div className="topic-list">
              {knight.topics.map((t, i) => {
                const s = topicStats(t);
                return (
                  <div className="tl" key={t.id || i}>
                    <b>{i + 1}. {t.name}</b>
                    <span>{s.cards} cards · {formatDuration(s.seconds)}</span>
                  </div>
                );
              })}
            </div>
            <p className="small muted">
              {ks.plays} card plays · about {formatDuration(ks.seconds)} per battle.
              <br />
              Say each card from memory, then <b>tap</b>. Miss one and you restart.
            </p>
            <div className="overlay-actions">
              <button className="btn btn-primary btn-lg" onClick={startGame}>Start Battle</button>
              <button className="btn btn-ghost" onClick={onExit}><IcArrowLeft size={16} /> Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- topic clear (auto-continues) ---------- */}
      {phase === "topicClear" && step && (
        <div className="play-overlay" style={{ background: "transparent", backdropFilter: "none" }}>
          <div className="overlay-card" style={{ pointerEvents: "none" }}>
            <div className="overlay-ico"><IcZap /></div>
            <h2>Topic cleared</h2>
            <p>
              “{step.topicName}” conquered. Onward to{" "}
              <b>{steps[stepIdx + 1]?.topicName ?? "the next topic"}</b>…
            </p>
          </div>
        </div>
      )}

      {/* ---------- failed ---------- */}
      {phase === "failed" && step && (
        <div className="play-overlay">
          <div className="overlay-card">
            <div className="overlay-ico" style={{ color: "var(--danger)", background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}><IcClock /></div>
            <h2>Time's up</h2>
            <p>You froze on this one — knights train again from the start.</p>
            <div className="card" style={{ textAlign: "left", background: "var(--surface2)", marginBottom: 18 }}>
              <span className="label">The card was:</span>
              <p style={{ fontWeight: 700, margin: "6px 0 0" }}>{step.card.text}</p>
            </div>
            <div className="overlay-actions">
              <button className="btn btn-primary btn-lg" onClick={restart}><IcRotate size={17} /> Restart Knight</button>
              <button className="btn btn-ghost" onClick={onExit}><IcDoor size={16} /> Quit</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- win ---------- */}
      {phase === "win" && (
        <div className="play-overlay">
          <Confetti />
          <div className="overlay-card">
            <div className="overlay-ico"><IcTrophy /></div>
            <h2>Knight conquered</h2>
            <p>You said every card in “{knight.title}” out loud. That's how memorizing should feel.</p>
            <div className="win-stats">
              <div className="win-stat"><b>{formatDuration(elapsedTotal)}</b><span>Total time</span></div>
              <div className="win-stat"><b>{steps.length}</b><span>Cards said</span></div>
              <div className="win-stat"><b>{ks.topics}</b><span>Topics</span></div>
            </div>
            <div className="overlay-actions">
              <button className="btn btn-primary btn-lg" onClick={restart}><IcRotate size={17} /> Play again</button>
              <button
                className="btn btn-soft"
                onClick={async () => {
                  const ok = await copyText(shareLink(knight));
                  sfx.click();
                  toast(ok ? "Share link copied" : "Could not copy the link.");
                  if (ok) onWinShare?.();
                }}
              >
                <IcLink size={16} /> Copy share link
              </button>
              <button className="btn btn-ghost" onClick={onExit}><IcCheck size={16} /> Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- quit confirm ---------- */}
      {confirmQuit && (
        <div className="play-overlay">
          <div className="overlay-card">
            <div className="overlay-ico"><IcDoor /></div>
            <h2>Leave the battle?</h2>
            <p>Your progress in this run will be lost.</p>
            <div className="overlay-actions">
              <button className="btn btn-primary" onClick={() => { stopTimer(); onExit(); }}>Yes, quit</button>
              <button className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>Keep playing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
