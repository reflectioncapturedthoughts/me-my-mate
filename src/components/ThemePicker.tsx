import { THEMES, useApp } from "../context/AppContext";
import { sfx } from "../lib/sound";
import { IcCheck, IcMonitor, IcMoon, IcSun } from "./Icons";

/** Theme + appearance pickers (Settings & Quick Tour). */
export default function ThemePicker({ compact }: { compact?: boolean }) {
  const { user, updateSettings } = useApp();
  if (!user) return null;
  const { theme, mode } = user.settings;

  return (
    <div>
      {!compact && <div className="label" style={{ marginBottom: 9 }}>Colour theme</div>}
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`theme-option ${theme === t.id ? "selected" : ""}`}
            onClick={() => {
              sfx.click();
              updateSettings({ theme: t.id });
            }}
            aria-pressed={theme === t.id}
          >
            <span className="swatches">
              {t.colors.map((c, i) => <i key={i} style={{ background: c }} />)}
            </span>
            <b>
              {t.name}
              {theme === t.id && <IcCheck size={14} />}
            </b>
          </button>
        ))}
      </div>

      <div className="label" style={{ margin: "18px 0 9px" }}>Appearance</div>
      <div className="mode-toggle">
        {(["light", "dark", "system"] as const).map((m) => (
          <button
            key={m}
            className={mode === m ? "active" : ""}
            onClick={() => {
              sfx.click();
              updateSettings({ mode: m });
            }}
          >
            {m === "light" ? <IcSun size={15} /> : m === "dark" ? <IcMoon size={15} /> : <IcMonitor size={15} />}
            {m[0].toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
