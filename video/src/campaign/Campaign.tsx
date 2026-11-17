import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Layout } from "../config";
import { LayoutContext, expo, per, useLayout } from "../components/layout-context";
import { BAR, C, SHOTS } from "./config";
import { SignUpBar } from "./parts";
import { ChecklistScene } from "./scenes/ChecklistScene";
import { FuelScene } from "./scenes/FuelScene";
import { KeyScene } from "./scenes/KeyScene";
import { LoopScene } from "./scenes/LoopScene";
import { SignUpScene } from "./scenes/SignUpScene";
import { SlipScene } from "./scenes/SlipScene";

loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

function useGeneralSans() {
  const [handle] = useState(() => delayRender("General Sans"));
  useEffect(() => {
    const face = new FontFace("General Sans", `url(${staticFile("fonts/GeneralSans-Variable.woff2")}) format("woff2")`, { weight: "200 700" });
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .finally(() => continueRender(handle));
  }, [handle]);
}

/** The bottom bar across the poster scenes, its label colour following the ground. */
function Bar() {
  const frame = useCurrentFrame();
  const layout = useLayout();
  if (frame < BAR.in || frame > BAR.out + 12) return null;
  const t =
    interpolate(frame, [BAR.in, BAR.in + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: expo }) *
    interpolate(frame, [BAR.out, BAR.out + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const label = frame < SHOTS.fuel[0] + 8 ? C.skyLight : C.mustard;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: per(layout, 170, 56), display: "flex", justifyContent: "center" }}>
      <SignUpBar labelColor={label} t={t} width={per(layout, 900, 1060)} />
    </div>
  );
}

export type CampaignProps = { layout: Layout; withAudio: boolean };

/** Campaign teaser: six poster scenes, each opening over the last with a round wipe. */
export function Campaign({ layout, withAudio }: CampaignProps) {
  useGeneralSans();
  const scenes = [
    { key: "loop", El: LoopScene },
    { key: "slip", El: SlipScene },
    { key: "fuel", El: FuelScene },
    { key: "checklist", El: ChecklistScene },
    { key: "key", El: KeyScene },
    { key: "signup", El: SignUpScene },
  ] as const;
  return (
    <LayoutContext.Provider value={layout}>
      <AbsoluteFill style={{ background: C.royal }}>
        {scenes.map(({ key, El }) => (
          <Sequence key={key} name={key} from={SHOTS[key][0]} durationInFrames={SHOTS[key][1]}>
            <El />
          </Sequence>
        ))}
        <Bar />
        {withAudio ? <Audio src={staticFile("audio/sgb-campaign-bed.wav")} /> : null}
      </AbsoluteFill>
    </LayoutContext.Provider>
  );
}
