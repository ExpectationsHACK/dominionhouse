import { interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../config";
import { KineticText } from "../../components/KineticText";
import { per, useLayout } from "../../components/layout-context";
import { C, CAMPAIGN } from "../config";
import { Burst, Ground, Lockup, Sparkle, Squiggle, useIn, usePop } from "../parts";

/**
 * Poster 4. A phone note ticks off the New Year list, all but "Develop an
 * intense prayer life." Then, last of all, that one gets its tick.
 */
export function ChecklistScene() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { isWide } = layout;
  const phoneIn = usePop(6, 13);
  const unchecked = usePop(34, 9);
  const sub = useIn(48, 62);
  const finalAt = 118;
  const final = usePop(finalAt, 8);
  const caret = frame < finalAt && Math.floor(frame / 8) % 2 === 0;

  const phoneW = per(layout, 600, 560);
  const phoneH = per(layout, 620, 590);
  const phoneLeft = per(layout, (1080 - 600) / 2, 200);
  const phoneTop = per(layout, 830, 170);
  const s = per(layout, 1, 0.94);

  return (
    <Ground color={C.royal} origin={[12, 62]}>
      <Squiggle color={C.royalLight} width={110} d={isWide ? `M -60 760 C 300 560, 520 980, 900 700 S 1500 300, 2000 520` : `M -60 1480 C 260 1300, 480 1660, 760 1440 S 1060 1200, 1200 1300`} style={{ opacity: 0.6 }} />
      <Burst size={per(layout, 300, 340)} color={C.mustard} x={per(layout, 1040, 1850)} y={per(layout, 360, 230)} popAt={6} points={9} spin={0.5} />
      <Burst size={per(layout, 180, 200)} color={C.mustard} x={phoneLeft - 10} y={phoneTop + phoneH * 0.66} popAt={14} points={9} spin={-0.6} />
      <Lockup top={per(layout, 150, 60)} scale={per(layout, 1, 0.85)} />

      <div style={{ position: "absolute", left: per(layout, layout.side, 900), top: per(layout, 300, 280), width: per(layout, 900, 860) }}>
        <KineticText
          text={CAMPAIGN.checklist.headline}
          start={8}
          stagger={2}
          duration={10}
          mode="rise"
          font="sans"
          weight={600}
          size={per(layout, 84, 80)}
          align="left"
          style={{ letterSpacing: "-0.045em", lineHeight: 1.06 }}
        />
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: per(layout, 116, 112),
            lineHeight: 1.05,
            color: C.mustard,
            transform: `skewX(-12deg) scale(${unchecked})`,
            transformOrigin: "left center",
            marginTop: 4,
          }}
        >
          {CAMPAIGN.checklist.accentWord}
        </div>
        <p style={{ marginTop: per(layout, 14, 40), fontFamily: FONTS.sans, fontWeight: 400, fontSize: per(layout, 42, 42), letterSpacing: "-0.03em", color: "rgba(255,255,255,0.85)", opacity: sub }}>
          {CAMPAIGN.checklist.sub}
        </p>
      </div>

      {/* The phone note. */}
      <div
        style={{
          position: "absolute",
          left: phoneLeft,
          top: phoneTop,
          width: phoneW,
          height: phoneH,
          background: C.white,
          borderRadius: 18,
          boxShadow: "0 30px 70px rgba(2,10,28,0.35)",
          transform: `translateY(${(1 - phoneIn) * 300}px) rotate(${(1 - phoneIn) * -8}deg)`,
          padding: `${26 * s}px ${36 * s}px`,
          fontFamily: FONTS.sans,
          color: "#111",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 600, fontSize: 26 * s }}>
          <span style={{ width: 90 }}>1:47</span>
          <span style={{ width: 150, height: 44, background: "#000", borderRadius: 999 }} />
          <span style={{ width: 90, textAlign: "right", letterSpacing: 2 }}>▮▮ ◔</span>
        </div>
        <div style={{ marginTop: 22 * s, color: "#e7a91f", fontSize: 24 * s }}>‹ All iCloud</div>
        <div style={{ marginTop: 26 * s, fontWeight: 700, fontSize: 38 * s, letterSpacing: "-0.02em" }}>{CAMPAIGN.checklist.title}</div>
        <div style={{ marginTop: 22 * s, display: "flex", flexDirection: "column", gap: 20 * s }}>
          {CAMPAIGN.checklist.items.map((item, i) => {
            const last = i === CAMPAIGN.checklist.items.length - 1;
            const at = last ? finalAt : 22 + i * 9;
            const p = last ? final : interpolate(frame, [at, at + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 18 * s, fontSize: 29 * s, letterSpacing: "-0.015em" }}>
                <span
                  style={{
                    position: "relative",
                    width: 34 * s,
                    height: 34 * s,
                    borderRadius: 999,
                    border: `3px solid ${p > 0.05 ? "#e7a91f" : "#b8b8b8"}`,
                    background: p > 0.05 ? "#e7a91f" : "transparent",
                    flexShrink: 0,
                    transform: `scale(${last ? 0.8 + 0.2 * Math.min(1.2, p) + (p > 0 ? 0.1 : 0) : 1})`,
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ position: "absolute", inset: 3 }}>
                    <path d="M5 12.5 L10 17 L19 7" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, p)} />
                  </svg>
                </span>
                <span style={{ fontWeight: last ? 600 : 400 }}>
                  {item}
                  {last && caret ? <span style={{ color: "#e7a91f" }}>|</span> : null}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {frame >= finalAt ? (
        <>
          <Sparkle size={70} color={C.mustard} x={phoneLeft + phoneW - 40} y={phoneTop + phoneH * 0.62} popAt={finalAt + 2} />
          <Sparkle size={44} color={C.lime} x={phoneLeft + phoneW + 20} y={phoneTop + phoneH * 0.52} popAt={finalAt + 5} tilt={20} />
        </>
      ) : null}
    </Ground>
  );
}
