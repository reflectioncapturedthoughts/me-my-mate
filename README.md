# 🛡️ MeMyMate — Memorize like a Knight

**MeMyMate** is a fun, game-like memorization simulator for students. Instead of
staring at notes, you forge **Knights** — decks of play cards built from the
sentences and paragraphs you *must* know — then battle through them out loud,
against the clock.

Built with **Vite + React + TypeScript**, ready for **Firebase Hosting**
(`me-my-mate.web.app`) with **Firebase Anonymous Authentication + Firestore**.

---

## ✨ Features

| Feature | Where |
| --- | --- |
| 🎬 ARCT splash screen (logo shows for exactly 3 s on entry) | app launch |
| 🔐 Signup / Login with **name + username + password** (no email) | `/auth` |
| 🏰 Dashboard with knights, stats & battles won | `/` |
| ✍️ Create Knights by **typing** (topics → cards, auto seconds while typing) | `/create` |
| 👨‍💻 Create Knights with **Knight Code** (live validation + errors with line numbers) | `/create` |
| 🤖 **AI prompt generator** — convert any chapter into Knight Code with ChatGPT/Gemini/Claude | Create → Code mode |
| 🎮 The game: cards animate in, countdown ring, **say it out loud then TAP**, miss → restart | `/play/:id` |
| 🔁 Per-card **consecutive repetitions** & per-card **seconds** | everywhere |
| 🔗 Share any knight: `…/knight?by=<username>&id=<knightId>` — friends play instantly, no account needed | `/knight` |
| 💾 Save a friend's shared knight into your own castle | `/knight` |
| 🎨 **6 themes × Light / Dark / System** modes, instant apply | `/settings` |
| 🔊 Sound effects (WebAudio, toggleable) | `/settings` |
| 📖 Quick guide + one-time welcome tour after signup | `/guide` |
| 📱 Fully responsive — phones, tablets, desktops | everywhere |

## ⏱️ The golden rule: 100 characters : 5 seconds

When you type a card (or omit the time in Knight Code), the seconds are computed
automatically from the text length — counting letters, punctuation, symbols,
numbers **and spaces**:

```
seconds = ceil(length / 20)      // 100 chars → 5 s, 160 chars → 8 s
minimum = 3 s, maximum = 120 s
```

In the form editor the seconds field updates **live while you type**. Change it
by hand and the card leaves auto mode; press **↺ auto** to hand it back.

## 👨‍💻 Knight Code

```
<knightcode>
<title>Know the Definitions</title>

<topic1>Example Topic 1</topic1>
<k1 5>Example sentence/paragraph 1<3/k>
<k2 2>Example sentence/paragraph 2</k2>
<k3>Auto-timed sentence — 100 characters : 5 seconds<1/k>

<topic2>Example Topic 2</topic2>
<k1 6>Another sentence</k>
</knightcode>
```

- `<kN S>` — the N-th card of the current topic, on screen for **S seconds**.
  `S` omitted → auto (100 chars : 5 s). `<k S>` without a number works too.
- Closing tag carries the **consecutive repetitions**: `</k>` or `<1/k>` → once,
  `<3/k>` → three times in a row. `</k1>`, `<2/k1>` etc. are accepted too.
- `<topicN>Name</topicN>` — starts a topic (`</topic>` also accepted).
- Default repetitions: **1**. Default time: **auto from length**.

The parser is forgiving and reports errors/warnings **with line numbers** as you
type. The form editor can export to Knight Code and vice-versa.

## 🚀 Run it

```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## 🔥 Connecting Firebase (production)

Out of the box the app runs in **local demo mode** (accounts & knights stored in
your browser) so everything works instantly. To go live:

1. Create a Firebase project (id: `me-my-mate`) → add a **Web app**.
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create a **Firestore** database.
4. Paste your config into **`src/firebaseConfig.ts`** (apiKey, appId,
   messagingSenderId…). The app detects it and switches to Firebase mode
   automatically — no other code changes.
5. Apply the rules: `firebase deploy --only firestore:rules`
   (rules are in `firestore.rules`).
6. Build & deploy the site:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
   → live at **https://me-my-mate.web.app** 🎉

Share links then look like:
`https://me-my-mate.web.app/knight?by=aarav_2077&id=<knightId>`

### Data model (Firestore)

- `users/{username}` → `{ name, username, salt, passHash, settings, createdAt }`
  (password stored as salted SHA-256 hash; anonymous auth provides the identity)
- `knights/{username}__{knightId}` → `{ ownerUsername, title, topics[], code?,
  isPublic, createdAt, updatedAt }` — world-readable for sharing.

## 🗂️ Project structure

```
src/
├── firebaseConfig.ts        ← paste your Firebase config here
├── main.tsx / App.tsx       ← bootstrap, routing, splash gate
├── context/AppContext.tsx   ← auth session, knights, settings, toasts, theming
├── lib/
│   ├── backend.ts           ← one API, two engines: Firebase or local demo
│   ├── knightCode.ts        ← Knight Code parser/generator + AI prompt
│   ├── knightStats.ts       ← derived stats, share links, clipboard
│   ├── time.ts              ← 100 chars : 5 s rule
│   ├── sound.ts             ← tiny WebAudio SFX
│   ├── hash.ts              ← salted SHA-256
│   └── types.ts
├── components/              ← GamePlayer, Splash, NavBar, QuickTour, Modal…
├── pages/                   ← Auth, Dashboard, Create, Play, Shared, Settings, Guide
└── styles/                  ← themes.css (6×2 palettes), global.css (design system)
```

## 🎨 Theming

Six themes — **ARCT Classic 🛡️, Midnight 🌌, Forest 🌲, Sunset 🌅, Ocean 🌊,
Candy 🍬** — each with a light and a dark palette (plus a *System* mode that
follows the OS). Everything is CSS custom properties in `src/styles/themes.css`;
add a new theme by copying one block.

---

*An ARCT project. By continuing you agree to be brave. 🦁*
