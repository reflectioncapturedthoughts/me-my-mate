import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { sfx } from "../lib/sound";
import {
  IcBook, IcGear, IcHome, IcLogout, IcMenu, IcMoon, IcMonitor, IcSparkles, IcSun, IcX,
} from "./Icons";
import { LogoTile } from "./Logo";

/** Glass top navigation — collapses to a burger sheet on small screens. */
export default function NavBar() {
  const { user, logout, updateSettings } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!user) return null;

  const modeIcon =
    user.settings.mode === "dark" ? <IcMoon size={17} /> : user.settings.mode === "light" ? <IcSun size={17} /> : <IcMonitor size={17} />;

  const nextMode = () => {
    sfx.click();
    const m = user.settings.mode;
    updateSettings({ mode: m === "system" ? "light" : m === "light" ? "dark" : "system" });
  };

  const link = (to: string, icon: React.ReactNode, label: string) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
    >
      {icon} {label}
    </NavLink>
  );

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <LogoTile size={36} />
          <span>MeMyMate</span>
        </NavLink>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {link("/", <IcHome />, "Dashboard")}
          {link("/create", <IcSparkles />, "Create")}
          {link("/guide", <IcBook />, "Guide")}
          {link("/settings", <IcGear />, "Settings")}
          {open && (
            <>
              <div className="divider" style={{ margin: "6px 4px" }} />
              <button
                className="btn btn-ghost btn-block"
                style={{ justifyContent: "flex-start", padding: "10px 15px" }}
                onClick={() => {
                  logout();
                  navigate("/auth");
                }}
              >
                <IcLogout size={17} /> Sign out
              </button>
            </>
          )}
        </nav>

        <div className="nav-user">
          <button
            className="btn btn-ghost btn-icon"
            title={`Appearance: ${user.settings.mode} — tap to change`}
            onClick={nextMode}
          >
            {modeIcon}
          </button>
          <span className="avatar" title={user.name}>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="username-label small muted" style={{ fontWeight: 600 }}>
            @{user.username}
          </span>
          <button
            className="btn btn-ghost btn-icon nav-burger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <IcX size={18} /> : <IcMenu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
