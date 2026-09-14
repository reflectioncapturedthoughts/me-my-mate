import { useMemo } from "react";

const COLORS = ["#f5c344", "#e2593b", "#4cc3dd", "#71c475", "#b14aed", "#ff7ab8", "#7c8fe8"];

/** Lightweight CSS confetti burst for win screens. */
export default function Confetti({ pieces = 60 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.1 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        w: 7 + Math.random() * 7,
        h: 10 + Math.random() * 10,
        round: Math.random() > 0.65,
      })),
    [pieces]
  );

  return (
    <div className="confetti-host" aria-hidden>
      {bits.map((b) => (
        <span
          key={b.id}
          className="confetti"
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: b.h,
            background: b.color,
            borderRadius: b.round ? "50%" : 3,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
