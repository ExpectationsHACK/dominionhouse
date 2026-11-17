import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, COPY, FONTS } from "../config";
import { KineticText } from "../components/KineticText";
import { expo, per, useLayout } from "../components/layout-context";
import { Stage } from "../components/Stage";

/**
 * 0:16–0:19. A 24-hour dial: the hand sweeps from 6:00 AM to 8:00 PM and the
 * arc between them lights. Then the daily line and the tagline flash (local 58).
 */
export function Rhythm() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const sweep = interpolate(frame, [8, 46], [6, 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const dial = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const morning = interpolate(frame, [8, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const evening = interpolate(frame, [42, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(frame, [58, 61, 70], [0, 1.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const R = 40; // dial radius in the 100×100 viewBox
  const point = (hour: number, r = R) => {
    const a = (hour / 24) * Math.PI * 2 - Math.PI / 2;
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as const;
  };
  const [sx, sy] = point(6);
  const [ex, ey] = point(sweep);
  const large = sweep - 6 > 12 ? 1 : 0;
  const [hx, hy] = point(sweep, R - 6);
  const dialSize = per(layout, 560, 400);
  const label = { fontFamily: FONTS.mono, fontSize: per(layout, 40, 34), letterSpacing: "0.12em", color: COLORS.white } as const;

  const clock = (
    <div style={{ position: "relative", width: dialSize, height: dialSize, opacity: dial, transform: `scale(${0.9 + dial * 0.1})` }}>
      <svg viewBox="0 0 100 100" width={dialSize} height={dialSize} style={{ overflow: "visible" }}>
        <circle cx={50} cy={50} r={R} fill="none" stroke={COLORS.faint} strokeWidth={0.6} />
        {Array.from({ length: 24 }, (_, h) => {
          const [ax, ay] = point(h, R - (h % 6 === 0 ? 4 : 2));
          const [bx, by] = point(h, R);
          return <line key={h} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(255,255,255,0.35)" strokeWidth={h % 6 === 0 ? 0.8 : 0.4} />;
        })}
        <path
          d={`M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`}
          fill="none"
          stroke={COLORS.ember}
          strokeWidth={1.8}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 2px ${COLORS.emberGlow})` }}
        />
        <line x1={50} y1={50} x2={hx} y2={hy} stroke={COLORS.white} strokeWidth={1} strokeLinecap="round" />
        <circle cx={50} cy={50} r={1.6} fill={COLORS.ember} />
        <circle cx={sx} cy={sy} r={1.6} fill={COLORS.ember} opacity={morning} />
        <circle cx={ex} cy={ey} r={1.6} fill={COLORS.ember} opacity={evening} />
      </svg>
      {/* On a 24-hour dial 6:00 AM is at the right; the evening label sits inside the lit arc. */}
      <div style={{ ...label, position: "absolute", right: "11%", top: "50%", transform: "translateY(-150%)", opacity: morning }}>
        {COPY.rhythmTimes[0]}
      </div>
      <div style={{ ...label, position: "absolute", left: "50%", top: "64%", transform: "translateX(-50%)", opacity: evening, color: COLORS.ember }}>
        {COPY.rhythmTimes[1]}
      </div>
    </div>
  );

  const words = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: layout.isWide ? "flex-start" : "center", gap: per(layout, 34, 26) }}>
      <KineticText
        text={COPY.rhythmLine}
        start={22}
        stagger={3}
        duration={12}
        mode="soft"
        font="sans"
        weight={500}
        size={per(layout, 46, 44)}
        color={COLORS.dim}
        align={layout.isWide ? "left" : "center"}
        maxWidth={per(layout, 720, 700)}
      />
      <div
        style={{
          fontFamily: FONTS.display,
          textTransform: "uppercase",
          fontSize: per(layout, 92, 84),
          lineHeight: 1.08,
          color: COLORS.white,
          opacity: Math.min(1, flash),
          textShadow: `0 0 ${24 * flash}px ${COLORS.emberGlow}`,
          transform: `scale(${1 + Math.max(0, flash - 1) * 0.06})`,
          textAlign: layout.isWide ? "left" : "center",
          textWrap: "balance",
          maxWidth: per(layout, 900, 820),
        }}
      >
        {COPY.tagline}
      </div>
    </div>
  );

  return (
    <Stage bottom={per(layout, 0.685, 0.79)} gap={per(layout, 50, 0)}>
      {layout.isWide ? (
        <div style={{ display: "flex", alignItems: "center", gap: 110 }}>
          {clock}
          {words}
        </div>
      ) : (
        <>
          {clock}
          {words}
        </>
      )}
    </Stage>
  );
}
