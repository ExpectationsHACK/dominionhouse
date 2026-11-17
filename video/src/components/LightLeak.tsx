import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../config";
import { expo } from "./layout-context";

/**
 * A warm light leak washing across the frame, centred on `at` (global frame).
 * Used as the wipe between scenes; `strength` 1 is a full flare.
 */
export function LightLeak({
  at,
  length = 18,
  strength = 0.55,
  direction = 1,
}: {
  at: number;
  length?: number;
  strength?: number;
  direction?: 1 | -1;
}) {
  const frame = useCurrentFrame();
  const from = at - length / 2;
  const to = at + length / 2;
  if (frame < from - 1 || frame > to + 1) return null;

  const p = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const envelope = Math.sin(Math.PI * interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const x = direction === 1 ? -30 + p * 160 : 130 - p * 160;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none", opacity: envelope * strength }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 75% at ${x}% 45%, ${COLORS.ember} 0%, rgba(255,128,32,0.55) 30%, rgba(255,128,32,0) 70%)`,
          filter: "blur(30px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${direction === 1 ? 100 : 80}deg, transparent ${x - 25}%, rgba(255,240,215,0.85) ${x}%, transparent ${x + 18}%)`,
          filter: "blur(18px)",
        }}
      />
    </AbsoluteFill>
  );
}

/** A sharp centre flare (the "break it" moment). */
export function Flare({ at, strength = 1 }: { at: number; strength?: number }) {
  const frame = useCurrentFrame();
  if (frame < at - 2 || frame > at + 26) return null;
  const up = interpolate(frame, [at - 2, at + 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const down = interpolate(frame, [at + 2, at + 26], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const o = Math.min(up, down) * strength;
  const scale = interpolate(frame, [at - 2, at + 26], [0.4, 1.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255,250,240,1) 0%, ${COLORS.ember} 10%, rgba(255,128,32,0.45) 30%, transparent 60%)`,
          transform: `scale(${scale})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,236,200,0.9) 50%, transparent 100%)",
          height: 6,
          top: "50%",
          filter: "blur(3px)",
          transform: `scaleX(${scale * 1.2})`,
        }}
      />
    </AbsoluteFill>
  );
}
