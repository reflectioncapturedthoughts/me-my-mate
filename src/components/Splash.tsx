import { useEffect, useState } from "react";
import { LogoWord } from "./Logo";

const SPLASH_MS = 3000; // the ARCT logo shows for exactly 3 seconds

/** Cinematic brand splash shown once per app launch. */
export default function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), SPLASH_MS - 620);
    const t2 = setTimeout(onDone, SPLASH_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={`splash ${leaving ? "leaving" : ""}`} role="status" aria-label="Loading MeMyMate">
      <div className="splash-inner">
        <LogoWord width={250} className="splash-logo" />
        <div className="splash-name">MeMyMate</div>
        <div className="splash-tag">Memorize like a Knight</div>
        <div className="splash-bar"><i /></div>
      </div>
    </div>
  );
}
