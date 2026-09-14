/**
 * MeMyMate backend abstraction.
 *
 * When a Firebase config is present we use Firebase Anonymous Auth +
 * Firestore. If Firebase is unreachable (offline, blocked network, project
 * not provisioned yet) we degrade gracefully to local demo mode so the app
 * NEVER breaks — the UI shows a small banner explaining the fallback.
 */
import { firebaseConfig, isFirebaseConfigured } from "../firebaseConfig";
import { hashPassword, randomSalt, verifyPassword } from "./hash";
import type { Knight, User, UserSettings } from "./types";
import { defaultSettings } from "./types";

export const backendMode: "firebase" | "local" = isFirebaseConfigured
  ? "firebase"
  : "local";

/* ---------------- graceful degradation ---------------- */

export const backendState = {
  firebaseDown: false,
  downReason: "",
};

const downListeners = new Set<(down: boolean, reason: string) => void>();
export function onFirebaseDown(fn: (down: boolean, reason: string) => void) {
  downListeners.add(fn);
  return () => {
    downListeners.delete(fn);
  };
}
export function reportFirebaseIssue(reason: string) {
  if (!backendState.firebaseDown) {
    backendState.firebaseDown = true;
    backendState.downReason = reason;
    downListeners.forEach((f) => f(true, reason));
  }
}

const NETWORKISH = [
  "auth/network-request-failed",
  "auth/operation-not-allowed",
  "auth/configuration-not-found",
  "auth/invalid-api-key",
  "auth/api-key-not-valid",
  "auth/internal-error",
  "unavailable",
  "deadline-exceeded",
  "failed-precondition",
];

function networkish(e: any): boolean {
  const code = e?.code ?? "";
  if (NETWORKISH.some((c) => String(code).includes(c))) return true;
  const msg = String(e?.message ?? "");
  return /Failed to fetch|NetworkError|Load failed|offline|network/i.test(msg);
}

/** Run the Firebase path; on network/config failure fall back to local. */
async function fb<T>(firebaseFn: () => Promise<T>, localFn: () => T | Promise<T>): Promise<T> {
  if (backendMode !== "firebase" || backendState.firebaseDown) return localFn();
  try {
    return await firebaseFn();
  } catch (e: any) {
    if (networkish(e)) {
      reportFirebaseIssue(e?.code || e?.message || "network");
      return localFn();
    }
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Local engine — everything lives in localStorage                     */
/* ------------------------------------------------------------------ */

interface StoredAccount {
  username: string;
  name: string;
  salt: string;
  passHash: string;
  settings: UserSettings;
  createdAt: number;
}

const DB_KEY = "mmm_local_db_v1";
const SESSION_KEY = "mmm_session_v1";

interface LocalDB {
  accounts: Record<string, StoredAccount>;
  knights: Record<string, Knight>;
}

function readDB(): LocalDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as LocalDB;
  } catch {
    /* corrupted → start fresh */
  }
  return { accounts: {}, knights: {} };
}

function writeDB(db: LocalDB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const toUser = (a: StoredAccount): User => ({
  username: a.username,
  name: a.name,
  settings: a.settings ?? defaultSettings(),
  createdAt: a.createdAt,
});

/* ------------------------------------------------------------------ */
/* Firebase engine                                                     */
/* ------------------------------------------------------------------ */

let fbReady: Promise<{
  db: import("firebase/firestore").Firestore;
}> | null = null;

function getFirebase() {
  if (!fbReady) {
    fbReady = (async () => {
      const { initializeApp } = await import("firebase/app");
      const { getAuth, signInAnonymously } = await import("firebase/auth");
      const { getFirestore } = await import("firebase/firestore");
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      return { db };
    })();
  }
  return fbReady;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export class AuthError extends Error {}

export const backend = {
  mode: backendMode,

  readSession(): string | null {
    return localStorage.getItem(SESSION_KEY);
  },
  writeSession(username: string | null) {
    if (username) localStorage.setItem(SESSION_KEY, username);
    else localStorage.removeItem(SESSION_KEY);
  },

  async signUp(name: string, username: string, password: string): Promise<User> {
    const uname = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname))
      throw new AuthError("Username must be 3–20 characters: letters, numbers and _ only.");
    if (password.length < 4)
      throw new AuthError("Password must be at least 4 characters.");
    if (!name.trim()) throw new AuthError("Please tell us your name.");

    const salt = randomSalt();
    const passHash = await hashPassword(password, salt);

    const local = (): User => {
      const db = readDB();
      const key = uname.toLowerCase();
      if (db.accounts[key]) throw new AuthError(`Username “${uname}” is already taken.`);
      const account: StoredAccount = {
        username: uname,
        name: name.trim(),
        salt,
        passHash,
        settings: defaultSettings(),
        createdAt: Date.now(),
      };
      db.accounts[key] = account;
      writeDB(db);
      return toUser(account);
    };

    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const ref = doc(db, "users", uname.toLowerCase());
      const snap = await getDoc(ref);
      if (snap.exists()) throw new AuthError(`Username “${uname}” is already taken.`);
      const data: StoredAccount = {
        username: uname,
        name: name.trim(),
        salt,
        passHash,
        settings: defaultSettings(),
        createdAt: Date.now(),
      };
      await setDoc(ref, data);
      return toUser(data);
    }, local);
  },

  async login(username: string, password: string): Promise<User> {
    const uname = username.trim();
    if (!uname) throw new AuthError("Enter your username.");

    const verifyLocal = async (): Promise<User> => {
      const db = readDB();
      const acc = db.accounts[uname.toLowerCase()];
      if (!acc) throw new AuthError("No account with that username. Sign up first.");
      const ok = await verifyPassword(password, acc.salt, acc.passHash);
      if (!ok) throw new AuthError("Wrong password. Try again.");
      return toUser(acc);
    };

    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "users", uname.toLowerCase()));
      if (!snap.exists()) throw new AuthError("No account with that username. Sign up first.");
      const acc = snap.data() as StoredAccount;
      const ok = await verifyPassword(password, acc.salt, acc.passHash);
      if (!ok) throw new AuthError("Wrong password. Try again.");
      return toUser(acc);
    }, verifyLocal);
  },

  async saveSettings(username: string, settings: UserSettings): Promise<void> {
    const local = () => {
      const db = readDB();
      const acc = db.accounts[username.toLowerCase()];
      if (acc) {
        acc.settings = settings;
        writeDB(db);
      }
    };
    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", username.toLowerCase()), { settings });
    }, local);
  },

  async renameUser(username: string, name: string): Promise<void> {
    const local = () => {
      const db = readDB();
      const acc = db.accounts[username.toLowerCase()];
      if (acc) {
        acc.name = name;
        writeDB(db);
      }
    };
    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", username.toLowerCase()), { name });
    }, local);
  },

  /* ----------------------------- knights ----------------------------- */

  knightKey(username: string, id: string) {
    return `${username.toLowerCase()}__${id}`;
  },

  async saveKnight(knight: Knight): Promise<Knight> {
    const k = { ...knight, updatedAt: Date.now() };
    const local = (): Knight => {
      const db = readDB();
      db.knights[this.knightKey(k.ownerUsername, k.id)] = k;
      writeDB(db);
      return k;
    };
    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "knights", this.knightKey(k.ownerUsername, k.id)), {
        ...k,
        ownerUsernameLower: k.ownerUsername.toLowerCase(),
        knightId: k.id,
      });
      return k;
    }, local);
  },

  async listKnights(username: string): Promise<Knight[]> {
    const local = (): Knight[] => {
      const db = readDB();
      const prefix = username.toLowerCase() + "__";
      return Object.entries(db.knights)
        .filter(([key]) => key.startsWith(prefix))
        .map(([, k]) => k)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    };
    return fb(async () => {
      const { db } = await getFirebase();
      const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
      const q = query(
        collection(db, "knights"),
        where("ownerUsernameLower", "==", username.toLowerCase()),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as Knight);
    }, local);
  },

  async getKnight(username: string, id: string): Promise<Knight | null> {
    const local = (): Knight | null => {
      const db = readDB();
      return db.knights[this.knightKey(username, id)] ?? null;
    };
    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "knights", this.knightKey(username, id)));
      return snap.exists() ? (snap.data() as Knight) : null;
    }, local);
  },

  async deleteKnight(username: string, id: string): Promise<void> {
    const local = () => {
      const db = readDB();
      delete db.knights[this.knightKey(username, id)];
      writeDB(db);
    };
    return fb(async () => {
      const { db } = await getFirebase();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "knights", this.knightKey(username, id)));
    }, local);
  },

  /** Copy a shared knight into the current user's collection. */
  async forkKnight(knight: Knight, newOwner: string): Promise<Knight> {
    const copy: Knight = {
      ...(JSON.parse(JSON.stringify(knight)) as Knight),
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : "k" + Date.now().toString(36),
      ownerUsername: newOwner,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return this.saveKnight(copy);
  },
};

/* ------------------------- play stats (local) ------------------------- */

export interface PlayStats {
  playsStarted: number;
  playsCompleted: number;
  cardsSaid: number;
  bestTimeSeconds?: number;
}

const STATS_KEY = "mmm_stats_v1";
const emptyStats = (): PlayStats => ({ playsStarted: 0, playsCompleted: 0, cardsSaid: 0 });

export function readStats(): Record<string, PlayStats> {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStats(all: Record<string, PlayStats>) {
  localStorage.setItem(STATS_KEY, JSON.stringify(all));
}

export function bumpStat(
  knightId: string,
  field: "playsStarted" | "playsCompleted" | "cardsSaid",
  delta = 1
) {
  const all = readStats();
  const cur = all[knightId] ?? emptyStats();
  cur[field] = (cur[field] ?? 0) + delta;
  all[knightId] = cur;
  writeStats(all);
}

export function setBestTime(knightId: string, secs: number) {
  const all = readStats();
  const cur = all[knightId] ?? emptyStats();
  if (cur.bestTimeSeconds === undefined || secs < cur.bestTimeSeconds) {
    cur.bestTimeSeconds = secs;
  }
  all[knightId] = cur;
  writeStats(all);
}
