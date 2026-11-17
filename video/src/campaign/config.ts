/**
 * The campaign teaser: a second Spiritual Growth Bootcamp film in the look of
 * the poster series (bright blue, sky, orange; lime, mustard and cream
 * accents; starbursts, sparkles and squiggles). Copy is word for word from
 * the posters. Change words, dates and timing here.
 */

// ── fill these in ───────────────────────────────────────────────────────────
export const DATES = "29th Nov - 6th Dec, 2026"; // poster 1
export const VENUE = "Online · YouTube & WhatsApp"; // the Bootcamp page
export const CTA_URL = "dominionhouse.org/spiritual-growth-bootcamp";
export const CTA_LABEL = "Register now";

// ── copy (posters) ──────────────────────────────────────────────────────────
export const CAMPAIGN = {
  loop: {
    // poster 5
    headline: 'Tired of promising God "never again" on Sunday—only to fall back into the same cycle by Tuesday?',
    accent: ["never", "again"],
    sub: "……break the loop of secret struggles, spiritual numbness, and performance-based faith.",
    days: ["Sunday", "Tuesday"],
  },
  slip: {
    // poster 2
    headline: "Your Spiritual Growth is not a betting slip",
    accent: ["betting", "slip"],
    sub: "It won't happen by chance",
    header: "WAGER / LIFE",
    rows: [
      { label: "INTENSE PRAYER LIFE", odds: "1.90" },
      { label: "INTIMACY WITH SPIRIT", odds: "2.50" },
      { label: "A VIBRANT COMMUNITY", odds: "1.50" },
      { label: "AN EXCELLENT WORD LIFE", odds: "1.50" },
    ],
    stamp: "Not by chance",
  },
  fuel: {
    // poster 3
    headline: "Your Prayer Life needs a refuel",
    accent: ["refuel"],
  },
  checklist: {
    // poster 4
    headline: "Your relationship with God shouldn't be left",
    accentWord: "unchecked",
    sub: "Get on a journey of knowing God",
    title: "My New Year Checklist",
    items: ["Get 3 new pairs of shoes", "Get a new job/promotion", "Start a side hustle", "Change my house", "Develop an intense prayer life."],
  },
  key: {
    // poster 1
    tag: "One-week",
    title: "Spiritual Growth",
    titleBig: "Bootcamp",
    tagline: "From Spiritual Dryness to Awakening",
    age: ["For youths", "aged", "20-27"],
    pillPink: "For the believer who knows there's more",
    pillOrange: "Your spiritual life deserves more than Sundays",
  },
  signUp: "Sign up for the", // posters 2–5
};

// ── colours (sampled from the posters; the two blues are the site's) ────────
export const C = {
  royal: "#0b57de", // site --color-brass, posters 4–5
  royalLight: "#2a6ff0",
  sky: "#229bf2", // site --color-skyblue, posters 1–2
  skyLight: "#45b0f7",
  orange: "#ffab00", // poster 3
  orangeLight: "#ffc21a",
  red: "#f2482a",
  lime: "#e6f65a",
  mustard: "#fbb432",
  cream: "#fde3a7",
  cyan: "#6fe6f7",
  pink: "#ff3fb4",
  pillOrange: "#ff6a13",
  navy: "#020a1c",
  white: "#ffffff",
};

// ── timing (30 fps; the bed is 120 bpm, so one beat = 15 frames) ────────────
export const BEAT = 15;
export const OVERLAP = 12; // each scene opens over the last one with a round wipe

/** Scenes as [start, length] in frames; 810 frames = 27 s. */
export const SHOTS = {
  loop: [0, 150],
  slip: [138, 162],
  fuel: [288, 132],
  checklist: [408, 144],
  key: [540, 165],
  signup: [693, 117],
} as const;
export const CAMPAIGN_FRAMES = 810;

/** The "Sign up for the … Bootcamp" bar rides along the poster scenes. */
export const BAR = { in: SHOTS.slip[0] + 18, out: SHOTS.key[0] - 4 };

/**
 * Sound sync points (frames) for public/audio/sgb-campaign-bed.wav, built by
 * scripts/make-campaign-audio.mjs. A real track should hit the same frames.
 */
export const CAMPAIGN_SYNC = {
  beatStart: 0, //           120 bpm groove from the top
  wipes: [138, 288, 408, 540, 693], // a whoosh on every round wipe
  stamp: SHOTS.slip[0] + 100, //  "Not by chance" stamp thud
  needleDrop: SHOTS.fuel[0] + 20, // falling tone as the gauge empties
  refuel: SHOTS.fuel[0] + 96, //  rising tone as it fills
  ticks: [0, 1, 2, 3].map((i) => SHOTS.checklist[0] + 22 + i * 9), // checklist dings
  finalTick: SHOTS.checklist[0] + 118, // the prayer-life box gets its tick
  titleHit: SHOTS.key[0] + 14, // BOOTCAMP lands
  outro: SHOTS.signup[0], //     last bars, ends on a hit at CAMPAIGN_FRAMES - 30
};
