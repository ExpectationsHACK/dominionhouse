# Design

The look the owner has asked for, and the rules that keep it readable. Tokens
live in `src/app/globals.css`; use them, not raw hex values.

## Colour

| Token | Value | Use |
|---|---|---|
| `brass` | `#0b57de` | The house blue: header, footer, buttons, links, accents |
| `brass-on-dark` | `#7aa7f5` | Small blue labels (eyebrows, mono text) on black sections only; applied automatically by an unlayered rule at the end of globals.css |
| `sky` | `#e1ecff` | Light-blue sections (about half of what used to be black) |
| `skyblue` | `#229bf2` | Sky-blue buttons (`variant="sky"`, dark text) on light-blue sections, and the hero button and blue word on the home and Fresh Fire heroes |
| `bone` | `#eef7ff` | Page background, mobile menu panel |
| `brass-soft` | `#d3eaff` | Soft panels, ticket cards |
| `ink` | `#0b0b0c` | Text, black sections, primary buttons. `meridian` is also black, not blue |
| `warn` | `#c2410c` (soft `#ffedd5`) | Warnings: balance due, needs a bed. Orange |
| `danger` | `#a62b1f` | Real errors only. Red |

- Text on `brass` is **white** (black on this blue is too dark to read).
- Header and footer are `brass` with white text and the logo drawn white
  (`brightness-0 invert`); the mobile menu panel stays light (`bone`, dark text).
- Keep black where it earns its place: video heroes, the Fresh Fire countdown
  band, the Senior Pastors photos, the testimonies (white cards on black),
  inner-page top banners. Text-heavy sections and closing bands are `sky`.

## Type

- **Anton** (`.display`): headlines, uppercase, line-height **1.08**. Don't
  override line-height on multi-line headings.
- **General Sans**: all body text. Self-hosted variable font
  (`src/fonts/GeneralSans-Variable.woff2`, weights 200–700, ITF Free Font
  License). No Inter-specific font features.
- **JetBrains Mono** (`.eyebrow`, `font-mono`): small uppercase labels.

## Photos and video

- All photos and videos inside `#main` are brightened (`brightness(1.1)
  saturate(1.08)`). Opt out with `data-keep-tone` (ticket QR codes do).
- Hero films (`public/video/{hero,camp-hero}-{desktop,mobile}.mp4` + `.jpg`
  posters) are 1080p desktop and 720×1280 phone cuts, sharpened and graded.
  Overlays stay light: dark only along the bottom and left behind the text,
  plus a soft text shadow. Hero labels are white.
- Pricing cards: a centred-face photo across the left half, the card colour
  fading over it from 25% to 50%; the price and ticket on the right. Short
  rectangles on phones and desktop. Photos in `public/tickets/` are 800×600
  crops with the face at the centre.
- Testimony cards: white cards, story text, a round profile photo, blue
  headings and "Read the full story" link.

## Motion

- Every card carousel moves by itself (`useAutoAdvance`): one card every
  4.5 s, looping through copies of its cards so it keeps moving on wide
  screens (`loopCopies`). It pauses on hover, press and keyboard focus,
  rests off screen or in a hidden tab, and stays still for reduced motion.
  Arrows stay and restart the timer.
- Mouse drag on carousels only starts after 6 px, so buttons inside cards
  still click.
- Site animations live in `src/components/site/motion.tsx` (client pieces)
  and the "motion:" blocks at the end of globals.css. Every one renders its
  finished state on the server, uses CSS or IntersectionObserver (no
  libraries), and is still for reduced motion. Scroll effects write to the
  DOM in a rAF, never a React render per frame.
- In use: header shrink, scroll line, back-to-top ring, page fade, menu
  slide-in, hero parallax, rotating hero word, count-ups, highlighter sweep,
  letter-by-letter camp title, lines lighting up, photo wipes, programme
  timeline, magnetic and shining main buttons, pricing-card glow, embers
  (the only fire colours on the site), flip-clock countdown, spots and Legacy
  Place meters, testimony fan-out, step bar, success check with confetti,
  ticket flip, and the next-field pulse on phones.
- A server page can't call a function from motion.tsx; helpers that build
  JSX on the server (like `highlightWord`) live in their own file.
- Steps in the registration form jump instantly to the step tabs
  (`behavior: "instant"`), because the site-wide smooth scrolling can be cut
  short on phones.

## Copy

Plain and warm, one idea per sentence. Use the owner's wording for church
copy exactly. Labels are short; "Admin desk" in the admin, "camp desk" in
messages to registrants.
