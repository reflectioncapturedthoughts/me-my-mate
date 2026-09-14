import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { useApp } from "../context/AppContext";
import { readStats } from "../lib/backend";
import { copyText, knightStats, shareLink, timeAgo } from "../lib/knightStats";
import { formatDuration } from "../lib/time";
import type { Knight } from "../lib/types";
import { sfx } from "../lib/sound";
import {
  IcCards, IcClock, IcCopy, IcLayers, IcLink, IcPen, IcPlay, IcPlus, IcShield, IcSparkles, IcTrash, IcTrophy,
} from "../components/Icons";
import { LogoTile } from "../components/Logo";

export default function DashboardPage() {
  const { user, knights, knightsLoading, deleteKnight, toast } = useApp();
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<Knight | null>(null);
  const [toShare, setToShare] = useState<Knight | null>(null);

  const stats = useMemo(() => {
    const s = { knights: knights.length, topics: 0, cards: 0, completed: 0 };
    const all = readStats();
    for (const k of knights) {
      const ks = knightStats(k);
      s.topics += ks.topics;
      s.cards += ks.cards;
      s.completed += all[k.id]?.playsCompleted ?? 0;
    }
    return s;
  }, [knights]);

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <main className="page">
      <div className="hero">
        <div>
          <span className="overline">Round table</span>
          <h1>
            {greeting()}, <span className="grad-text">{firstName}</span>
          </h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Your Knights are waiting. Pick a battle — or forge a new one.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate("/create")}>
          <IcPlus size={17} /> New Knight
        </button>
      </div>

      <div className="stats-row">
        <div className="stat">
          <span className="stat-ico"><IcShield /></span>
          <b>{stats.knights}</b><span>Knights</span>
        </div>
        <div className="stat">
          <span className="stat-ico"><IcLayers /></span>
          <b>{stats.topics}</b><span>Topics</span>
        </div>
        <div className="stat">
          <span className="stat-ico"><IcCards /></span>
          <b>{stats.cards}</b><span>Play cards</span>
        </div>
        <div className="stat">
          <span className="stat-ico"><IcTrophy /></span>
          <b>{stats.completed}</b><span>Battles won</span>
        </div>
      </div>

      {knightsLoading && knights.length === 0 ? (
        <div className="spinner" />
      ) : knights.length === 0 ? (
        <div className="empty-state">
          <div style={{ margin: "0 auto 14px", width: 64 }}><LogoTile size={64} radius={18} /></div>
          <h2>No Knights yet</h2>
          <p className="muted" style={{ margin: "0 auto 20px", fontWeight: 500, maxWidth: "46ch" }}>
            Forge your first Knight from the sentences and paragraphs you have to
            memorize — then battle through them out loud.
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/create")}>
              <IcSparkles size={17} /> Create a Knight
            </button>
            <Link className="btn btn-ghost btn-lg" to="/guide">How it works</Link>
          </div>
        </div>
      ) : (
        <div className="knight-grid">
          {knights.map((k) => {
            const ks = knightStats(k);
            const st = readStats()[k.id];
            return (
              <div className="card knight-card hoverable" key={k.id}>
                <div className="row" style={{ gap: 6 }}>
                  <span className="chip accent"><IcShield size={13} /> Knight</span>
                  {st?.playsCompleted ? (
                    <span className="chip"><IcTrophy size={13} /> won ×{st.playsCompleted}</span>
                  ) : null}
                </div>
                <h3>{k.title || "Untitled Knight"}</h3>
                <div className="knight-meta">
                  <span className="chip"><IcLayers size={13} /> {ks.topics}</span>
                  <span className="chip"><IcCards size={13} /> {ks.cards}</span>
                  <span className="chip"><IcClock size={13} /> {formatDuration(ks.seconds)}</span>
                  <span className="chip">{timeAgo(k.updatedAt)}</span>
                </div>
                <div className="knight-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { sfx.tap(); navigate(`/play/${k.id}`); }}
                  >
                    <IcPlay size={14} /> Play
                  </button>
                  <button className="btn btn-soft btn-sm" onClick={() => { sfx.click(); setToShare(k); }}>
                    <IcLink size={14} /> Share
                  </button>
                  <button className="btn btn-soft btn-sm" onClick={() => navigate(`/create?edit=${k.id}`)}>
                    <IcPen size={14} /> Edit
                  </button>
                  <button className="btn btn-danger btn-icon btn-sm" style={{ width: 34, height: 34 }} aria-label="Delete knight" onClick={() => setToDelete(k)}>
                    <IcTrash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* share modal */}
      <Modal open={!!toShare} onClose={() => setToShare(null)} title={<>Share “{toShare?.title}”</>}>
        {toShare && (
          <>
            <p className="muted small" style={{ fontWeight: 500 }}>
              Anyone with this link can view and play this Knight — no account needed.
            </p>
            <div className="link-box">
              <code>{shareLink(toShare)}</code>
              <button
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  const ok = await copyText(shareLink(toShare));
                  toast(ok ? "Link copied — send it to your friends" : "Could not copy — select the link manually.");
                  if (ok) sfx.success();
                }}
              >
                <IcCopy size={14} /> Copy
              </button>
            </div>
            <p className="hint mt-2">
              Friends can also save a copy of your Knight into their own castle with one tap.
            </p>
          </>
        )}
      </Modal>

      {/* delete confirm */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete this Knight?">
        <p className="muted" style={{ fontWeight: 500 }}>
          “{toDelete?.title}” will be gone forever, and its share link will stop
          working. This cannot be undone.
        </p>
        <div className="overlay-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setToDelete(null)}>Keep it</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (toDelete) {
                await deleteKnight(toDelete.ownerUsername, toDelete.id);
                toast("Knight deleted.");
              }
              setToDelete(null);
            }}
          >
            <IcTrash size={15} /> Delete forever
          </button>
        </div>
      </Modal>
    </main>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
