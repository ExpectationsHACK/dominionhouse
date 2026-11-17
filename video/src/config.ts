/**
 * Everything you might want to change lives here: copy, dates, venue, the CTA
 * link, colours and timing. Scenes read from this file only.
 *
 * Copy marked "page:" is word for word from /spiritual-growth-bootcamp.
 */

// ── fill these in ───────────────────────────────────────────────────────────
export const DATES = "29 Nov – 6 Dec 2026"; // page: hero "Dates"
export const VENUE = "Online · YouTube & WhatsApp"; // page: "Online (YouTube and WhatsApp)"
export const CTA_URL = "dominionhouse.org/spiritual-growth-bootcamp";
export const CTA_LABEL = "Register now";

// ── copy ────────────────────────────────────────────────────────────────────
export const COPY = {
  hook: ["YOU WANT TO GROW.", "BUT WANTING ISN'T ENOUGH."],
  tension: ["Spiritual complacency is quiet.", "It's time to break it."],
  title: "Spiritual Growth Bootcamp", // page: h1
  eyebrow: "One-week intensive program", // page: hero eyebrow
  subline: "One week. Intentional growth.",
  expectEyebrow: "What to expect", // page: section eyebrow
  cards: [
    { title: "Intensive Prayer", icon: "prayer" },
    { title: "The Word", icon: "word" },
    { title: "Meditation", icon: "meditation" },
    { title: "Accountability & Mentorship", icon: "accountability" },
    { title: "Community", icon: "community" },
    { title: "Spiritual Disciplines", icon: "disciplines" },
  ],
  rhythmTimes: ["6:00 AM", "8:00 PM"], // page: schedule times
  rhythmLine: "Daily sessions. Daily check-ins.\nA Fruit Fast.", // \n forces a line break
  tagline: "The church that never sleeps.", // site: About and home pages
  decision: ["DON'T JUST DESIRE GROWTH.", "TAKE INTENTIONAL STEPS TOWARDS IT."], // page: closing band
} as const;

export type IconName = (typeof COPY.cards)[number]["icon"];

// ── look (from src/app/globals.css) ─────────────────────────────────────────
export const COLORS = {
  bg: "#0b0b0c", // --color-ink
  white: "#ffffff",
  dim: "rgba(255,255,255,0.62)",
  faint: "rgba(255,255,255,0.14)",
  ember: "#ffc46b", // .embers span (Fresh Fire embers, the site's only warm colour)
  emberGlow: "rgb(255 128 32)", // .embers box-shadow
  houseBlue: "#0b57de", // --color-brass, used only on the Register pill
};

export const FONTS = {
  display: "Anton, 'Arial Narrow', sans-serif", // .display
  sans: "'General Sans', system-ui, sans-serif", // body
  mono: "'JetBrains Mono', ui-monospace, monospace", // .eyebrow
};

// ── timing (30 fps) ─────────────────────────────────────────────────────────
export const FPS = 30;

/** Scene lengths in frames; their sum is the video length (750 = 25 s). */
export const SCENES = {
  hook: 90, //        0 –  89   0:00–0:03
  tension: 90, //    90 – 179   0:03–0:06
  reveal: 90, //    180 – 269   0:06–0:09
  experience: 210, // 270 – 479 0:09–0:16 (six cards × 35 frames)
  rhythm: 90, //    480 – 569   0:16–0:19
  decision: 90, //  570 – 659   0:19–0:22
  cta: 90, //       660 – 749   0:22–0:25 (holds from 705, 1.5 s)
} as const;

export const CARD_FRAMES = 35;

export const START = (() => {
  let at = 0;
  const out = {} as Record<keyof typeof SCENES, number>;
  for (const key of Object.keys(SCENES) as (keyof typeof SCENES)[]) {
    out[key] = at;
    at += SCENES[key];
  }
  return out;
})();

export const TOTAL_FRAMES = Object.values(SCENES).reduce((sum, n) => sum + n, 0);

/**
 * Sound sync points (global frames). The placeholder bed in
 * public/audio/sgb-bed.wav is built on these by scripts/make-audio.mjs; a
 * replacement track should hit the same frames.
 */
export const SYNC = {
  padIn: 0, //                 ambient pad starts
  hookLine2: 42, //            small hit: "BUT WANTING ISN'T ENOUGH."
  flare: START.tension + 50, // 140: whoosh + flare, "It's time to break it."
  riserFrom: START.tension + 30, // 120: riser builds…
  titleHit: START.reveal + 4, //  184: …into the title hit
  cardTicks: [0, 1, 2, 3, 4, 5].map((i) => START.experience + i * CARD_FRAMES), // 270, 305, 340, 375, 410, 445
  rhythmTicks: START.rhythm, // 480: clock ticks through the rhythm scene
  decisionSwell: START.decision, // 570
  resolve: START.cta, //         660: resolve chord at the CTA
};

/** Each layout is a canvas size plus its safe zones. */
export const LAYOUTS = {
  vertical: { width: 1080, height: 1920, safeTop: 120, safeBottom: 120, side: 90 },
  wide: { width: 1920, height: 1080, safeTop: 80, safeBottom: 80, side: 160 },
} as const;
export type Layout = keyof typeof LAYOUTS;
