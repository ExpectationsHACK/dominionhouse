import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COPY } from "../config";
import { KineticText } from "../components/KineticText";
import { per, useLayout } from "../components/layout-context";
import { Stage } from "../components/Stage";

/** 0:19–0:22. Slow push-in, embers fully lit (EmberParticles / ProgressLine). */
export function Decision() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const push = interpolate(frame, [0, 90], [1, 1.06]);

  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <Stage bottom={per(layout, 0.65, 0.775)} gap={per(layout, 56, 30)}>
        <KineticText text={COPY.decision[0]} start={4} stagger={4} duration={10} mode="slam" size={per(layout, 140, 120)} maxWidth={per(layout, 900, 1600)} />
        <KineticText
          text={COPY.decision[1]}
          start={34}
          stagger={4}
          duration={12}
          mode="rise"
          size={per(layout, 112, 100)}
          accent={["INTENTIONAL"]}
          maxWidth={per(layout, 900, 1600)}
        />
      </Stage>
    </AbsoluteFill>
  );
}
