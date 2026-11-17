import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, COPY, CTA_LABEL, CTA_URL, DATES, FONTS, VENUE } from "../config";
import { KineticText } from "../components/KineticText";
import { expo, per, useLayout } from "../components/layout-context";
import { logoCenterY } from "../components/ProgressLine";
import { Stage } from "../components/Stage";

/**
 * 0:22–0:25. The line's ember arrives and becomes the logo's glow; title,
 * dates, venue and the Register pill. Everything is in place by local 45 and
 * holds for the last 1.5 s.
 */
export function Cta() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const show = (from: number, to: number) =>
    interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo });
  const logo = show(12, 34);
  const facts = show(22, 34);
  const pill = show(30, 42);
  const shine = interpolate(frame, [46, 76], [-40, 140], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoH = per(layout, 210, 130);
  const logoY = logoCenterY(layout.isWide, layout.height);

  return (
    <AbsoluteFill>
      <Stage bottom={per(layout, 0.585, 0.71)} gap={per(layout, 40, 22)} fadeOut={0}>
        <KineticText text={COPY.title} start={2} stagger={3} duration={12} mode="rise" size={per(layout, 124, 112)} maxWidth={per(layout, 900, 1600)} />
        <div
          style={{
            opacity: facts,
            transform: `translateY(${(1 - facts) * 16}px)`,
            display: "flex",
            flexDirection: layout.isWide ? "row" : "column",
            alignItems: "center",
            gap: per(layout, 10, 28),
          }}
        >
          <span style={{ fontFamily: FONTS.display, fontSize: per(layout, 64, 52), color: COLORS.ember, textTransform: "uppercase", letterSpacing: "0.01em" }}>
            {DATES}
          </span>
          {layout.isWide ? <span style={{ width: 8, height: 8, borderRadius: 9, background: COLORS.dim }} /> : null}
          <span style={{ fontFamily: FONTS.sans, fontWeight: 500, fontSize: per(layout, 44, 40), color: COLORS.dim }}>{VENUE}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: per(layout, 22, 14), opacity: pill, transform: `translateY(${(1 - pill) * 20}px)` }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: COLORS.houseBlue,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontWeight: 600,
              fontSize: per(layout, 42, 34),
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: per(layout, "30px 64px", "22px 52px"),
              borderRadius: 999,
              boxShadow: "0 0 40px rgba(11,87,222,0.45)",
            }}
          >
            {CTA_LABEL} →
            <span
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${shine}%`,
                width: "30%",
                background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)",
              }}
            />
          </div>
          <span style={{ fontFamily: FONTS.mono, fontSize: per(layout, 28, 24), letterSpacing: "0.06em", color: COLORS.white }}>{CTA_URL}</span>
        </div>
      </Stage>

      <Img
        src={staticFile("dominion-house-logo.png")}
        style={{
          position: "absolute",
          left: "50%",
          top: logoY,
          height: logoH,
          filter: `brightness(0) invert(1) drop-shadow(0 0 ${18 * logo}px ${COLORS.emberGlow})`,
          opacity: logo,
          transform: `translate(-50%, -50%) scale(${0.85 + logo * 0.15})`,
        }}
      />
    </AbsoluteFill>
  );
}
