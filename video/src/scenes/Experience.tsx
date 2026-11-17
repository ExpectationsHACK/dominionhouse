import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { CARD_FRAMES, COLORS, COPY, FONTS } from "../config";
import { IconCard } from "../components/IconCard";
import { per, useLayout } from "../components/layout-context";
import { Stage } from "../components/Stage";

/**
 * 0:09–0:16. Six cards, 35 frames each (ticks at global 270, 305, 340, 375,
 * 410, 445). The counter in the corner ticks 01–06; the line steps up per card.
 */
export function Experience() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const current = Math.min(5, Math.floor(frame / CARD_FRAMES));
  const tick = interpolate(frame % CARD_FRAMES, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const size = per(
    layout,
    { icon: 300, title: 104, width: 900 },
    { icon: 230, title: 96, width: 1400 },
  );

  return (
    <AbsoluteFill>
      {/* Corner counter, inside the safe zone. */}
      <div
        style={{
          position: "absolute",
          top: layout.safeTop + 10,
          right: layout.side,
          fontFamily: FONTS.mono,
          fontSize: per(layout, 34, 28),
          letterSpacing: "0.18em",
          color: COLORS.dim,
        }}
      >
        <span style={{ color: COLORS.ember, display: "inline-block", transform: `translateY(${(1 - tick) * -10}px)`, opacity: 0.4 + tick * 0.6 }}>
          {String(current + 1).padStart(2, "0")}
        </span>
        <span> / 06</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: layout.safeTop + 10,
          left: layout.side,
          fontFamily: FONTS.mono,
          fontSize: per(layout, 30, 26),
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: COLORS.dim,
        }}
      >
        {COPY.expectEyebrow}
      </div>

      <Stage bottom={per(layout, 0.69, 0.8)} fadeIn={1}>
        <div style={{ position: "relative", width: size.width, height: "100%" }}>
          {COPY.cards.map((card, index) => (
            <Sequence key={card.title} from={index * CARD_FRAMES} durationInFrames={CARD_FRAMES} layout="none">
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconCard index={index} title={card.title} icon={card.icon} length={CARD_FRAMES} size={size} />
              </div>
            </Sequence>
          ))}
        </div>
      </Stage>
    </AbsoluteFill>
  );
}
