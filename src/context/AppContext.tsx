import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { backend, AuthError, backendState, onFirebaseDown, reportFirebaseIssue } from "../lib/backend";
import { setSoundEnabled } from "../lib/sound";
import type { Knight, User, UserSettings } from "../lib/types";
import { defaultSettings } from "../lib/types";

/* ----------------------------- toasts ----------------------------- */

interface Toast {
  id: number;
  text: string;
}

/* ----------------------------- context ----------------------------- */

interface AppState {
  ready: boolean;
  user: User | null;
  knights: Knight[];
  knightsLoading: boolean;
  backendMode: "firebase" | "local";
  firebaseDown: boolean;
  toasts: Toast[];
  toast: (text: string) => void;
  signUp: (name: string, username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  renameUser: (name: string) => Promise<void>;
  refreshKnights: () => Promise<void>;
  saveKnight: (k: Knight) => Promise<Knight>;
  getSharedKnight: (username: string, id: string) => Promise<Knight | null>;
  deleteKnight: (username: string, id: string) => Promise<void>;
  forkKnight: (k: Knight) => Promise<Knight | null>;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

/* --------------------------- theme utils --------------------------- */

export const THEMES = [
  { id: "arct", name: "ARCT", colors: ["#2dd4bf", "#818cf8", "#c084fc"] },
  { id: "aurora", name: "Aurora", colors: ["#34d399", "#22d3ee", "#f472b6"] },
  { id: "midnight", name: "Midnight", colors: ["#818cf8", "#a78bfa", "#e879f9"] },
  { id: "ocean", name: "Ocean", colors: ["#22d3ee", "#38bdf8", "#60a5fa"] },
  { id: "forest", name: "Forest", colors: ["#a3e635", "#4ade80", "#34d399"] },
  { id: "sunset", name: "Sunset", colors: ["#fbbf24", "#fb923c", "#fb7185"] },
  { id: "candy", name: "Candy", colors: ["#f472b6", "#c084fc", "#818cf8"] },
  { id: "mono", name: "Mono", colors: ["#71717a", "#e4e4e7", "#60a5fa"] },
] as const;

function resolveMode(mode: UserSettings["mode"]): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: string, mode: UserSettings["mode"]) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-mode", resolveMode(mode));
}

/* ----------------------------- provider ----------------------------- */

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [knights, setKnights] = useState<Knight[]>([]);
  const [knightsLoading, setKnightsLoading] = useState(false);
  const [firebaseDown, setFirebaseDown] = useState(backendState.firebaseDown);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const toast = useCallback((text: string) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  /* watch firebase health */
  useEffect(() => onFirebaseDown((down) => setFirebaseDown(down)), []);

  /* restore session on boot */
  useEffect(() => {
    (async () => {
      const sessionUser = backend.readSession();
      if (sessionUser) {
        try {
          const db = await loadUserRecord(sessionUser);
          if (db) setUser(db);
          else backend.writeSession(null);
        } catch {
          backend.writeSession(null);
        }
      }
      setReady(true);
    })();
    // follow OS theme changes in "system" mode
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => {
      const u = userRef.current;
      if (u) applyTheme(u.settings.theme, u.settings.mode);
      else applyTheme(defaultSettings().theme, "system");
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* apply theme + sound preference whenever user/settings change */
  useEffect(() => {
    if (user) {
      applyTheme(user.settings.theme, user.settings.mode);
      setSoundEnabled(user.settings.sound !== false);
    } else {
      applyTheme(defaultSettings().theme, "system");
      setSoundEnabled(true);
    }
  }, [user]);

  /* load knights whenever a user is present */
  const refreshKnights = useCallback(async () => {
    const u = userRef.current;
    if (!u) {
      setKnights([]);
      return;
    }
    setKnightsLoading(true);
    try {
      setKnights(await backend.listKnights(u.username));
    } catch (e) {
      console.error(e);
      toast("Could not load your knights.");
    } finally {
      setKnightsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) refreshKnights();
    else setKnights([]);
  }, [user, refreshKnights]);

  const signUp = useCallback(
    async (name: string, username: string, password: string) => {
      const u = await backend.signUp(name, username, password);
      backend.writeSession(u.username);
      setUser(u);
      toast(`Welcome to the round table, ${u.name.split(" ")[0]}.`);
    },
    [toast]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const u = await backend.login(username, password);
      backend.writeSession(u.username);
      setUser(u);
      toast(`Welcome back, ${u.name.split(" ")[0]}.`);
    },
    [toast]
  );

  const logout = useCallback(() => {
    backend.writeSession(null);
    setUser(null);
    toast("Signed out. See you soon.");
  }, [toast]);

  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const u = userRef.current;
      if (!u) return;
      const settings = { ...u.settings, ...patch };
      const next = { ...u, settings };
      setUser(next); // optimistic
      try {
        await backend.saveSettings(u.username, settings);
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  const renameUser = useCallback(async (name: string) => {
    const u = userRef.current;
    if (!u || !name.trim()) return;
    setUser({ ...u, name: name.trim() });
    await backend.renameUser(u.username, name.trim());
  }, []);

  const saveKnight = useCallback(
    async (k: Knight) => {
      const saved = await backend.saveKnight(k);
      setKnights((list) => {
        const without = list.filter((x) => x.id !== saved.id);
        return [saved, ...without];
      });
      return saved;
    },
    []
  );

  const getSharedKnight = useCallback(async (username: string, id: string) => {
    try {
      return await backend.getKnight(username, id);
    } catch {
      return null;
    }
  }, []);

  const deleteKnight = useCallback(async (username: string, id: string) => {
    await backend.deleteKnight(username, id);
    setKnights((list) => list.filter((x) => !(x.id === id && x.ownerUsername === username)));
  }, []);

  const forkKnight = useCallback(
    async (k: Knight) => {
      const u = userRef.current;
      if (!u) return null;
      const copy = await backend.forkKnight(k, u.username);
      setKnights((list) => [copy, ...list.filter((x) => x.id !== copy.id)]);
      return copy;
    },
    []
  );

  const value = useMemo<AppState>(
    () => ({
      ready,
      user,
      knights,
      knightsLoading,
      backendMode: backend.mode,
      firebaseDown,
      toasts,
      toast,
      signUp,
      login,
      logout,
      updateSettings,
      renameUser,
      refreshKnights,
      saveKnight,
      getSharedKnight,
      deleteKnight,
      forkKnight,
    }),
    [
      ready, user, knights, knightsLoading, firebaseDown, toasts, toast, signUp, login, logout,
      updateSettings, renameUser, refreshKnights, saveKnight, getSharedKnight,
      deleteKnight, forkKnight,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/** Read a user record without a password (session restore), both modes. */
async function loadUserRecord(username: string): Promise<User | null> {
  if (backend.mode === "local") {
    try {
      const raw = localStorage.getItem("mmm_local_db_v1");
      if (!raw) return null;
      const db = JSON.parse(raw);
      const acc = db.accounts?.[username.toLowerCase()];
      if (!acc) return null;
      return {
        username: acc.username,
        name: acc.name,
        settings: acc.settings ?? defaultSettings(),
        createdAt: acc.createdAt,
      };
    } catch {
      return null;
    }
  }
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const { firebaseConfig } = await import("../firebaseConfig");
    const { initializeApp } = await import("firebase/app");
    const { getFirestore } = await import("firebase/firestore");
    const { getAuth, signInAnonymously } = await import("firebase/auth");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    if (!auth.currentUser) {
      try { await signInAnonymously(auth); } catch { /* continue anyway */ }
    }
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, "users", username.toLowerCase()));
    if (!snap.exists()) return null;
    const d = snap.data() as { username: string; name: string; settings?: UserSettings; createdAt: number };
    return {
      username: d.username,
      name: d.name,
      settings: d.settings ?? defaultSettings(),
      createdAt: d.createdAt,
    };
  } catch (e: any) {
    console.error("session restore failed", e);
    reportFirebaseIssue(e?.code || e?.message || "network");
    return null;
  }
}

export { AuthError };
