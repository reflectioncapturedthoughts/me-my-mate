import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ThemePicker from "../components/ThemePicker";
import { useApp } from "../context/AppContext";
import { sfx } from "../lib/sound";
import {
  IcAlert, IcCloud, IcLogout, IcPalette, IcTrash, IcUser, IcVolume, IcVolumeX,
} from "../components/Icons";

export default function SettingsPage() {
  const { user, updateSettings, renameUser, logout, knights, deleteKnight, toast, backendMode, firebaseDown } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);

  if (!user) return null;

  return (
    <main className="page">
      <span className="overline">Preferences</span>
      <h1 className="page-title">Settings</h1>
      <p className="subtitle">Tune MeMyMate until it feels like yours.</p>

      <div className="settings-grid">
        <div style={{ display: "grid", gap: 18 }}>
          {/* profile */}
          <section className="panel">
            <div className="section-head">
              <span className="sh-ico"><IcUser /></span>
              <h2>Profile</h2>
            </div>
            <div className="row" style={{ marginBottom: 16 }}>
              <span className="avatar" style={{ width: 52, height: 52, fontSize: "1.4rem" }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <b style={{ fontSize: 1.04rem }}>{user.name}</b>
                <div className="small muted">
                  @{user.username} · joined {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="field">
              <label htmlFor="sname">Display name</label>
              <div className="row">
                <input
                  id="sname"
                  className="input"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  disabled={!name.trim() || name.trim() === user.name}
                  onClick={async () => {
                    await renameUser(name);
                    sfx.success();
                    toast("Name updated");
                  }}
                >
                  Save
                </button>
              </div>
              <span className="hint">Your username (@{user.username}) is your share identity and can't change.</span>
            </div>
          </section>

          {/* sound + data */}
          <section className="panel">
            <div className="section-head">
              <span className="sh-ico">{user.settings.sound ? <IcVolume /> : <IcVolumeX />}</span>
              <h2>Sound & data</h2>
            </div>
            <div className="switch-row">
              <div>
                <b>Sound effects</b>
                <div className="small muted">Taps, ticks and fanfares during battle.</div>
              </div>
              <button
                className={`switch ${user.settings.sound ? "on" : ""}`}
                role="switch"
                aria-checked={user.settings.sound}
                aria-label="Sound effects"
                onClick={() => {
                  updateSettings({ sound: !user.settings.sound });
                  if (!user.settings.sound) setTimeout(() => sfx.tap(), 60);
                }}
              />
            </div>
            <div className="switch-row">
              <div>
                <b>Backend</b>
                <div className="small muted">
                  {firebaseDown
                    ? "Firebase unreachable right now — running in local demo mode so nothing breaks. Your data stays in this browser."
                    : backendMode === "firebase"
                      ? "Firebase — anonymous auth + Firestore. Knights sync to the cloud and share links work everywhere."
                      : "Local demo mode — knights live in this browser. Add your Firebase config in src/firebaseConfig.ts to go live."}
                </div>
              </div>
              <span className="chip">{firebaseDown ? "Local (offline)" : backendMode === "firebase" ? "Firebase" : "Local"}</span>
            </div>
            <div className="switch-row">
              <div>
                <b style={{ color: "var(--danger)" }}>Delete all my knights</b>
                <div className="small muted">Removes every knight from your castle. Cannot be undone.</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmWipe(true)} disabled={knights.length === 0}>
                <IcTrash size={14} /> Wipe
              </button>
            </div>
          </section>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {/* appearance */}
          <section className="panel">
            <div className="section-head">
              <span className="sh-ico"><IcPalette /></span>
              <h2>Appearance</h2>
            </div>
            <ThemePicker />
            <p className="hint mt-2" style={{ marginBottom: 0 }}>
              Themes apply instantly — everywhere, including mid-battle.
            </p>
          </section>

          {/* account */}
          <section className="panel">
            <div className="section-head">
              <span className="sh-ico"><IcCloud /></span>
              <h2>Account</h2>
            </div>
            <button
              className="btn btn-ghost btn-block"
              onClick={() => {
                logout();
                navigate("/auth");
              }}
            >
              <IcLogout size={16} /> Sign out of MeMyMate
            </button>
          </section>
        </div>
      </div>

      <Modal open={confirmWipe} onClose={() => setConfirmWipe(false)} title="Delete ALL knights?">
        <div className="row" style={{ marginBottom: 10 }}>
          <IcAlert size={22} style={{ color: "var(--danger)" }} />
          <p className="muted" style={{ fontWeight: 500, margin: 0 }}>
            All {knights.length} of your knights will be permanently deleted and
            their share links will stop working.
          </p>
        </div>
        <div className="overlay-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setConfirmWipe(false)}>Cancel</button>
          <button
            className="btn btn-danger"
            disabled={wiping}
            onClick={async () => {
              setWiping(true);
              try {
                for (const k of [...knights]) await deleteKnight(k.ownerUsername, k.id);
                toast("All knights deleted.");
                setConfirmWipe(false);
              } finally {
                setWiping(false);
              }
            }}
          >
            {wiping ? "Deleting…" : "Yes, wipe them"}
          </button>
        </div>
      </Modal>
    </main>
  );
}
