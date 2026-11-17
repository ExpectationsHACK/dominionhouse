import { interpolate, useCurrentFrame } from "remotion";
import { CARD_FRAMES, COLORS, START, TOTAL_FRAMES } from "../config";
import { expo, useLayout } from "./layout-context";

/**
 * The growth motif: a thin line rising from the bottom centre with an ember
 * at its tip. It climbs a little in every scene (and a step per card), and at
 * the CTA its ember reaches the logo and becomes the logo's glow.
 *
 * Tip heights are fractions of the canvas height, per layout, chosen so the
 * line always stays below the scene's text.
 */
const STOPS = {
  vertical: { base: 0.92, hook: 0.895, tension: 0.885, reveal: 0.845, cardsFrom: 0.835, cardsTo: 0.72, rhythm: 0.7, decision: 0.675, logo: 0.655 },
  wide: { base: 0.93, hook: 0.915, tension: 0.905, reveal: 0.885, cardsFrom: 0.875, cardsTo: 0.82, rhythm: 0.81, decision: 0.8, logo: 0.79 },
};

export function ProgressLine() {
  const frame = useCurrentFrame();
  const { width, height, isWide } = useLayout();
  const s = STOPS[isWide ? "wide" : "vertical"];

  const cardStops = [0, 1, 2, 3, 4, 5].map((i) => START.experience + i * CARD_FRAMES + 6);
  const frames = [0, 20, START.tension, START.reveal, START.reveal + 20, ...cardStops, START.rhythm + 10, START.decision + 12, START.cta + 4, START.cta + 22, TOTAL_FRAMES];
  const tips = [s.base, s.hook, s.hook, s.tension, s.reveal, ...cardStops.map((_, i) => s.cardsFrom + ((s.cardsTo - s.cardsFrom) * (i + 1)) / 6), s.rhythm, s.decision, s.decision, s.logo, s.logo];
  const tipY = interpolate(frame, frames, tips, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo }) * height;
  const baseY = s.base * height;

  // Brightness: a faint pulse at first, dimmed by complacency, full at the decision.
  const glow = interpolate(
    frame,
    [0, 30, START.tension + 20, START.tension + 49, START.tension + 52, START.reveal, START.decision, START.cta, TOTAL_FRAMES],
    [0.35, 0.55, 0.3, 0.2, 1, 0.75, 1, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pulse = 0.82 + 0.18 * Math.sin(frame / 6);
  // At the CTA the ember blooms into the glow behind the logo, and the line hands over to it.
  const bloom = interpolate(frame, [START.cta + 8, START.cta + 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const lineFade = interpolate(frame, [START.cta + 30, START.cta + 60], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tipSize = (isWide ? 10 : 12) * (1 + bloom * 0.4);
  const x = width / 2;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 1,
          top: tipY,
          width: 2,
          height: Math.max(0, baseY - tipY),
          background: `linear-gradient(to bottom, ${COLORS.ember}, rgba(255,128,32,0.35) 55%, rgba(255,128,32,0))`,
          opacity: (0.35 + glow * 0.5) * lineFade,
          boxShadow: `0 0 12px rgba(255,128,32,${0.4 * glow})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - tipSize / 2,
          top: tipY - tipSize / 2,
          width: tipSize,
          height: tipSize,
          borderRadius: 999,
          background: "#fff6e6",
          opacity: (0.5 + glow * 0.5) * pulse * (1 - bloom * 0.6),
          boxShadow: `0 0 ${18 * glow}px ${7 * glow}px ${COLORS.ember}, 0 0 ${46 * glow}px ${18 * glow}px rgba(255,128,32,0.55)`,
        }}
      />
      {bloom > 0 ? (
        <div
          style={{
            position: "absolute",
            left: x - (isWide ? 190 : 260),
            top: tipY - (isWide ? 190 : 260),
            width: isWide ? 380 : 520,
            height: isWide ? 380 : 520,
            borderRadius: 999,
            background: "radial-gradient(circle, rgba(255,196,107,0.55) 0%, rgba(255,128,32,0.25) 35%, transparent 68%)",
            opacity: bloom * pulse,
            transform: `scale(${0.3 + bloom * 0.7})`,
          }}
        />
      ) : null}
    </>
  );
}

/** Where the line ends at the CTA: the logo sits here. */
export function logoCenterY(isWide: boolean, height: number) {
  return STOPS[isWide ? "wide" : "vertical"].logo * height;
}
