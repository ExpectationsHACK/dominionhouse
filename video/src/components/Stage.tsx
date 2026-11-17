import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useLayout } from "./layout-context";

/**
 * A scene's text area: inside the side margins and safe zones, ending above
 * `bottom` (a fraction of the height) so text never meets the rising line.
 * Fades in over the first frames and out over the last.
 */
export function Stage({
  children,
  top,
  bottom,
  gap = 0,
  fadeIn = 4,
  fadeOut = 6,
  justify = "center",
}: {
  children: ReactNode;
  /** Top edge in px (defaults to the safe zone plus a little). */
  top?: number;
  /** Bottom edge as a fraction of the height. */
  bottom: number;
  gap?: number;
  fadeIn?: number;
  fadeOut?: number;
  justify?: "center" | "flex-start" | "space-between";
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const layout = useLayout();
  const opacity =
    (fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1) *
    (fadeOut > 0
      ? interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1);
  const topPx = top ?? layout.safeTop + (layout.isWide ? 20 : 80);
  const bottomPx = layout.height * (1 - bottom);

  return (
    <AbsoluteFill style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          left: layout.side,
          right: layout.side,
          top: topPx,
          bottom: bottomPx,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: justify,
          gap,
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}
