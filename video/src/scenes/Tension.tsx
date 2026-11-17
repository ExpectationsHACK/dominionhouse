import { AbsoluteFill } from "remotion";
import { COLORS, COPY } from "../config";
import { KineticText } from "../components/KineticText";
import { per, useLayout } from "../components/layout-context";
import { Stage } from "../components/Stage";

/**
 * 0:03–0:06. A quiet line while the embers stall (EmberParticles profile),
 * then the flare at local frame 50 (global 140) and "It's time to break it."
 */
export function Tension() {
  const layout = useLayout();
  return (
    <AbsoluteFill>
      <Stage bottom={per(layout, 0.66, 0.78)}>
        <KineticText
          text={COPY.tension[0]}
          start={6}
          stagger={5}
          duration={16}
          mode="soft"
          font="sans"
          weight={400}
          size={per(layout, 76, 72)}
          color={COLORS.dim}
          exitAt={44}
          maxWidth={per(layout, 820, 1400)}
        />
      </Stage>
      <Stage bottom={per(layout, 0.66, 0.78)} fadeIn={0}>
        <KineticText text={COPY.tension[1]} start={51} stagger={3} duration={8} mode="slam" size={per(layout, 140, 132)} accent={["BREAK"]} />
      </Stage>
    </AbsoluteFill>
  );
}
