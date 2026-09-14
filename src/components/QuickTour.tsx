import { useState } from "react";
import type { ReactNode } from "react";
import { useApp } from "../context/AppContext";
import { sfx } from "../lib/sound";
import Modal from "./Modal";
import ThemePicker from "./ThemePicker";
import { IcArrowLeft, IcCheck, IcLink, IcMic, IcShield, IcSparkles } from "./Icons";

interface Slide {
  icon: ReactNode;
  title: string;
  body: string;
  extra?: "theme";
}

const SLIDES: Slide[] = [
  {
    icon: <IcShield size={30} />,
    title: "Welcome, Knight",
    body: "A Knight is your deck of memorization cards — the sentences and paragraphs you MUST know for class. We turn boring revision into a game you'll actually finish.",
  },
  {
    icon: <IcMic size={30} />,
    title: "Say it. Tap it. Beat the ring.",
    body: "Each card appears with a countdown ring. Say the card out loud from memory, then TAP the button before the ring empties. Miss one and the battle restarts — that's what makes it stick.",
  },
  {
    icon: <IcSparkles size={30} />,
    title: "Create Knights your way",
    body: "Type your notes card by card (time auto-sets: 100 characters = 5 seconds), or write Knight Code — there's even an AI prompt that converts a whole chapter for you.",
  },
  {
    icon: <IcLink size={30} />,
    title: "Make it yours, share it loud",
    body: "Eight themes with light & dark modes, and every Knight gets a share link your friends can play instantly. Pick your look:",
    extra: "theme",
  },
];

/** One-time quick guide shown right after signup. */
export default function QuickTour() {
  const { user, updateSettings } = useApp();
  const [i, setI] = useState(0);

  if (!user || user.settings.guideSeen) return null;

  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const finish = () => {
    sfx.success();
    updateSettings({ guideSeen: true });
  };

  return (
    <Modal open onClose={finish}>
      <div className="tour-card">
        <div className="tour-ico" key={i}>{slide.icon}</div>
        <h2>{slide.title}</h2>
        <p className="muted" style={{ margin: "0 auto", fontWeight: 500, maxWidth: "46ch" }}>
          {slide.body}
        </p>

        {slide.extra === "theme" && (
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <ThemePicker compact />
          </div>
        )}

        <div className="tour-dots">
          {SLIDES.map((_, di) => <i key={di} className={di === i ? "on" : ""} />)}
        </div>

        <div className="row" style={{ justifyContent: "center" }}>
          {i > 0 && (
            <button className="btn btn-ghost" onClick={() => { sfx.click(); setI(i - 1); }}>
              <IcArrowLeft size={16} /> Back
            </button>
          )}
          {!last ? (
            <button className="btn btn-primary" onClick={() => { sfx.tap(); setI(i + 1); }}>
              Next
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={finish}>
              <IcCheck size={17} /> Let's go!
            </button>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ margin: "16px auto 0", display: "block" }}
          onClick={finish}
        >
          Skip tour
        </button>
      </div>
    </Modal>
  );
}
