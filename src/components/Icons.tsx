/** Minimal stroke icon set (lucide-style) — one visual language everywhere. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 18, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IcHome = (p: P) => (
  <Svg {...p}><path d="m3 10.2 9-7.2 9 7.2" /><path d="M5.5 8.6V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8.6" /><path d="M9.5 21v-6h5v6" /></Svg>
);
export const IcSparkles = (p: P) => (
  <Svg {...p}><path d="M12 3.5 13.8 9l5.5 1.8-5.5 1.8L12 18.2l-1.8-5.6L4.7 10.8 10.2 9Z" /><path d="M19 3v3" /><path d="M20.5 4.5h-3" /><path d="M5 17.5v3" /><path d="M6.5 19h-3" /></Svg>
);
export const IcBook = (p: P) => (
  <Svg {...p}><path d="M2.5 4.5H8a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2.5Z" /><path d="M21.5 4.5H16a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h6.5Z" /></Svg>
);
export const IcGear = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9" /></Svg>
);
export const IcShare = (p: P) => (
  <Svg {...p}><path d="M4 12.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6.5" /><path d="M16 6.5 12 2.5l-4 4" /><path d="M12 2.5V15" /></Svg>
);
export const IcPlay = (p: P) => (
  <Svg {...p}><path d="M7.5 4.8v14.4L19.5 12Z" /></Svg>
);
export const IcPen = (p: P) => (
  <Svg {...p}><path d="M12.5 20.5H21" /><path d="M16.4 3.6a2.1 2.1 0 0 1 3 3L7.5 18.5l-4 1 1-4Z" /></Svg>
);
export const IcTrash = (p: P) => (
  <Svg {...p}><path d="M3.5 6.5h17" /><path d="M8.5 6.5v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /><path d="M18.5 6.5 17.6 19a2 2 0 0 1-2 1.9H8.4a2 2 0 0 1-2-1.9L5.5 6.5" /><path d="M10 11v6M14 11v6" /></Svg>
);
export const IcCopy = (p: P) => (
  <Svg {...p}><rect x="9" y="9" width="12.5" height="12.5" rx="2.5" /><path d="M5.5 15H4.5a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2v1" /></Svg>
);
export const IcSun = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></Svg>
);
export const IcMoon = (p: P) => (
  <Svg {...p}><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a7 7 0 0 0 9.7 9.7Z" /></Svg>
);
export const IcMonitor = (p: P) => (
  <Svg {...p}><rect x="2.5" y="3.5" width="19" height="13" rx="2" /><path d="M8.5 20.5h7M12 16.5v4" /></Svg>
);
export const IcVolume = (p: P) => (
  <Svg {...p}><path d="M11 5 6.5 9H3v6h3.5L11 19Z" /><path d="M15.5 8.7a4.7 4.7 0 0 1 0 6.6" /><path d="M18.3 5.9a8.6 8.6 0 0 1 0 12.2" /></Svg>
);
export const IcVolumeX = (p: P) => (
  <Svg {...p}><path d="M11 5 6.5 9H3v6h3.5L11 19Z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></Svg>
);
export const IcX = (p: P) => (
  <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
);
export const IcMenu = (p: P) => (
  <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>
);
export const IcArrowLeft = (p: P) => (
  <Svg {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Svg>
);
export const IcTrophy = (p: P) => (
  <Svg {...p}><path d="M8 21h8M12 17v4" /><path d="M7 4h10v6a5 5 0 0 1-10 0Z" /><path d="M7 6H4.5a1.5 1.5 0 0 0 1.6 2.2H7M17 6h2.5a1.5 1.5 0 0 1-1.6 2.2H17" /></Svg>
);
export const IcClock = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" /></Svg>
);
export const IcRepeat = (p: P) => (
  <Svg {...p}><path d="m17 2.5 4 4-4 4" /><path d="M3 11.5v-1a4 4 0 0 1 4-4h14" /><path d="m7 21.5-4-4 4-4" /><path d="M21 12.5v1a4 4 0 0 1-4 4H3" /></Svg>
);
export const IcUser = (p: P) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M5 20.5a7 7 0 0 1 14 0" /></Svg>
);
export const IcLogout = (p: P) => (
  <Svg {...p}><path d="M9 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2H9" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
);
export const IcCode = (p: P) => (
  <Svg {...p}><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></Svg>
);
export const IcBot = (p: P) => (
  <Svg {...p}><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V5" /><circle cx="12" cy="3.8" r="1.2" /><path d="M9 13v2M15 13v2" /><path d="M2 13.5h2M20 13.5h2" /></Svg>
);
export const IcCheck = (p: P) => (
  <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>
);
export const IcAlert = (p: P) => (
  <Svg {...p}><path d="M12 3.5 2.8 19.5h18.4Z" /><path d="M12 9.5v4.5M12 17.2v.3" /></Svg>
);
export const IcPlus = (p: P) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
export const IcShield = (p: P) => (
  <Svg {...p}><path d="M12 2.5 4.5 5.7v5.6c0 4.8 3.2 8.3 7.5 10.2 4.3-1.9 7.5-5.4 7.5-10.2V5.7Z" /></Svg>
);
export const IcZap = (p: P) => (
  <Svg {...p}><path d="M13 2.5 3.5 14H11l-1 7.5L19.5 10H12Z" /></Svg>
);
export const IcLayers = (p: P) => (
  <Svg {...p}><path d="M12 2.8 2.5 8 12 13.2 21.5 8Z" /><path d="m2.5 12.8 9.5 5.2 9.5-5.2" /><path d="m2.5 17.3 9.5 5.2 9.5-5.2" /></Svg>
);
export const IcLink = (p: P) => (
  <Svg {...p}><path d="M10 13.2a4.6 4.6 0 0 0 7 .6l2.8-2.8a4.6 4.6 0 0 0-6.5-6.5l-1.6 1.6" /><path d="M14 10.8a4.6 4.6 0 0 0-7-.6L4.2 13a4.6 4.6 0 0 0 6.5 6.5l1.6-1.6" /></Svg>
);
export const IcRotate = (p: P) => (
  <Svg {...p}><path d="M3 4.5V10h5.5" /><path d="M3.8 13a8.4 8.4 0 1 0 1.6-7L3 10" /></Svg>
);
export const IcMic = (p: P) => (
  <Svg {...p}><rect x="9" y="2.5" width="6" height="11" rx="3" /><path d="M5.5 10.5v1a6.5 6.5 0 0 0 13 0v-1" /><path d="M12 18v3.5" /></Svg>
);
export const IcCards = (p: P) => (
  <Svg {...p}><rect x="3" y="6" width="12" height="15" rx="2.5" /><path d="M8.5 3.5h9A2.5 2.5 0 0 1 20 6v11" /></Svg>
);
export const IcTarget = (p: P) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></Svg>
);
export const IcEye = (p: P) => (
  <Svg {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const IcDoor = (p: P) => (
  <Svg {...p}><path d="M13 3.5h6a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-6" /><path d="M13 3.5 4.5 5.7v12.6L13 20.5Z" /><path d="M10 12.2v.3" /></Svg>
);
export const IcPalette = (p: P) => (
  <Svg {...p}><path d="M12 21.5a9.5 9.5 0 1 1 9.5-9.5c0 2.5-2 3.5-4 3.5h-2a2 2 0 0 0-1.5 3.3c.6.7.2 2.7-2 2.7Z" /><circle cx="7.8" cy="10.2" r="1" /><circle cx="11" cy="7" r="1" /><circle cx="15.2" cy="8.6" r="1" /></Svg>
);
export const IcCloud = (p: P) => (
  <Svg {...p}><path d="M17.5 18.5a4.5 4.5 0 0 0 .4-9A6.5 6.5 0 0 0 5.3 11a3.8 3.8 0 0 0 1.2 7.5Z" /></Svg>
);
