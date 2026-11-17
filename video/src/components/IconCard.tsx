import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS, type IconName } from "../config";
import { KineticText } from "./KineticText";
import { expo } from "./layout-context";

/** Simple line icons, drawn on stroke by stroke (each path is pathLength 1). */
const ICONS: Record<IconName, string[]> = {
  // A flame over an open hand: prayer that burns.
  prayer: [
    "M50 14 C60 28 66 36 62 48 C59 57 52 60 50 60 C44 60 38 55 38 47 C38 40 43 36 45 30 C47 36 49 38 52 39 C53 32 52 22 50 14 Z",
    "M18 66 C26 74 38 78 50 78 C62 78 74 74 82 66",
    "M28 86 L72 86",
  ],
  // An open book.
  word: [
    "M50 28 C40 22 28 20 14 22 L14 76 C28 74 40 76 50 82",
    "M50 28 C60 22 72 20 86 22 L86 76 C72 74 60 76 50 82",
    "M50 28 L50 82",
    "M24 36 L40 38 M24 48 L40 50 M60 38 L76 36 M60 50 L76 48",
  ],
  // Ripples spreading from a still centre.
  meditation: [
    "M50 46 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0",
    "M50 46 m-18 0 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0",
    "M50 46 m-32 0 a32 32 0 1 0 64 0 a32 32 0 1 0 -64 0",
    "M14 86 L86 86",
  ],
  // Two linked rings with an upward arrow: walking it out together.
  accountability: [
    "M38 54 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0",
    "M62 54 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0",
    "M50 30 L50 8 M42 16 L50 8 L58 16",
  ],
  // Three points joined: people drawn together.
  community: [
    "M50 22 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0",
    "M22 70 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0",
    "M78 70 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0",
    "M44 30 L28 62 M56 30 L72 62 M32 72 L68 72",
  ],
  // A checklist: habits kept day by day.
  disciplines: [
    "M20 14 L80 14 L80 86 L20 86 Z",
    "M30 32 L36 38 L46 26",
    "M30 52 L36 58 L46 46",
    "M30 72 L36 78 L46 66",
    "M54 32 L70 32 M54 52 L70 52 M54 72 L70 72",
  ],
};

/**
 * One "What to expect" card: number, a line icon that draws itself, and the
 * title. Enters from the right, leaves to the left, within `length` frames.
 */
export function IconCard({
  index,
  title,
  icon,
  length,
  size,
}: {
  index: number;
  title: string;
  icon: IconName;
  length: number;
  size: { icon: number; title: number; width: number };
}) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const leave = interpolate(frame, [length - 7, length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const x = (1 - enter) * 140 - leave * 140;
  const paths = ICONS[icon];

  return (
    <div
      style={{
        width: size.width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: size.title * 0.45,
        opacity: enter * (1 - leave),
        transform: `translateX(${x}px)`,
        filter: `blur(${leave * 6}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: size.title * 0.32,
          letterSpacing: "0.2em",
          color: COLORS.ember,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <svg
        viewBox="0 0 100 100"
        width={size.icon}
        height={size.icon}
        fill="none"
        stroke={COLORS.ember}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible", filter: `drop-shadow(0 0 10px ${COLORS.emberGlow})` }}
      >
        {paths.map((d, i) => {
          const draw = interpolate(frame, [3 + i * 3, 16 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
          return <path key={i} d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />;
        })}
      </svg>
      <KineticText text={title} start={6} stagger={2} duration={10} mode="rise" size={size.title} maxWidth={size.width} />
    </div>
  );
}
