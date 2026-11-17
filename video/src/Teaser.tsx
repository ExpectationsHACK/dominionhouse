import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Series, continueRender, delayRender, staticFile } from "remotion";
import { SCENES, START, type Layout } from "./config";
import { Backdrop } from "./components/Backdrop";
import { EmberParticles } from "./components/EmberParticles";
import { LayoutContext } from "./components/layout-context";
import { Flare, LightLeak } from "./components/LightLeak";
import { ProgressLine } from "./components/ProgressLine";
import { Cta } from "./scenes/Cta";
import { Decision } from "./scenes/Decision";
import { Experience } from "./scenes/Experience";
import { Hook } from "./scenes/Hook";
import { Reveal } from "./scenes/Reveal";
import { Rhythm } from "./scenes/Rhythm";
import { Tension } from "./scenes/Tension";

loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

/** General Sans is self-hosted on the site; load the same file. */
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

export type TeaserProps = { layout: Layout; withAudio: boolean };

/**
 * The Spiritual Growth Bootcamp teaser. Layers, back to front: backdrop,
 * embers, the growth line, the scenes in series, then light leaks on the cuts.
 */
export function Teaser({ layout, withAudio }: TeaserProps) {
  useGeneralSans();
  return (
    <LayoutContext.Provider value={layout}>
      <AbsoluteFill style={{ backgroundColor: "#0b0b0c" }}>
        <Backdrop />
        <EmberParticles />
        <ProgressLine />

        <Series>
          <Series.Sequence durationInFrames={SCENES.hook} name="Hook">
            <Hook />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.tension} name="Tension">
            <Tension />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.reveal} name="Reveal">
            <Reveal />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.experience} name="Experience">
            <Experience />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.rhythm} name="Rhythm">
            <Rhythm />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.decision} name="Decision">
            <Decision />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENES.cta} name="CTA">
            <Cta />
          </Series.Sequence>
        </Series>

        {/* Cuts: light-leak wipes and the "break it" flare. */}
        <LightLeak at={START.tension} strength={0.35} />
        <Flare at={START.tension + 50} />
        <LightLeak at={START.reveal + 2} strength={0.7} length={22} direction={-1} />
        <LightLeak at={START.experience} strength={0.4} />
        <LightLeak at={START.rhythm} strength={0.4} direction={-1} />
        <LightLeak at={START.decision} strength={0.5} length={22} />
        <LightLeak at={START.cta} strength={0.6} length={24} direction={-1} />

        {/* Placeholder sound bed (scripts/make-audio.mjs), built on SYNC in config.ts. */}
        {withAudio ? <Audio src={staticFile("audio/sgb-bed.wav")} /> : null}
      </AbsoluteFill>
    </LayoutContext.Provider>
  );
}
