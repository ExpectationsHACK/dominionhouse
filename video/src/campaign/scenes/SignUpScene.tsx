import { interpolate, useCurrentFrame } from "remotion";
import { FONTS } from "../../config";
import { per, useLayout } from "../../components/layout-context";
import { C, CAMPAIGN, CTA_LABEL, CTA_URL, DATES, VENUE } from "../config";
import { Burst, Ground, Lockup, Sparkle, Squiggle, TitleStack, useIn, usePop } from "../parts";

/** The close: the posters' navy bar, opened up into a full sign-up card. Holds from ~45. */
export function SignUpScene() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { isWide } = layout;
  const label = useIn(6, 18);
  const title = useIn(10, 24);
  const big = usePop(14, 10);
  const facts = useIn(24, 36);
  const button = usePop(32, 10);
  const url = useIn(40, 52);
  const shine = interpolate(frame, [52, 84], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Ground color={C.navy} origin={[50, 50]}>
      <Squiggle color={C.sky} width={per(layout, 100, 90)} d={isWide ? `M -60 1040 C 240 880, 420 1140, 720 1000` : `M -80 1700 C 200 1500, 420 1820, 700 1660`} drawFrom={6} style={{ opacity: 0.9 }} />
      <Sparkle size={per(layout, 110, 100)} color={C.lime} x={per(layout, 940, 1720)} y={per(layout, 400, 260)} popAt={20} />
      <Burst size={per(layout, 170, 180)} color={C.mustard} x={per(layout, 140, 210)} y={per(layout, 420, 220)} popAt={26} points={9} />
      <Lockup top={per(layout, 150, 50)} scale={per(layout, 1, 0.85)} />

      <div
        style={{
          position: "absolute",
          left: layout.side,
          right: layout.side,
          top: per(layout, 520, 200),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: per(layout, 34, 22),
          textAlign: "center",
        }}
      >
        <span style={{ fontFamily: FONTS.sans, fontWeight: 500, fontSize: per(layout, 60, 54), letterSpacing: "-0.03em", color: C.skyLight, opacity: label, transform: `translateY(${(1 - label) * 16}px)` }}>
          {CAMPAIGN.signUp}
        </span>
        <TitleStack scale={per(layout, 1.3, 1.1)} reveal={title} bigReveal={big} />
        <div style={{ opacity: facts, transform: `translateY(${(1 - facts) * 14}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONTS.display, fontSize: per(layout, 60, 52), textTransform: "uppercase", color: C.cream }}>{DATES}</span>
          <span style={{ fontFamily: FONTS.sans, fontWeight: 500, fontSize: per(layout, 40, 36), color: "rgba(255,255,255,0.78)" }}>{VENUE}</span>
        </div>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            marginTop: per(layout, 20, 8),
            background: C.sky,
            color: C.navy,
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize: per(layout, 42, 36),
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: per(layout, "30px 64px", "22px 54px"),
            borderRadius: 999,
            transform: `scale(${button})`,
          }}
        >
          {CTA_LABEL} →
          <span style={{ position: "absolute", top: 0, bottom: 0, left: `${shine}%`, width: "30%", background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.6), transparent)" }} />
        </div>
        <span style={{ fontFamily: FONTS.mono, fontSize: per(layout, 28, 26), letterSpacing: "0.05em", color: C.white, opacity: url }}>{CTA_URL}</span>
      </div>
    </Ground>
  );
}
