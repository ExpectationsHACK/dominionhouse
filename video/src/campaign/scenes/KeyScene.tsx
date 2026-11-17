import { useCurrentFrame } from "remotion";
import { FONTS } from "../../config";
import { per, useLayout } from "../../components/layout-context";
import { C, CAMPAIGN, DATES } from "../config";
import { Burst, Ground, Lockup, Pill, Sparkle, Squiggle, TitleStack, useIn, usePop } from "../parts";

/** Poster 1, the key visual: title, dates, tagline and the three badges. */
export function KeyScene() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, isWide } = layout;
  const reveal = useIn(8, 22);
  const big = usePop(14, 10);
  const dates = useIn(28, 40);
  const tagline = useIn(36, 50);
  const age = usePop(46, 9);
  const pink = usePop(54, 10);
  const orange = usePop(62, 10);
  const ghost = useIn(0, 30);

  const titleX = per(layout, W / 2, 720);
  const titleTop = per(layout, 400, 230);
  const scale = per(layout, 1.36, 1.2);

  return (
    <Ground color={C.sky} origin={[50, 45]}>
      {/* The faint outline word behind, as on the poster. */}
      <div
        style={{
          position: "absolute",
          left: per(layout, -40, 40),
          top: per(layout, 1060, 560),
          fontFamily: FONTS.display,
          fontSize: per(layout, 420, 400),
          lineHeight: 1,
          textTransform: "uppercase",
          color: "transparent",
          WebkitTextStroke: "4px rgba(255,255,255,0.16)",
          whiteSpace: "nowrap",
          opacity: ghost,
          transform: `translateX(${-frame * 1.2}px)`,
        }}
      >
        Spiritual
      </div>
      <Squiggle color="rgba(11,87,222,0.35)" width={120} d={isWide ? `M 80 380 L 260 120 L 380 360 L 560 140 L 720 300` : `M 60 560 L 240 260 L 360 520 L 540 280 L 700 420`} drawFrom={2} />
      <Squiggle color={C.cyan} width={per(layout, 150, 130)} d={isWide ? `M -100 1000 C 200 700, 420 900, 380 1180` : `M -120 1900 C 120 1500, 420 1560, 360 1980`} drawFrom={10} />
      <Squiggle color={C.cyan} width={per(layout, 130, 110)} d={isWide ? `M 2000 420 C 1800 560, 1820 900, 2000 1000` : `M 1180 1220 C 980 1340, 1000 1700, 1180 1820`} drawFrom={16} style={{ opacity: 0.8 }} />
      <Sparkle size={per(layout, 130, 120)} color={C.lime} x={per(layout, 150, 230)} y={per(layout, 880, 700)} popAt={18} />
      <Burst size={per(layout, 260, 280)} color={C.mustard} x={per(layout, 1010, 1820)} y={per(layout, 390, 160)} popAt={20} points={9} spin={0.45} />
      <Lockup top={per(layout, 150, 50)} scale={per(layout, 1, 0.85)} />

      <div style={{ position: "absolute", left: titleX, top: titleTop, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <TitleStack scale={scale} reveal={reveal} bigReveal={big} />
        <div style={{ marginTop: 18, fontFamily: FONTS.display, fontSize: per(layout, 64, 56), textTransform: "uppercase", color: C.cream, letterSpacing: "0.01em", opacity: dates, transform: `translateY(${(1 - dates) * 16}px)`, whiteSpace: "nowrap" }}>
          {DATES}
        </div>
        <div style={{ marginTop: 18, fontFamily: FONTS.sans, fontWeight: 600, fontSize: per(layout, 36, 32), letterSpacing: "0.08em", color: C.royal, opacity: tagline, whiteSpace: "nowrap" }}>
          {CAMPAIGN.key.tagline}
        </div>
      </div>

      {/* "For youths aged 20-27" on a navy burst. */}
      <div style={{ position: "absolute", left: per(layout, 830, 1540), top: per(layout, 1170, 400), width: per(layout, 290, 270), height: per(layout, 290, 270), transform: `translate(-50%, -50%) scale(${age}) rotate(${-8 + Math.sin(frame / 18) * 3}deg)` }}>
        <Burst size={per(layout, 290, 270)} color={C.navy} x={per(layout, 145, 135)} y={per(layout, 145, 135)} popAt={0} points={12} spin={0} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.white, fontFamily: FONTS.sans, fontWeight: 600, fontSize: per(layout, 30, 28), lineHeight: 1.05, textAlign: "center" }}>
          <span>{CAMPAIGN.key.age[0]}</span>
          <span>{CAMPAIGN.key.age[1]}</span>
          <span style={{ fontFamily: FONTS.display, fontSize: per(layout, 66, 60), marginTop: 4 }}>{CAMPAIGN.key.age[2]}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: per(layout, 330, 1400), top: per(layout, 1330, 720), transform: "translate(-50%, -50%)" }}>
        <Pill text={CAMPAIGN.key.pillPink} color={C.pink} tilt={9} pop={pink} size={per(layout, 38, 34)} />
      </div>
      <div style={{ position: "absolute", left: per(layout, 680, 1560), top: per(layout, 1520, 890), transform: "translate(-50%, -50%)" }}>
        <Pill text={CAMPAIGN.key.pillOrange} color={C.pillOrange} tilt={-8} pop={orange} size={per(layout, 38, 34)} />
      </div>
    </Ground>
  );
}
