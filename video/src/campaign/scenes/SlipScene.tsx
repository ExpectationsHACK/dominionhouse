import { interpolate, random, useCurrentFrame } from "remotion";
import { FONTS } from "../../config";
import { KineticText } from "../../components/KineticText";
import { per, useLayout } from "../../components/layout-context";
import { C, CAMPAIGN } from "../config";
import { Burst, Ground, Lockup, Squiggle, useIn, usePop } from "../parts";

/** Poster 2. A bet slip prints its "selections", then gets stamped: not by chance. */
export function SlipScene() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H, isWide } = layout;
  const slipIn = usePop(6, 13);
  const stampAt = 100;
  const stamp = interpolate(frame, [stampAt, stampAt + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = frame >= stampAt && frame < stampAt + 8 ? Math.sin(frame * 3) * (8 - (frame - stampAt)) : 0;
  const sub = useIn(56, 70);

  const slipW = per(layout, 520, 470);
  const slipH = per(layout, 680, 620);
  const slipX = per(layout, W / 2 + 30, 520);
  const slipY = per(layout, 1170, 500);
  const mono = { fontFamily: FONTS.mono, color: "#1b1b1f" } as const;

  return (
    <Ground color={C.sky} origin={[85, 18]}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <polygon
          points={isWide ? `-40,1100 380,240 820,1100` : `-60,1960 260,980 640,1960`}
          fill={C.lime}
          style={{ transform: `translateY(${(1 - useIn(2, 22)) * 400}px)` }}
        />
      </svg>
      <Squiggle color={C.skyLight} width={110} d={isWide ? `M 700 120 C 980 -20, 1180 420, 1500 260 S 1900 300, 2000 160` : `M 300 600 C 560 420, 700 860, 960 700 S 1200 560, 1240 640`} style={{ opacity: 0.6 }} />
      <Burst size={per(layout, 240, 220)} color={C.lime} x={per(layout, W - 40, W - 120)} y={per(layout, 330, 230)} popAt={8} points={8} />
      <Lockup top={per(layout, 150, 60)} scale={per(layout, 1, 0.85)} />

      <div style={{ position: "absolute", left: per(layout, layout.side, 960), top: per(layout, 300, 260), width: per(layout, 900, 800) }}>
        <KineticText
          text={CAMPAIGN.slip.headline}
          start={10}
          stagger={3}
          duration={10}
          mode="rise"
          font="sans"
          weight={600}
          size={per(layout, 104, 92)}
          align="left"
          accent={[...CAMPAIGN.slip.accent]}
          accentColor={C.lime}
          style={{ letterSpacing: "-0.04em", lineHeight: 1.04 }}
        />
        <p style={{ marginTop: 18, fontFamily: FONTS.sans, fontWeight: 400, fontSize: per(layout, 50, 44), letterSpacing: "-0.03em", color: C.white, opacity: sub, transform: `translateY(${(1 - sub) * 14}px)` }}>
          {CAMPAIGN.slip.sub}
        </p>
      </div>

      {/* The slip. */}
      <div
        style={{
          position: "absolute",
          left: slipX - slipW / 2,
          top: slipY - slipH / 2,
          width: slipW,
          height: slipH,
          background: "#fbfbf6",
          boxShadow: "0 30px 60px rgba(2,10,28,0.28)",
          transform: `translate(${(1 - slipIn) * -500 + shake}px, ${(1 - slipIn) * 120}px) rotate(${-10 - (1 - slipIn) * 20}deg)`,
          padding: "34px 34px 26px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ ...mono, fontWeight: 700, fontSize: 40, letterSpacing: "0.02em" }}>{CAMPAIGN.slip.header}</div>
        <div style={{ ...mono, fontSize: 16, opacity: 0.6, marginTop: -6 }}>Bet slip #378229 · 12:42:53</div>
        <div style={{ borderTop: "2px dashed rgba(0,0,0,0.25)", margin: "6px 0 2px" }} />
        {CAMPAIGN.slip.rows.map((row, i) => {
          const p = interpolate(frame, [20 + i * 8, 26 + i * 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={row.label} style={{ opacity: p, transform: `translateY(${(1 - p) * -8}px)` }}>
              <div style={{ ...mono, display: "flex", justifyContent: "space-between", fontSize: 23, fontWeight: 600 }}>
                <span>{row.label}</span>
                <span>{row.odds}</span>
              </div>
              <div style={{ ...mono, fontSize: 15, opacity: 0.55 }}>Over 2.5</div>
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 3, height: 64, alignItems: "stretch", opacity: interpolate(frame, [54, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          {Array.from({ length: 46 }, (_, i) => (
            <span key={i} style={{ width: 2 + Math.floor(random(`b${i}`) * 4), background: "#1b1b1f" }} />
          ))}
        </div>

        {/* The stamp. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            border: `8px solid ${C.red}`,
            color: C.red,
            borderRadius: 14,
            padding: "10px 26px",
            fontFamily: FONTS.display,
            fontSize: 64,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            opacity: stamp * 0.92,
            transform: `translate(-50%, -50%) rotate(16deg) scale(${1.8 - 0.8 * stamp})`,
            mixBlendMode: "multiply",
          }}
        >
          {CAMPAIGN.slip.stamp}
        </div>
      </div>
    </Ground>
  );
}
