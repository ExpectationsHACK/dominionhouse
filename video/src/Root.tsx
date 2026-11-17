import { Composition } from "remotion";
import { FPS, LAYOUTS, TOTAL_FRAMES } from "./config";
import { Teaser, type TeaserProps } from "./Teaser";

/** One composition, two layouts: 9:16 for Reels/TikTok/Status, 16:9 for YouTube and screens. */
export function Root() {
  return (
    <>
      <Composition
        id="SGB-Vertical"
        component={Teaser}
        defaultProps={{ layout: "vertical", withAudio: true } satisfies TeaserProps}
        width={LAYOUTS.vertical.width}
        height={LAYOUTS.vertical.height}
        fps={FPS}
        durationInFrames={TOTAL_FRAMES}
      />
      <Composition
        id="SGB-Wide"
        component={Teaser}
        defaultProps={{ layout: "wide", withAudio: true } satisfies TeaserProps}
        width={LAYOUTS.wide.width}
        height={LAYOUTS.wide.height}
        fps={FPS}
        durationInFrames={TOTAL_FRAMES}
      />
    </>
  );
}
