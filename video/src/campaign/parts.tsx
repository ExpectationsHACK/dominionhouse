import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../config";
import { expo, per, useLayout } from "../components/layout-context";
import { C, CAMPAIGN } from "./config";

/** 0→1 over [from, to] with the site's expo ease. */
export function useIn(from: number, to: number) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
}

/** A springy pop (0→1, overshooting a touch) starting at `from`. */
export function usePop(from: number, damping = 11) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping, stiffness: 170, mass: 0.7 } });
}

/**
 * A scene's coloured ground, opening over the previous scene as a circle
 * growing from `origin` (percent) during the first frames.
 */
export function Ground({
  color,
  origin = [50, 50],
  wipe = true,
  children,
}: {
  color: string;
  origin?: [number, number];
  wipe?: boolean;
  children: ReactNode;
}) {
  const r = useIn(0, 16);
  return (
    <AbsoluteFill style={{ background: color, clipPath: wipe ? `circle(${r * 150}% at ${origin[0]}% ${origin[1]}%)` : undefined, overflow: "hidden" }}>
      {children}
    </AbsoluteFill>
  );
}

/** Thick, soft squiggle in a lighter tone of the ground (the posters' brush marks). */
export function Squiggle({ color, d, width = 90, style, drawFrom = 4 }: { color: string; d: string; width?: number; style?: CSSProperties; drawFrom?: number }) {
  const draw = useIn(drawFrom, drawFrom + 26);
  const { width: W, height: H } = useLayout();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, ...style }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    </svg>
  );
}

/** Starburst (the posters' chunky asterisk). */
export function Burst({ size, color, x, y, spin = 0.4, popAt = 6, points = 10, style }: { size: number; color: string; x: number; y: number; spin?: number; popAt?: number; points?: number; style?: CSSProperties }) {
  const frame = useCurrentFrame();
  const pop = usePop(popAt, 9);
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 24;
    pts.push(`${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`);
  }
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ position: "absolute", left: x - size / 2, top: y - size / 2, transform: `scale(${pop}) rotate(${frame * spin}deg)`, ...style }}
    >
      <polygon points={pts.join(" ")} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={6} />
    </svg>
  );
}

/** Four-point sparkle (poster 1's lime star). */
export function Sparkle({ size, color, x, y, popAt = 8, tilt = -12 }: { size: number; color: string; x: number; y: number; popAt?: number; tilt?: number }) {
  const frame = useCurrentFrame();
  const pop = usePop(popAt, 8);
  const bob = Math.sin(frame / 14) * 8;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", left: x - size / 2, top: y - size / 2 + bob, transform: `scale(${pop}) rotate(${tilt + Math.sin(frame / 20) * 6}deg)` }}>
      <path d="M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2 Z" fill={color} />
    </svg>
  );
}

/** "DOMINION HOUSE" + the mark, white, as on every poster. */
export function Lockup({ top, scale = 1, popAt = 4 }: { top: number; scale?: number; popAt?: number }) {
  const t = useIn(popAt, popAt + 14);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        display: "flex",
        alignItems: "center",
        gap: 14 * scale,
        opacity: t,
        transform: `translate(-50%, ${(1 - t) * -20}px)`,
      }}
    >
      <div style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: 30 * scale, lineHeight: 1.02, color: C.white, textAlign: "right", letterSpacing: "0.02em" }}>
        DOMINION
        <br />
        HOUSE
      </div>
      <Img src={staticFile("dominion-house-logo.png")} style={{ height: 78 * scale, filter: "brightness(0) invert(1)" }} />
    </div>
  );
}

/** The posters' bottom bar: "Sign up for the  ONE-WEEK SPIRITUAL GROWTH BOOTCAMP". */
export function SignUpBar({ labelColor, t, width }: { labelColor: string; t: number; width: number }) {
  const layout = useLayout();
  const s = per(layout, 1, 0.82);
  return (
    <div
      style={{
        width,
        background: C.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 30 * s,
        padding: `${30 * s}px ${56 * s}px`,
        opacity: t,
        transform: `translateY(${(1 - t) * 60}px)`,
      }}
    >
      <span style={{ fontFamily: FONTS.sans, fontWeight: 500, fontSize: 40 * s, letterSpacing: "-0.02em", color: labelColor, whiteSpace: "nowrap" }}>
        {CAMPAIGN.signUp}
      </span>
      <TitleStack scale={0.62 * s} />
    </div>
  );
}

/** ONE-WEEK / SPIRITUAL GROWTH / BOOTCAMP, the campaign's title block. */
export function TitleStack({ scale = 1, reveal = 1, bigReveal = 1 }: { scale?: number; reveal?: number; bigReveal?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1 }}>
      <span
        style={{
          fontFamily: FONTS.sans,
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 26 * scale,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
          color: C.white,
          background: scale > 0.9 ? C.navy : "transparent",
          padding: scale > 0.9 ? `${6 * scale}px ${16 * scale}px` : 0,
          marginBottom: 8 * scale,
          opacity: reveal,
        }}
      >
        {"One-week"}
      </span>
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: 92 * scale,
          lineHeight: 0.98,
          textTransform: "uppercase",
          color: C.white,
          letterSpacing: "0.005em",
          whiteSpace: "nowrap",
          opacity: reveal,
          transform: `translateY(${(1 - reveal) * 30}px)`,
        }}
      >
        Spiritual Growth
      </span>
      <span
        style={{
          fontFamily: FONTS.display,
          fontSize: 148 * scale,
          lineHeight: 0.98,
          textTransform: "uppercase",
          color: C.cream,
          letterSpacing: "0.005em",
          opacity: Math.min(1, bigReveal * 1.5),
          transform: `scale(${0.6 + 0.4 * bigReveal})`,
        }}
      >
        Bootcamp
      </span>
    </div>
  );
}

/** A tilted pill badge (poster 1). */
export function Pill({ text, color, tilt, pop, size }: { text: string; color: string; tilt: number; pop: number; size: number }) {
  return (
    <div
      style={{
        background: color,
        color: C.white,
        fontFamily: FONTS.sans,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        textAlign: "center",
        padding: `${size * 0.5}px ${size * 0.9}px`,
        borderRadius: 999,
        transform: `rotate(${tilt}deg) scale(${pop})`,
        maxWidth: size * 13,
        boxShadow: "0 10px 30px rgba(2,10,28,0.18)",
      }}
    >
      {text}
    </div>
  );
}
