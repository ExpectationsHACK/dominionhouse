# Spiritual Growth Bootcamp teaser

A 25-second motion graphics teaser (Remotion), kept separate from the
Next.js site: its own `package.json`, excluded from the site's TypeScript and
ESLint checks.

| | |
|---|---|
| Vertical | 1080×1920, 30 fps (`SGB-Vertical`) |
| Wide | 1920×1080, 30 fps (`SGB-Wide`), same composition with `layout: "wide"` |
| Output | `out/sgb-teaser-vertical.mp4`, `out/sgb-teaser-wide.mp4` (H.264 + AAC) |

From the project root:

```bash
npm run video:preview          # Remotion Studio
npm run video:render:vertical
npm run video:render:wide
```

First time: `npm install` inside `video/`.

## Changing the words

Everything is in `src/config.ts`: `DATES`, `VENUE`, `CTA_URL` and `CTA_LABEL`
at the top, then `COPY` (every line on screen). A `\n` inside a line forces a
line break. Colours and fonts come from the site (`src/app/globals.css`).

## Sound

`public/audio/sgb-bed.wav` is a placeholder bed (not in git) built automatically before a preview or render when it's missing, or on demand with `npm run audio`
(`scripts/make-audio.mjs`): pad, hits, riser into the title, a tick per card,
clock ticks, and a resolve at the CTA. Its sync points are `SYNC` in
`src/config.ts`. To use a real track, save it over `public/audio/sgb-bed.wav`
(same name) and render again.

## Scenes

`src/scenes/`: Hook, Tension, Reveal, Experience, Rhythm, Decision, Cta,
composed in `src/Teaser.tsx` with `<Series>`. Shared pieces are in
`src/components/`: KineticText, EmberParticles, LightLeak (and Flare),
IconCard, ProgressLine (the rising ember line), Backdrop and Stage.
