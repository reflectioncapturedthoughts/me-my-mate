/**
 * MeMyMate — Firebase configuration (LIVE project)
 * Authentication → Sign-in method → Anonymous must be enabled,
 * plus a Firestore database. Rules: firestore.rules
 *
 * If Firebase is unreachable (offline / blocked network), MeMyMate
 * automatically degrades to local demo mode so the app never breaks.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyB_cvT92fWxH8Vyv-lo_y6fvppjbC43cok",
  authDomain: "me-my-mate.firebaseapp.com",
  projectId: "me-my-mate",
  storageBucket: "me-my-mate.firebasestorage.app",
  messagingSenderId: "648908140614",
  appId: "1:648908140614:web:efb1030791087637e4da47",
  measurementId: "G-W0CYBGRG30",
};

/** True when a real Firebase config has been pasted in. */
export const isFirebaseConfigured =
  firebaseConfig.apiKey.trim().length > 0 &&
  firebaseConfig.appId.trim().length > 0 &&
  firebaseConfig.messagingSenderId.trim().length > 0;
