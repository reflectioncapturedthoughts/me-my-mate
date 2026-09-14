import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sfx } from "../lib/sound";
import { IcAlert, IcLink, IcMic, IcMoon, IcShield, IcSparkles } from "../components/Icons";
import { LogoTile } from "../components/Logo";

export default function AuthPage() {
  const { login, signUp } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (tab === "signup") await signUp(name, username, password);
      else await login(username, password);
      sfx.success();
      navigate("/", { replace: true });
    } catch (err: any) {
      sfx.fail();
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* brand hero */}
      <section className="auth-hero">
        <LogoTile size={62} radius={17} />
        <h1>
          Memorize like a <em>Knight.</em>
        </h1>
        <p>
          MeMyMate turns the sentences and paragraphs you must know into a
          fast, loud, tap-the-screen card game. Revision finally feels like play.
        </p>
        <div className="auth-feats">
          <div><span className="fi"><IcShield /></span> Forge Knights from your notes — topics, cards, timers.</div>
          <div><span className="fi"><IcMic /></span> Say each card out loud before the ring empties. Miss it? Restart.</div>
          <div><span className="fi"><IcLink /></span> Share any Knight with a link — friends play instantly.</div>
          <div><span className="fi"><IcMoon /></span> Eight themes, light & dark. Make it unmistakably yours.</div>
        </div>
      </section>

      {/* form side */}
      <section className="auth-side">
        <div className="auth-card panel">
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "signup"}
              className={`tab ${tab === "signup" ? "active" : ""}`}
              onClick={() => { setTab("signup"); setError(""); sfx.click(); }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, justifyContent: "center" }}>
                <IcSparkles size={15} /> New Knight
              </span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "login"}
              className={`tab ${tab === "login" ? "active" : ""}`}
              onClick={() => { setTab("login"); setError(""); sfx.click(); }}
            >
              I have an account
            </button>
          </div>

          <form onSubmit={submit}>
            {tab === "signup" && (
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                className="input"
                placeholder="e.g. aarav_2077"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                autoComplete="username"
                required
              />
              <span className="hint">3–20 characters — letters, numbers, underscore. This is your share identity.</span>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                required
              />
              <span className="hint">At least 4 characters. No email required — ever.</span>
            </div>

            {error && (
              <div className="issue error" style={{ marginBottom: 14 }}>
                <IcAlert size={16} /> {error}
              </div>
            )}

            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy
                ? "Opening the gates…"
                : tab === "signup"
                  ? "Create my account"
                  : "Enter the castle"}
            </button>
          </form>

          <p className="hint center mt-2" style={{ marginBottom: 0 }}>
            Accounts use Firebase anonymous authentication — we store only your
            name, username and a salted password hash.
          </p>
          <p className="hint center" style={{ marginTop: 12, marginBottom: 0 }}>
            First time here? <Link to="/guide" style={{ fontWeight: 700 }}>Read the quick guide</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
