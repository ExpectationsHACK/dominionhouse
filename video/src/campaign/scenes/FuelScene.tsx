import { interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../config";
import { KineticText } from "../../components/KineticText";
import { expo, per, useLayout } from "../../components/layout-context";
import { C, CAMPAIGN } from "../config";
import { Ground, Lockup, Squiggle, useIn, usePop } from "../parts";

/** Poster 3. The gauge drops to E and blinks; then it refuels to F. */
export function FuelScene() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H, isWide } = layout;

  const px = per(layout, 400, 1240);
  const py = per(layout, 1030, 450);
  const R = per(layout, 410, 320);
  const F = -70; // degrees, 0 = pointing right, positive = down
  const E = 62;

  const drop = interpolate(frame, [18, 40], [-30, E], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const wobble = frame > 40 && frame < 60 ? Math.sin((frame - 40) * 1.4) * (60 - frame) * 0.15 : 0;
  const refill = interpolate(frame, [96, 124], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const angle = drop + wobble + (F - E) * refill;
  const blink = frame > 44 && frame < 96 ? (Math.floor(frame / 6) % 2 === 0 ? 1 : 0.25) : 0;
  const gaugeIn = useIn(4, 20);
  const pump = usePop(46, 8);
  const ticks = 11;

  return (
    <Ground color={C.orange} origin={[50, 92]}>
      <Squiggle
        color={C.orangeLight}
        width={per(layout, 130, 120)}
        d={isWide ? `M -80 520 L 120 260 L 240 520 L 420 300 C 560 120, 700 380, 600 520 S 900 760, 1300 560 S 1700 420, 2000 520` : `M -80 900 L 100 640 L 220 900 L 400 680 C 520 520, 640 760, 560 900 S 820 1160, 1180 980`}
        style={{ opacity: 0.85 }}
      />
      <Lockup top={per(layout, 150, 60)} scale={per(layout, 1, 0.85)} />

      <div style={{ position: "absolute", left: layout.side, top: per(layout, 320, 360), width: per(layout, 900, 820) }}>
        <KineticText
          text={CAMPAIGN.fuel.headline}
          start={8}
          stagger={3}
          duration={10}
          mode="rise"
          font="sans"
          weight={600}
          size={per(layout, 112, 100)}
          align="left"
          accent={[...CAMPAIGN.fuel.accent]}
          accentColor={C.red}
          style={{ letterSpacing: "-0.045em", lineHeight: 1.04 }}
        />
      </div>

      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: gaugeIn }}>
        {Array.from({ length: ticks }, (_, i) => {
          const a = F + ((E - F) * i) / (ticks - 1);
          const rad = (a * Math.PI) / 180;
          const lit = refill > 0 && a >= angle - 2;
          const isE = i === ticks - 1;
          return (
            <line
              key={i}
              x1={px + Math.cos(rad) * (R - 70)}
              y1={py + Math.sin(rad) * (R - 70)}
              x2={px + Math.cos(rad) * R}
              y2={py + Math.sin(rad) * R}
              stroke={isE ? (blink ? C.red : "#ffd7c7") : lit ? C.cream : C.white}
              strokeOpacity={isE && blink ? blink : 1}
              strokeWidth={26}
              strokeLinecap="round"
            />
          );
        })}
        <text x={px + Math.cos((F * Math.PI) / 180) * (R + 10) - 90} y={py + Math.sin((F * Math.PI) / 180) * (R + 10) + 20} fontFamily="General Sans" fontWeight={700} fontSize={84} fill={C.white}>
          F
        </text>
        <text x={px + Math.cos((E * Math.PI) / 180) * (R + 10) - 110} y={py + Math.sin((E * Math.PI) / 180) * (R + 10) + 40} fontFamily="General Sans" fontWeight={700} fontSize={84} fill={C.white}>
          E
        </text>
        {/* Needle. */}
        <g transform={`rotate(${angle} ${px} ${py})`}>
          <path d={`M ${px - 30} ${py - 18} L ${px + R - 80} ${py - 4} L ${px + R - 80} ${py + 4} L ${px - 30} ${py + 18} Z`} fill={C.red} />
        </g>
        <circle cx={px} cy={py} r={52} fill="#ff5a36" />
      </svg>

      {/* Fuel pump icon, pulsing while the tank is empty. */}
      <svg
        viewBox="0 0 64 80"
        width={per(layout, 96, 84)}
        height={per(layout, 120, 105)}
        style={{
          position: "absolute",
          left: px + per(layout, -40, -170),
          top: py + per(layout, 280, 150),
          transform: `scale(${pump * (1 + (blink ? 0.08 : 0))})`,
          opacity: 1 - refill * 0.4,
        }}
      >
        <rect x="6" y="6" width="34" height="68" rx="5" fill="#ff5a36" />
        <rect x="12" y="13" width="22" height="16" rx="2" fill={C.orange} />
        <path d="M40 22 L52 30 L52 58 C52 64 58 64 58 58 L58 26" fill="none" stroke="#ff5a36" strokeWidth="5" strokeLinecap="round" />
        <rect x="2" y="70" width="42" height="8" rx="2" fill="#ff5a36" />
      </svg>

      <div
        style={{
          position: "absolute",
          left: layout.side,
          top: per(layout, 560, 600),
          fontFamily: FONTS.mono,
          fontSize: per(layout, 30, 28),
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: C.navy,
          opacity: refill,
        }}
      >
        Refuelling…
      </div>
    </Ground>
  );
}
