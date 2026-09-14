import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import NavBar from "./components/NavBar";
import QuickTour from "./components/QuickTour";
import Splash from "./components/Splash";
import Toasts from "./components/Toasts";
import { useApp } from "./context/AppContext";
import AuthPage from "./pages/AuthPage";
import CreatePage from "./pages/CreatePage";
import DashboardPage from "./pages/DashboardPage";
import GuidePage from "./pages/GuidePage";
import PlayPage from "./pages/PlayPage";
import SettingsPage from "./pages/SettingsPage";
import SharedKnightPage from "./pages/SharedKnightPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <main className="page">
      <div className="empty-state">
        <div className="big grad-text" style={{ fontFamily: "var(--font-display)", fontSize: "4.2rem", fontWeight: 800, lineHeight: 1 }}>404</div>
        <h2>404 — a dragon ate this page</h2>
        <p className="muted" style={{ fontWeight: 600 }}>Let's get you back to the castle.</p>
        <a className="btn btn-primary btn-lg" href="/">Back to dashboard</a>
      </div>
    </main>
  );
}

function Shell() {
  const { ready, user, firebaseDown } = useApp();

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <NavBar />
      {firebaseDown && (
        <div className="offline-banner">
          Firebase unreachable — running in local demo mode so nothing breaks.
        </div>
      )}
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/knight" element={<SharedKnightPage />} />
        <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/auth" replace />} />
        <Route path="/create" element={user ? <CreatePage /> : <Navigate to="/auth" replace />} />
        <Route path="/play/:id" element={user ? <PlayPage /> : <Navigate to="/auth" replace />} />
        <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <QuickTour />}
      <footer className="footer-note">
        MeMyMate — memorize like a Knight · an ARCT project
      </footer>
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <BrowserRouter>
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      <div style={{ display: splashDone ? "contents" : "none" }}>
        <Shell />
      </div>
      <Toasts />
    </BrowserRouter>
  );
}
