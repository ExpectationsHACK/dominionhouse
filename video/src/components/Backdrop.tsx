import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, START, TOTAL_FRAMES } from "../config";

/** Six grain tiles, cycled every frame (cheap animated film grain). */
const GRAIN = Array.from({ length: 6 }, (_, seed) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed + 3}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${svg.replace(/"/g, "'")}")`;
});

/** Black base, slow warm light rays, vignette and grain. */
export function Backdrop() {
  const frame = useCurrentFrame();
  const rayAngle = interpolate(frame, [0, TOTAL_FRAMES], [-8, 10]);
  // Rays dim during the "complacency" beat and are strongest at the decision.
  const rays = interpolate(
    frame,
    [0, START.tension + 20, START.tension + 50, START.reveal, START.decision, START.cta, TOTAL_FRAMES],
    [0.5, 0.15, 0.1, 0.8, 1, 0.85, 0.8],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <AbsoluteFill
        style={{
          opacity: 0.16 * rays,
          background: `conic-gradient(from ${180 + rayAngle}deg at 50% 118%, transparent 0deg, rgba(255,196,107,0.55) 6deg, transparent 13deg, transparent 22deg, rgba(255,160,70,0.4) 27deg, transparent 33deg, transparent 330deg, rgba(255,196,107,0.45) 336deg, transparent 343deg)`,
          filter: "blur(22px)",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.22 * rays,
          background: "radial-gradient(ellipse 70% 45% at 50% 105%, rgba(255,128,32,0.6), transparent 70%)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 75% at 50% 48%, transparent 45%, rgba(0,0,0,0.78) 100%)" }} />
      <AbsoluteFill style={{ backgroundImage: GRAIN[frame % GRAIN.length], opacity: 0.075, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
}
