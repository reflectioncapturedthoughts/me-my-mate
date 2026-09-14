import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GamePlayer from "../components/GamePlayer";
import { IcCards, IcClock, IcCopy, IcLink, IcPlay, IcRepeat, IcShield, IcSparkles } from "../components/Icons";
import { LogoTile } from "../components/Logo";
import { useApp } from "../context/AppContext";
import { copyText, knightStats, shareLink, topicStats } from "../lib/knightStats";
import { formatDuration } from "../lib/time";
import type { Knight } from "../lib/types";
import { sfx } from "../lib/sound";

type LoadState = "loading" | "found" | "missing" | "badlink";

/**
 * /knight?by=<username>&id=<knightId>
 * Public page for a shared Knight — playable without an account.
 */
export default function SharedKnightPage() {
  const [params] = useSearchParams();
  const by = params.get("by") ?? "";
  const id = params.get("id") ?? "";
  const { getSharedKnight, user, forkKnight, toast } = useApp();

  const [state, setState] = useState<LoadState>(by && id ? "loading" : "badlink");
  const [knight, setKnight] = useState<Knight | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!by || !id) {
      setState("badlink");
      return;
    }
    let alive = true;
    setState("loading");
    getSharedKnight(by, id).then((k) => {
      if (!alive) return;
      if (k) {
        setKnight(k);
        setState("found");
      } else {
        setState("missing");
      }
    });
    return () => { alive = false; };
  }, [by, id, getSharedKnight]);

  if (playing && knight) {
    return <GamePlayer knight={knight} onExit={() => setPlaying(false)} />;
  }

  return (
    <main className="page">
      {state === "loading" && <div className="spinner" />}

      {state === "badlink" && (
        <div className="empty-state">
          <div style={{ margin: "0 auto 14px", width: 64 }}><LogoTile size={64} radius={18} /></div>
          <h2>Incomplete share link</h2>
          <p className="muted" style={{ fontWeight: 600, maxWidth: 440, margin: "0 auto 16px" }}>
            Shared knight links look like: <code className="mono">/knight?by=username&id=knightId</code>
          </p>
          <Link className="btn btn-primary" to="/">Go to MeMyMate</Link>
        </div>
      )}

      {state === "missing" && (
        <div className="empty-state">
          <div className="big" style={{ fontSize: "2.6rem" }}>🫥</div>
          <h2>Knight not found</h2>
          <p className="muted" style={{ fontWeight: 600 }}>
            @{by} doesn't have a knight with this id (maybe it was deleted).
          </p>
          <Link className="btn btn-primary" to="/">Go to MeMyMate</Link>
        </div>
      )}

      {state === "found" && knight && (
        <>
          <div className="share-hero">
            <span className="chip accent"><IcLink size={13} /> Shared Knight</span>
            <h1 className="page-title" style={{ justifyContent: "center", marginTop: 10 }}>
              {knight.title}
            </h1>
            <p className="by">
              forged by <b>@{knight.ownerUsername}</b>
              {user && user.username.toLowerCase() === knight.ownerUsername.toLowerCase() && " (that's you!)"}
            </p>
          </div>

          <div className="panel" style={{ maxWidth: 640, margin: "0 auto" }}>
            <Overview knight={knight} />
            <div className="overlay-actions mt-3">
              <button className="btn btn-accent btn-lg" onClick={() => { sfx.tap(); setPlaying(true); }}>
                <IcPlay size={16} /> Play now
              </button>
              <button
                className="btn btn-soft"
                onClick={async () => {
                  const ok = await copyText(shareLink(knight));
                  toast(ok ? "Link copied." : "Could not copy.");
                }}
              >
                <IcCopy size={15} /> Copy link
              </button>
              {user ? (
                <button
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const copy = await forkKnight(knight);
                      sfx.success();
                      toast(copy ? "Saved to your castle." : "Could not save.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? "Saving…" : "Save to my Knights"}
                </button>
              ) : (
                <Link className="btn btn-primary" to="/auth"><IcSparkles size={15} /> Sign up to save it</Link>
              )}
            </div>
            <p className="hint center mt-2" style={{ marginBottom: 0 }}>
              No account needed to play — say each card out loud, then tap before time runs out!
            </p>
          </div>
        </>
      )}
    </main>
  );
}

/** Read-only overview: topics, cards and times. */
export function Overview({ knight }: { knight: Knight }) {
  const ks = knightStats(knight);
  return (
    <>
      <div className="knight-meta" style={{ justifyContent: "center" }}>
        <span className="chip"><IcShield size={13} /> {ks.topics} topics</span>
        <span className="chip"><IcCards size={13} /> {ks.cards} cards</span>
        <span className="chip"><IcRepeat size={13} /> {ks.plays} plays</span>
        <span className="chip"><IcClock size={13} /> ~{formatDuration(ks.seconds)}</span>
      </div>
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
      <div className="card" style={{ background: "var(--surface2)" }}>
        <span className="label">Peek at the first card</span>
        <p style={{ fontWeight: 700, margin: "6px 0 0" }}>
          {knight.topics[0]?.cards[0]?.text ?? "—"}
        </p>
      </div>
    </>
  );
}


