import { interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../config";
import { KineticText } from "../../components/KineticText";
import { per, useLayout } from "../../components/layout-context";
import { C, CAMPAIGN } from "../config";
import { Ground, Lockup, Squiggle, useIn } from "../parts";

/**
 * Poster 5. A dot runs round a ring between "Sunday" and "Tuesday" (the
 * cycle), then the ring breaks open and the dot escapes as "break the loop" lands.
 */
export function LoopScene() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H, isWide } = layout;

  const cx = per(layout, W / 2, 1450);
  const cy = per(layout, 1170, 540);
  const r = per(layout, 210, 230);
  const breakAt = 98;
  const gap = interpolate(frame, [breakAt, breakAt + 12], [0, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // The dot laps the ring (Sunday at the top, Tuesday at the bottom) until the break.
  const lapFrames = 40;
  const loopAngle = -90 + (Math.min(frame, breakAt) / lapFrames) * 360;
  const escape = useIn(breakAt, breakAt + 24);
  const rad = (loopAngle * Math.PI) / 180;
  const dotX = cx + Math.cos(rad) * r + escape * per(layout, 260, 320);
  const dotY = cy + Math.sin(rad) * r - escape * per(layout, 520, 420);
  const nearTop = Math.cos(((loopAngle + 90) * Math.PI) / 180);
  const nearBottom = -nearTop;
  const ringIn = useIn(10, 26);
  const sub = useIn(100, 116);
  const chip = (text: string, y: number, glow: number) => (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: y,
        transform: `translate(-50%, -50%) scale(${1 + Math.max(0, glow) * 0.08})`,
        background: glow > 0.75 && frame < breakAt ? C.cream : C.white,
        color: C.navy,
        fontFamily: FONTS.sans,
        fontWeight: 700,
        fontSize: per(layout, 38, 34),
        padding: "10px 26px",
        borderRadius: 999,
        opacity: ringIn,
      }}
    >
      {text}
    </div>
  );

  return (
    <Ground color={C.royal} wipe={false}>
      <Squiggle
        color={C.royalLight}
        width={per(layout, 110, 100)}
        d={isWide ? `M -60 300 C 300 120, 420 760, 760 520 S 1100 160, 1300 420` : `M -80 760 C 260 560, 380 1180, 640 980 S 1000 560, 1180 820`}
        style={{ opacity: 0.55 }}
      />
      <Lockup top={per(layout, 150, 60)} scale={per(layout, 1, 0.85)} />

      <div style={{ position: "absolute", left: layout.side, top: per(layout, 300, 250), width: per(layout, 900, 880) }}>
        <KineticText
          text={CAMPAIGN.loop.headline}
          start={6}
          stagger={2}
          duration={10}
          mode="rise"
          font="sans"
          weight={600}
          size={per(layout, 74, 64)}
          align="left"
          accent={[...CAMPAIGN.loop.accent]}
          accentColor={C.cream}
          style={{ letterSpacing: "-0.035em", lineHeight: 1.12 }}
        />
        {isWide ? (
          <p style={{ marginTop: 44, marginLeft: 220, fontFamily: FONTS.sans, fontSize: 34, lineHeight: 1.3, color: "rgba(255,255,255,0.88)", opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`, maxWidth: 520 }}>
            {CAMPAIGN.loop.sub}
          </p>
        ) : null}
      </div>

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth={14}
          pathLength={1}
          strokeDasharray={`${(1 - gap) * ringIn} ${gap + (1 - ringIn)}`}
          strokeLinecap="round"
          transform={`rotate(${-62 + gap * 20} ${cx} ${cy})`}
        />
        {/* Arrowheads on the ring: it's a cycle. */}
        {[0, 180].map((a) => {
          const ang = ((a + loopAngle * 0) * Math.PI) / 180;
          const ax = cx + Math.cos(ang) * r;
          const ay = cy + Math.sin(ang) * r;
          return (
            <path
              key={a}
              d={`M ${ax - 16} ${ay - (a ? -10 : 10)} L ${ax} ${ay + (a ? -14 : 14)} L ${ax + 16} ${ay - (a ? -10 : 10)}`}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={ringIn * (1 - gap * 5)}
            />
          );
        })}
        <circle cx={dotX} cy={dotY} r={20} fill={C.cream} opacity={ringIn * (1 - escape * 0.2)} />
      </svg>
      {chip(CAMPAIGN.loop.days[0], cy - r, nearTop)}
      {chip(CAMPAIGN.loop.days[1], cy + r, nearBottom)}

      {!isWide ? (
        <p
          style={{
            position: "absolute",
            left: 150,
            right: 150,
            top: 1500,
            textAlign: "center",
            fontFamily: FONTS.sans,
            fontSize: 40,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.9)",
            opacity: sub,
            transform: `translateY(${(1 - sub) * 16}px)`,
          }}
        >
          {CAMPAIGN.loop.sub}
        </p>
      ) : null}
    </Ground>
  );
}
