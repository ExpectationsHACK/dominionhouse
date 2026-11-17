import { interpolate, useCurrentFrame } from "remotion";
import { COPY } from "../config";
import { KineticText } from "../components/KineticText";
import { per, useLayout } from "../components/layout-context";
import { Stage } from "../components/Stage";

/** 0:00–0:03. A faint ember pulses (ProgressLine); the hook slams in line by line. */
export function Hook() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const size = per(layout, 150, 132);
  // The first line steps back when the second lands.
  const recede = interpolate(frame, [42, 54], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Stage bottom={per(layout, 0.66, 0.78)} gap={per(layout, 60, 34)} fadeIn={1}>
      <div style={{ opacity: recede }}>
        <KineticText text={COPY.hook[0]} start={10} stagger={5} duration={9} mode="slam" size={size} />
      </div>
      <KineticText text={COPY.hook[1]} start={42} stagger={4} duration={9} mode="slam" size={size} accent={["ENOUGH"]} />
    </Stage>
  );
}
