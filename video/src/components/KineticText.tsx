import type { CSSProperties } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../config";
import { expo } from "./layout-context";

type Mode = "slam" | "rise" | "soft";

/**
 * Words revealed one by one through a mask.
 * - slam: each word drops in large and sharpens (headlines).
 * - rise: each word rises out of its own mask (titles).
 * - soft: words fade up through a blur (quiet lines).
 * Words listed in `accent` are drawn in ember with a glow.
 */
export function KineticText({
  text,
  start = 0,
  stagger = 3,
  duration = 12,
  mode = "rise",
  size,
  font = "display",
  weight,
  color = COLORS.white,
  accent = [],
  align = "center",
  exitAt,
  maxWidth,
  style,
}: {
  text: string;
  start?: number;
  stagger?: number;
  duration?: number;
  mode?: Mode;
  size: number;
  font?: keyof typeof FONTS;
  weight?: number;
  color?: string;
  accent?: string[];
  align?: "center" | "left";
  /** Local frame at which the line fades away (optional). */
  exitAt?: number;
  maxWidth?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  // A "\n" in the copy forces a line break.
  const words = text.replace(/\n/g, " \n ").split(" ").filter(Boolean);
  const display = font === "display";
  const exit = exitAt === undefined ? 1 : interpolate(frame, [exitAt, exitAt + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitLift = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 8], [0, -size * 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * (display ? 0.22 : 0.26),
        rowGap: 0,
        fontFamily: FONTS[font],
        fontSize: size,
        fontWeight: weight ?? (display ? 400 : 500),
        lineHeight: display ? 1.08 : 1.25,
        textTransform: display ? "uppercase" : undefined,
        letterSpacing: font === "mono" ? "0.18em" : display ? "0.005em" : "-0.01em",
        color,
        maxWidth,
        opacity: exit,
        transform: `translateY(${exitLift}px)`,
        textAlign: align,
        ...style,
      }}
    >
      {words.map((word, index) => {
        if (word === "\n") return <span key={index} style={{ flexBasis: "100%", height: 0 }} />;
        const t = interpolate(frame, [start + index * stagger, start + index * stagger + duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: expo,
        });
        const isAccent = accent.some((a) => word.replace(/[.,!?]/g, "").toUpperCase() === a.toUpperCase());
        const wordStyle: CSSProperties = isAccent
          ? { color: COLORS.ember, textShadow: `0 0 ${size * 0.35}px ${COLORS.emberGlow}` }
          : {};

        if (mode === "rise") {
          return (
            // Padding gives Anton's tall caps room inside the mask.
            <span key={index} style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.02em", margin: "-0.06em -0.02em" }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - t) * 105}%)`, ...wordStyle }}>{word}</span>
            </span>
          );
        }
        if (mode === "slam") {
          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity: interpolate(t, [0, 0.35], [0, 1], { extrapolateRight: "clamp" }),
                transform: `scale(${1.35 - 0.35 * t})`,
                filter: `blur(${(1 - t) * 10}px)`,
                ...wordStyle,
              }}
            >
              {word}
            </span>
          );
        }
        return (
          <span
            key={index}
            style={{
              display: "inline-block",
              opacity: t,
              transform: `translateY(${(1 - t) * size * 0.35}px)`,
              filter: `blur(${(1 - t) * 6}px)`,
              ...wordStyle,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
