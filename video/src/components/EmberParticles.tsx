import { useMemo } from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, START, TOTAL_FRAMES } from "../config";
import { useLayout } from "./layout-context";

/** How lively the embers are over the film: [frame, speed, brightness]. */
const PROFILE: [number, number, number][] = [
  [0, 0.7, 0.25],
  [START.tension, 0.6, 0.25],
  [START.tension + 25, 0.08, 0.12], // complacency: drifting, then stalling
  [START.tension + 49, 0.05, 0.1],
  [START.tension + 52, 1.8, 0.75], // the flare breaks it
  [START.reveal, 1.1, 0.6],
  [START.experience, 1, 0.55],
  [START.rhythm, 0.9, 0.55],
  [START.decision, 1.3, 0.9], // fully lit
  [START.cta, 1, 0.8],
  [TOTAL_FRAMES, 0.8, 0.7],
];

const at = (frame: number, column: 1 | 2) =>
  interpolate(
    frame,
    PROFILE.map((p) => p[0]),
    PROFILE.map((p) => p[column]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

/**
 * Embers rising from the bottom, like the site's Fresh Fire embers. Their
 * clock is the running sum of the speed profile, so slowing them down makes
 * them stall in place rather than jump.
 */
export function EmberParticles({ count }: { count?: number }) {
  const frame = useCurrentFrame();
  const { width, height, isWide } = useLayout();
  const n = count ?? (isWide ? 70 : 60);

  const clock = useMemo(() => {
    const out = new Float32Array(TOTAL_FRAMES + 1);
    for (let f = 1; f <= TOTAL_FRAMES; f++) out[f] = out[f - 1] + at(f, 1);
    return out;
  }, []);

  const t = clock[Math.min(frame, TOTAL_FRAMES)];
  const brightness = at(frame, 2);
  const travel = height + 120;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {Array.from({ length: n }, (_, i) => {
        const speed = 2.2 + random(`s${i}`) * 4.2;
        const size = 2 + random(`z${i}`) * 4.5;
        const x0 = random(`x${i}`) * width;
        const phase = random(`p${i}`) * travel;
        const y = height + 40 - ((t * speed + phase) % travel);
        const life = 1 - (height + 40 - y) / travel; // 1 at the bottom, 0 at the top
        const sway = Math.sin(t / (22 + random(`w${i}`) * 30) + i) * (14 + random(`d${i}`) * 30);
        const flicker = 0.65 + 0.35 * Math.sin(frame / (3 + random(`f${i}`) * 5) + i * 1.7);
        const opacity = brightness * flicker * Math.min(1, life * 1.6) * (0.35 + random(`o${i}`) * 0.65);
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x0 + sway,
              top: y,
              width: size,
              height: size,
              borderRadius: 999,
              background: COLORS.ember,
              boxShadow: `0 0 ${size * 2.5}px ${size * 0.8}px ${COLORS.emberGlow}`,
              opacity,
              transform: `scale(${0.5 + life * 0.6})`,
            }}
          />
        );
      })}
    </div>
  );
}
