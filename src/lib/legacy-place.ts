/**
 * Legacy Place and the Angel Partners covenant: the words and figures on
 * /give. The amount raised so far is set in the admin (Partners), not here.
 *
 * Links left empty hide their button until there's somewhere real to go.
 */

export const LEGACY_LINKS = {
  visionVideo: "",
  walkthrough3d: "",
  testimoniesVideo: "",
} as const;

/** The seed goal (commencement phase) and the full estimate, in naira. */
export const LEGACY_SEED_GOAL_NAIRA = 250_000_000;
export const LEGACY_TOTAL_COST_NAIRA = 4_000_000_000;
/** Shown until the admin records a figure. */
export const LEGACY_DEFAULT_RAISED_NAIRA = 45_000_000;
export const LEGACY_PARTNER_TARGET = 500;

export const LEGACY_MILESTONES = ["Land secured", "3D design ready", "51 interns graduated"] as const;

export const LEGACY_WHY = [
  "Construction doesn’t move on inspiration; it moves on consistency.",
  "Training pipelines require planning, not last-minute pressure.",
  "Stable monthly partnership turns vision into execution.",
] as const;

export const LEGACY_SPACES = [
  { name: "Training & lecture spaces", body: "Equipping young minds with biblical truth." },
  { name: "Dormitories", body: "For discipleship and community living." },
  { name: "Prayer spaces", body: "Dedicated to spiritual formation." },
  { name: "Tech & language labs", body: "Modern skills for modern missions." },
  { name: "Worship spaces", body: "Alignment and encounter rooms." },
  { name: "Sending infrastructure", body: "Logistics to reach the nations." },
] as const;

export const LEGACY_MANDATE_STEPS = [
  { name: "Train missionaries", body: "At Legacy Place" },
  { name: "Send them out", body: "To campuses and communities" },
  { name: "Multiply disciples", body: "Impact 1,000,000 lives" },
] as const;

export const LEGACY_IMPACT = [
  { value: "51", label: "Mission interns graduated" },
  { value: "10k+", label: "Lives reached in 10 months" },
  { value: "15", label: "Outreach activations" },
  { value: "3", label: "Communities impacted" },
] as const;

export const LEGACY_INTERN_QUOTE = {
  text: "MIP was such a huge blessing to my life. I would say for me it stretched my capacity on all levels and I learnt by theory, by practice, by failing severally and by trying again which means I never really failed. I became more resilient, stronger, audacious and mostly clear about the rest of my life. I have found the one thing I want to live for and that's what I am going to spend the rest of my life doing.",
  name: "Eddie",
  role: "MIP graduate",
} as const;

export const LEGACY_PHASES = ["Training infrastructure", "Utilities backbone", "Missions operations"] as const;

export const LEGACY_COVENANT_STEPS = [
  { name: "Choose your amount", body: "A monthly seed that works for you, from ₦20,000 or $20." },
  { name: "Activate monthly giving", body: "Set up once with your card through Paystack; it renews each month." },
  { name: "Receive Kingdom updates", body: "Monthly reports, prayer covering and partner community access." },
] as const;

export const LEGACY_BENEFITS = [
  "Name on the Founding 500 Wall (opt-in)",
  "Invitation to Legacy Place dedication moments",
  "Angel Partners brooch and merch",
  "Dedicated prophetic prayers and consistent reporting",
  "Access to the Angel Partners WhatsApp community",
  "Semester briefings with Rev. Dotun",
] as const;

/**
 * Draft answers written from the covenant as described on the page; have the
 * partnership team confirm them before launch.
 */
export const LEGACY_FAQ = [
  {
    q: "Can I pause if life happens?",
    a: "Yes. This is a covenant invitation, with grace for life's seasons. Write to the partnership team and we'll pause or stop your monthly giving, no questions asked.",
  },
  {
    q: "How will funds be used?",
    a: "Toward Legacy Place: first the ₦250 million seed goal that commences construction, then the phases that follow (training infrastructure, utilities, and missions operations), with consistent reporting at each step.",
  },
  {
    q: "Can I give from outside Nigeria?",
    a: "Yes. Choose USD and give with an international card. If your card isn't accepted, talk to the partnership team and we'll help you give another way.",
  },
  {
    q: "Is there accountability?",
    a: "Yes. Angel Partners receive monthly reports on how Legacy Place is progressing and how funds have been used, and semester briefings with Rev. Dotun.",
  },
  {
    q: "Can I visit Legacy Place?",
    a: "Angel Partners are invited to Legacy Place dedication moments. To arrange a visit, talk to the partnership team.",
  },
] as const;
