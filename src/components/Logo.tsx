/**
 * ARCT logo usage.
 * The official asset (public/arct-logo.png) is the teal→violet "ARCT"
 * wordmark on black. On dark surfaces we blend the black away with
 * `mix-blend-mode: screen`; in light UI we seat it on a dark tile so it
 * always reads as an intentional app-icon.
 */

/** Square app-icon tile (nav, auth, empty states). */
export function LogoTile({ size = 40, radius }: { size?: number; radius?: number }) {
  return (
    <span
      className="logo-tile"
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.28),
        position: "relative",
      }}
    >
      <img
        src="/arct-logo.png"
        alt="ARCT"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 3.05,
          maxWidth: "none",
          transform: "translate(-50%, -50%)",
        }}
      />
    </span>
  );
}

/** Full wordmark for dark hero surfaces (splash, auth hero). */
export function LogoWord({ width = 240, className, style }: { width?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src="/arct-logo.png"
      alt="ARCT"
      className={className}
      style={{ width, maxWidth: "100%", mixBlendMode: "screen", ...style }}
    />
  );
}
