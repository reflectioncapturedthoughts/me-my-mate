import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import GamePlayer from "../components/GamePlayer";
import { useApp } from "../context/AppContext";
import { shareLink } from "../lib/knightStats";

/** /play/:id — battle one of MY knights. */
export default function PlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { knights, knightsLoading, toast } = useApp();

  const knight = useMemo(() => knights.find((k) => k.id === id) ?? null, [knights, id]);

  if (knightsLoading && !knight) return <main className="page"><div className="spinner" /></main>;

  if (!knight) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="big" style={{ fontSize: "2.6rem" }}>🧭</div>
          <h2>Knight not found</h2>
          <p className="muted" style={{ fontWeight: 600 }}>
            This knight isn't in your castle (maybe it was deleted?).
          </p>
          <Link className="btn btn-primary btn-lg" to="/">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <GamePlayer
      knight={knight}
      onExit={() => navigate("/")}
      onWinShare={() => toast(`Link ready: ${shareLink(knight)}`)}
    />
  );
}
