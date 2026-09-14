import { Link } from "react-router-dom";
import { KNIGHT_CODE_SAMPLE } from "../lib/knightCode";
import { useApp } from "../context/AppContext";
import {
  IcBot, IcCards, IcCheck, IcClock, IcCode, IcLink, IcMic, IcPalette, IcRepeat, IcShield, IcSparkles, IcTarget, IcZap,
} from "../components/Icons";

export default function GuidePage() {
  const { user } = useApp();

  return (
    <main className="page">
      <span className="overline">Two-minute onboarding</span>
      <h1 className="page-title">The Quick Guide</h1>
      <p className="subtitle">
        Everything about MeMyMate in one scroll. Memorizing for school shouldn't
        feel like punishment — so we made it a game with rules you'll actually enjoy.
      </p>

      <section className="guide-section panel">
        <h2><IcShield /> What is MeMyMate?</h2>
        <p style={{ fontWeight: 500, margin: 0 }}>
          You always have sentences, definitions and paragraphs you <b>must know by
          heart</b> — exams, speeches, formulas. MeMyMate turns them into{" "}
          <b>Knights</b>: decks of play cards you battle through out loud, against
          the clock. Enough battles and the words stay with you for good.
        </p>
      </section>

      <section className="guide-section panel" style={{ marginTop: 16 }}>
        <h2><IcTarget /> How to play</h2>
        <div className="steps">
          <div className="step">
            <span className="n">1</span>
            <div>
              <b>A card appears</b>
              <p>One sentence or paragraph, with a countdown ring — its “time zone”.</p>
            </div>
          </div>
          <div className="step">
            <span className="n">2</span>
            <div>
              <b>Say it out loud</b>
              <p>Recite the card from memory before the ring empties. Actually speak — that's the magic.</p>
            </div>
          </div>
          <div className="step">
            <span className="n">3</span>
            <div>
              <b>Tap</b>
              <p>Hit the big button — or anywhere on screen, or Space — the moment you've said it.</p>
            </div>
          </div>
          <div className="step">
            <span className="n">4</span>
            <div>
              <b>Miss the time? Restart</b>
              <p>The battle begins again from card one. Annoying? A little. Effective? Extremely. Tricky cards can repeat 2×, 3× consecutively until they're locked in.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-section panel" style={{ marginTop: 16 }}>
        <h2><IcSparkles /> Creating a Knight</h2>
        <p style={{ fontWeight: 500 }}>
          A Knight is a title plus one or more <b>topics</b>; each topic holds one
          or more <b>play cards</b>. Two ways in:
        </p>
        <div className="steps">
          <div className="step">
            <span className="n"><IcCards size={16} /></span>
            <div>
              <b>Type it</b>
              <p>
                Add topics and cards in the form. As you type a card, its{" "}
                <b>seconds are set automatically</b> by the golden ratio{" "}
                <b>100 characters : 5 seconds</b> (letters, numbers, punctuation and
                spaces all count). Override any card by hand — or tap “auto” to hand
                it back.
              </p>
            </div>
          </div>
          <div className="step">
            <span className="n"><IcCode size={16} /></span>
            <div>
              <b>Write Knight Code</b>
              <p>
                Our tiny custom language (syntax below). Hand-write it, or press{" "}
                <b>Create with AI</b> and let ChatGPT / Gemini / Claude convert an
                entire chapter for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-section panel" id="knight-code" style={{ marginTop: 16 }}>
        <h2><IcCode /> Knight Code syntax</h2>
        <pre className="code-sample padded">{KNIGHT_CODE_SAMPLE}</pre>
        <div className="steps mt-2">
          <div className="step">
            <span className="n"><IcShield size={16} /></span>
            <div>
              <b>&lt;knightcode&gt; … &lt;/knightcode&gt;</b>
              <p>Wraps the whole knight.</p>
            </div>
          </div>
          <div className="step">
            <span className="n">T</span>
            <div>
              <b>&lt;title&gt;Know the Definitions&lt;/title&gt;</b>
              <p>The name of your knight.</p>
            </div>
          </div>
          <div className="step">
            <span className="n">#</span>
            <div>
              <b>&lt;topic1&gt;Example Topic&lt;/topic1&gt;</b>
              <p>Starts a topic (topic1, topic2, …). Cards below it belong to that topic.</p>
            </div>
          </div>
          <div className="step">
            <span className="n">k</span>
            <div>
              <b>&lt;k1 5&gt;A sentence to memorize&lt;3/k&gt;</b>
              <p>
                One play card. <b>k1, k2, k3…</b> number it (plain <b>&lt;k&gt;</b> works).
                The number after the space (<b>5</b>) is the <b>seconds</b> on screen —
                omit it and time is auto-set from length (100 characters : 5 seconds).
                The number in the closing tag (<b>&lt;3/k&gt;</b>) is how many times the
                card repeats <b>consecutively</b>; plain <b>&lt;/k&gt;</b> or <b>&lt;1/k&gt;</b> means once.
              </p>
            </div>
          </div>
        </div>
        <p className="hint" style={{ margin: "14px 0 0" }}>
          <IcBot size={14} style={{ verticalAlign: "-2px" }} /> Using AI? On the Create
          page press <b>Create with AI</b>, drop your chapter into the prompt, send it
          to any AI, then paste the Knight Code back. Done.
        </p>
      </section>

      <section className="guide-section panel" style={{ marginTop: 16 }}>
        <h2><IcLink /> Sharing with friends</h2>
        <p style={{ fontWeight: 500, margin: 0 }}>
          Every knight gets a share link like{" "}
          <code className="mono small">me-my-mate.web.app/knight?by=yourname&amp;id=…</code>.
          Friends open it, <b>play instantly without an account</b>, and can save a
          copy to their own castle. Find Share on any knight card, on the win
          screen, and on shared-knight pages.
        </p>
      </section>

      <section className="guide-section panel" style={{ marginTop: 16 }}>
        <h2><IcZap /> Pro tips</h2>
        <div className="steps">
          <div className="step"><span className="n"><IcCards size={16} /></span><div><b>Start small</b><p>5–10 cards per topic beats one giant wall of text. Split long paragraphs.</p></div></div>
          <div className="step"><span className="n"><IcRepeat size={16} /></span><div><b>Repeats beat cramming</b><p>Give tricky definitions 2–3 consecutive repeats — that's exactly what they're for.</p></div></div>
          <div className="step"><span className="n"><IcMic size={16} /></span><div><b>Say it OUT loud</b><p>Speaking recruits more of your brain than silent reading. Whispering counts. Thinking doesn't.</p></div></div>
          <div className="step"><span className="n"><IcClock size={16} /></span><div><b>Trust the auto timer</b><p>100 characters : 5 seconds is calibrated for speaking pace, not reading pace.</p></div></div>
          <div className="step"><span className="n"><IcPalette size={16} /></span><div><b>Change the vibe</b><p>Eight themes with light, dark and system modes — see Settings.</p></div></div>
          <div className="step"><span className="n"><IcCheck size={16} /></span><div><b>Finish the battle</b><p>The win screen tracks total time and cards said. Beat your best.</p></div></div>
        </div>
      </section>

      <div className="center mt-3">
        {user ? (
          <Link className="btn btn-primary btn-lg" to="/create"><IcSparkles size={17} /> Forge a Knight now</Link>
        ) : (
          <Link className="btn btn-primary btn-lg" to="/auth"><IcShield size={17} /> Create your account</Link>
        )}
      </div>
    </main>
  );
}
