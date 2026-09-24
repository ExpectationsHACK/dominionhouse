/**
 * Church facts, straight from the Dominion House vision and locations documents.
 *
 * This is the single source for identity copy across the site. Nothing here is
 * invented, where the documents are silent (service times, leadership names),
 * the value is null and the UI says so rather than filling the gap.
 */

export const CHURCH = {
  name: "Dominion House",
  strapline: "The church that never sleeps",
  descriptor: "A new frontier church raising kingdom leaders",
  mandateScripture: {
    reference: "Habakkuk 2:14",
    text: "For the earth will be filled with the knowledge of the glory of the Lord, as the waters cover the sea.",
  },
} as const;

export const VISION =
  "Dominion House is a disciple-making movement with a vision to raise kingdom leaders; a people of purpose, power, and passion, empowered by the Word and Spirit to reign in life and to start a Christ-centered community in every territory.";

export const VISION_SUPPORT =
  "We are dedicated to reaching the world with the boundless love of God one person and one community at a time.";

export const ABOUT =
  "We are a new frontier church with a vision to raise kingdom leaders, a people of purpose, passion, and power, who are empowered by God's Word and Spirit to reign in life as kings, taking territories and establishing the rulership of Christ in every place.";

export const MANDATE =
  "We are a global missional church movement with a mandate to fill the earth with the knowledge of God's glory as the waters cover the seas.";

export const MANDATE_OBJECTIVE =
  "Our objective is to infiltrate the world system one person, one campus, and one community at a time with the gospel of Christ, as we rise from one training to another until the earth is filled with the knowledge of the glory of God; initiating a viral evangelism, discipleship, and church planting movement.";

// ── the 5D strategy ──────────────────────────────────────────────────────────

export const STRATEGY = [
  {
    key: "D1",
    name: "Discover",
    summary: "Your God-given gifts and mandate",
    body: "To help you DISCOVER your God-given gifts and mandate. We strategically bring men out from darkness into the Kingdom of God through evangelism, leading to the mass salvation of souls.",
  },
  {
    key: "D2",
    name: "Develop",
    summary: "Trained for the harvest",
    body: "The harvest is ripe, and God needs laborers. We train men and prepare them to be end-time harvesters as they take their place in destiny and impact the world at large.",
  },
  {
    key: "D3",
    name: "Deploy",
    summary: "A sending church, not a sitting one",
    body: "We are not a sitting church but a sending church. We believe that everyone is a leader and a minister, and so must be equipped to take on the Great Commission, which is to go.",
    scripture: "Matthew 28:18",
  },
  {
    key: "D4",
    name: "Duplicate",
    summary: "Disciples who make disciples",
    body: "We reproduce ourselves in others. We duplicate disciples, duplicate leaders, duplicate teams, and duplicate communities, ensuring the continuity of the vision through generations.",
    scripture: "2 Timothy 2:2",
  },
  {
    key: "D5",
    name: "Dominate",
    summary: "In your sphere of influence",
    body: "Empowering you to DOMINATE in your sphere of influence for God's glory. We raise leaders who transform their communities and the world, walking in God-given authority and expanding His Kingdom.",
  },
] as const;

// ── the seven pillars ────────────────────────────────────────────────────────

export const PILLARS = [
  {
    number: "01",
    name: "Love",
    subtitle: "Our atmosphere and our posture",
    body: "Love is our first culture because God is love, and everything He builds must be built on love. We love God passionately, love people sacrificially, and create an environment where every soul feels seen, valued and protected.",
    points: [
      "We love God passionately and deeply",
      "We love people genuinely and sacrificially",
      "We forgive quickly, correct lovingly, and support consistently",
      "We welcome everyone without judgment, but disciple them into transformation",
    ],
    pull: "Our love is not merely an emotion, it is a commitment.",
  },
  {
    number: "02",
    name: "Word",
    subtitle: "Our foundation and intelligence system",
    body: "The Word of God is our final authority. It shapes our thinking, directs our choices, and fuels our spiritual growth.",
    points: [
      "We feed on the Word daily",
      "We teach the Word with depth and revelation",
      "We build leaders who think scripturally and act biblically",
      "We judge our experiences through the Word, not the other way around",
    ],
    pull: "A Wordless Christian is a powerless Christian. A Wordless church is a directionless church.",
  },
  {
    number: "03",
    name: "Power",
    subtitle: "Prayer, fasting and the supernatural",
    body: "Dominion House is a house of power, not religious performance, but spiritual authority. We pray intensely and corporately, we fast as a lifestyle, and we expect miracles.",
    points: [
      "Prayer is our breath, not an event",
      "We keep the weekly one-day fruit-fast, Wednesday to Thursday morning",
      "We walk in spiritual gifts and confront darkness",
      "We heal the sick, cast out devils, and demonstrate the Kingdom with power",
    ],
    pull: "A powerless church cannot transform a power-drunk world.",
  },
  {
    number: "04",
    name: "Purpose",
    subtitle: "Our direction and assignment",
    body: "Everyone has a seed of greatness within, waiting to be cultivated. Every believer has a purpose, a higher calling, and a divine assignment. We do not raise spectators, we raise contributors.",
    points: [
      "Everyone is gifted",
      "Everyone is called",
      "Everyone must grow and must serve",
      "Everyone must produce fruit",
    ],
    pull: "Purpose gives your life direction, your service meaning, and your sacrifice value.",
  },
  {
    number: "05",
    name: "Missions",
    subtitle: "Evangelism and discipleship",
    body: "This is the heartbeat of Dominion House. We exist for the lost. We evangelize intentionally, follow up diligently, and gather people into God's family with passion and urgency, then we train, mentor and grow them into maturity.",
    points: [
      "We are a soul-winning movement",
      "We follow up diligently, not occasionally",
      "We reproduce disciples who reproduce disciples, the Jesus model",
    ],
    pull: "A church that does not evangelize will fossilize.",
  },
  {
    number: "06",
    name: "Giving",
    subtitle: "Kingdom stewardship",
    body: "Giving is who we are, not just what we do. We give because we love God, honour God, trust God, and partner with His Kingdom. We do not manipulate people to give, we teach and disciple them into generosity.",
    points: [
      "Weekly offerings",
      "Sacrificial giving",
      "Monthly partnerships",
      "Giving to our leaders and pastors",
    ],
    pull: "Generosity is the mark of spiritual maturity.",
  },
  {
    number: "07",
    name: "Leadership",
    subtitle: "Vision, character, followership and honour",
    body: "We are a leadership movement. Everyone is trained to lead through service, responsibility and growth. Leadership here is not about position, it is about transformation, servanthood and responsibility.",
    points: [
      "Vision: we think big and dream God-sized dreams",
      "Character: we walk in integrity and reject shortcuts",
      "Followership: before we lead others, we follow well",
      "Honour: honour opens the flow of grace, favour and power",
    ],
    pull: "Leaders who cannot follow cannot be trusted to lead.",
  },
] as const;

// ── foundational scriptures ──────────────────────────────────────────────────

export const SCRIPTURES = [
  {
    reference: "Isaiah 2:2–3",
    version: "NKJV",
    text: "Now it shall come to pass in the latter days that the mountain of the Lord's house shall be established on the top of the mountains… And all nations shall flow to it… For out of Zion shall go forth the law, and the word of the Lord from Jerusalem.",
  },
  {
    reference: "Matthew 28:19–20",
    version: "NKJV",
    text: "Go therefore and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all things that I have commanded you; and lo, I am with you always, even to the end of the age.",
  },
  {
    reference: "Matthew 24:14",
    version: "NKJV",
    text: "And this gospel of the kingdom will be preached in all the world as a witness to all the nations, and then the end will come.",
  },
] as const;

// ── weekly gatherings ────────────────────────────────────────────────────────

export type Gathering = {
  slug: string;
  name: string;
  day: string;
  time: string;
  where: string;
  host?: string;
  strapline: string;
  body: string[];
  cta?: { label: string; href: string };
};

/** The week, as the house runs it. Straight from the church's own listings. */
export const GATHERINGS: Gathering[] = [
  {
    slug: "morning-dew",
    name: "Morning Dew",
    day: "Every Monday",
    time: "6:00 AM WAT",
    where: "Live on YouTube",
    host: "Rev. Dotun Arifalo",
    strapline: "Start your week in God's presence.",
    body: [
      "Don't just step into a new week. Step into it with God.",
      "Join us every Monday as we gather in prayer, receive the Word, declare God's promises, and receive prophetic and practical instruction to set the tone for the week ahead.",
      "Start strong. Set the foundation. Walk the week with God.",
    ],
  },
  {
    slug: "bible-study",
    name: "Bible Study with PV",
    day: "Every Wednesday",
    time: "7:00 AM",
    where: "Telegram",
    host: "Pst. Vincent Arifalo",
    strapline: "You don't have to figure out God's Word alone.",
    body: [
      "The Bible is filled with truth, but understanding that truth requires more than simply opening its pages. You need to be taught. You need to be grounded. You need to grow.",
      "At Bible Study with PV, we open up the Scriptures, dig into God's Word, and bring understanding to what He has said, line upon line, truth upon truth.",
      "Whether you're just beginning your walk with Christ or hungry to go deeper, there's more of God's Word to discover.",
      "Come. Learn the Word. Grow in truth. Walk in understanding.",
    ],
  },
  {
    slug: "night-of-encounters",
    name: "Night of Encounters",
    day: "Thursdays",
    time: "6:00 PM",
    where: "At your lighthouse",
    strapline: "An evening given to encounter.",
    body: ["Midweek, in person, with the house gathered."],
  },
  {
    slug: "sunday-worship",
    name: "Sunday Worship Experience",
    day: "Sundays",
    time: "10:00 AM",
    where: "At your lighthouse",
    strapline: "The whole house together.",
    body: ["Worship, the Word, and room to respond."],
    cta: { label: "Plan your visit", href: "/locations" },
  },
];

// ── campuses ─────────────────────────────────────────────────────────────────

export type Campus = {
  slug: string;
  name: string;
  region: "Lagos" | "International";
  country: string;
  address: string;
  email: string;
  phones: string[];
};

export const CAMPUSES: Campus[] = [
  {
    slug: "legacy-center",
    name: "Legacy Center",
    region: "Lagos",
    country: "Nigeria",
    address: "246 Ojokoro Road, Eyita, Ikorodu",
    email: "dhapostoliccenter@gmail.com",
    phones: ["+234 707 901 4993"],
  },
  {
    slug: "ikorodu",
    name: "Ikorodu",
    region: "Lagos",
    country: "Nigeria",
    address: "No. 134 Lagos Road, Blue House, Jumofak Bus Stop, Opposite Conoil, Ikorodu",
    email: "dominionhsikorodu@gmail.com",
    phones: ["+234 814 358 5859"],
  },
  {
    slug: "ijegun",
    name: "Ijegun",
    region: "Lagos",
    country: "Nigeria",
    address: "92, Opposite Total Filling Station, Isheri Oshun, Ijegun Road",
    email: "dominionhouseijegunlighthouse@gmail.com",
    phones: ["+234 802 589 3688"],
  },
  {
    slug: "lekki",
    name: "Lekki",
    region: "Lagos",
    country: "Nigeria",
    address:
      "Travel House Hotel Restaurant, Opposite Mega Chicken Ikota, Lekki–Epe Expressway",
    email: "dhislandzone1@gmail.com",
    phones: ["+234 807 758 3695", "+234 803 416 5413"],
  },
  {
    slug: "bode-thomas",
    name: "Bode Thomas",
    region: "Lagos",
    country: "Nigeria",
    address: "6 Akinsemoyin Street, Bode Thomas, Surulere",
    email: "dhbodethomaslh@gmail.com",
    phones: ["+234 816 442 5423"],
  },
  {
    slug: "agric",
    name: "Agric",
    region: "Lagos",
    country: "Nigeria",
    address:
      "18 Oladele Adeniji Street, Off 2nd Mobil Bus Stop, T-HUB beside TOTLAND School",
    email: "dominionhouseagric@gmail.com",
    phones: [],
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    region: "International",
    country: "United Kingdom",
    address: "Beckton Community Centre, 14 East Ham Manor Way, Beckton, London, E6 5NG",
    email: "dhdreamcentre@gmail.com",
    phones: ["+44 7907 970762"],
  },
  {
    slug: "canada",
    name: "Canada",
    region: "International",
    country: "Canada",
    address: "8148 46 Avenue Northwest, Calgary, Alberta",
    email: "cimuofc@gmail.com",
    phones: ["+1 403-519-0835"],
  },
  {
    slug: "trinidad",
    name: "Trinidad",
    region: "International",
    country: "Trinidad and Tobago",
    address:
      "Diego Martin South Community Centre (opposite the former FCB), Diego Martin Main Road",
    email: "dhgczone2@gmail.com",
    phones: ["+1 868 373-9666"],
  },
];

export const LAGOS_CAMPUSES = CAMPUSES.filter((campus) => campus.region === "Lagos");
export const INTERNATIONAL_CAMPUSES = CAMPUSES.filter(
  (campus) => campus.region === "International",
);

/** The Legacy Center is the address and inbox the site defaults to. */
export const HEAD_CAMPUS = CAMPUSES[0];

/** The official website inbox, used wherever the site speaks for the church. */
export const CONTACT_EMAIL = "dominionhs@gmail.com";

/**
 * Lighthouses a registrant can belong to, the campuses, under the name the
 * house uses for them. Asked of adults, teenagers and children.
 */
export const LIGHTHOUSES: string[] = CAMPUSES.map((campus) => campus.name);

/** What the camp registration asks: a Lighthouse, one of the ministries, or a guest. */
export const LIGHTHOUSES_OR_MINISTRIES: string[] = [...LIGHTHOUSES, "IWKB", "Guest"];

/**
 * Campus-fellowship regions, asked of campus students instead of a Lighthouse.
 * Edit this array and every dropdown follows; existing registrations keep
 * whatever they chose at the time.
 */
export const CAMPUS_REGIONS: string[] = [
  "Lagos Private & International Region",
  "LASU Region",
  "LASUSTECH Region",
  "UNILAG Region",
  "Ogun Private & Oyo Region",
  "Ogun Federal Region",
  "Abeokuta Region",
  "Osun/Ondo/Ekiti Private Region",
  "Ondo/Ekiti Federal Region",
  "Osun Federal Region",
  "South East Region",
  "South South Region",
  "North Region",
];

export const COUNTRY_COUNT = new Set(CAMPUSES.map((campus) => campus.country)).size;
