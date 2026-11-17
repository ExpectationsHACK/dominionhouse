import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, COPY } from "../config";
import { KineticText } from "../components/KineticText";
import { expo, per, useLayout } from "../components/layout-context";
import { Stage } from "../components/Stage";

/** 0:06–0:09. Title card on the hit (local 4 = global 184), logo small above, sub-line. */
export function Reveal() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const logo = interpolate(frame, [12, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  // A small punch as the title lands on the hit.
  const punch = interpolate(frame, [4, 16], [1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });

  return (
    <Stage bottom={per(layout, 0.8, 0.84)} gap={per(layout, 46, 26)}>
      <Img
        src={staticFile("dominion-house-logo.png")}
        style={{
          height: per(layout, 96, 72),
          filter: "brightness(0) invert(1)",
          opacity: logo * 0.9,
          transform: `translateY(${(1 - logo) * 14}px)`,
        }}
      />
      <div style={{ transform: `scale(${punch})` }}>
        <KineticText
          text={COPY.title}
          start={3}
          stagger={4}
          duration={12}
          mode="rise"
          size={per(layout, 168, 150)}
          maxWidth={per(layout, 900, 1600)}
          style={{ textShadow: "0 0 40px rgba(255,128,32,0.25)" }}
        />
      </div>
      <KineticText
        text={COPY.subline}
        start={28}
        stagger={4}
        duration={14}
        mode="soft"
        font="sans"
        weight={500}
        size={per(layout, 56, 50)}
        color={COLORS.dim}
        accent={["Intentional"]}
      />
    </Stage>
  );
}
