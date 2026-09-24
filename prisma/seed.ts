import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Position, RoomGender, RoomType, ScheduleType } from "../src/generated/prisma/enums";

const db = new PrismaClient({
  // Prisma Postgres cold-starts a suspended database, which can take over a
  // minute. Without the allowance, seeding fails on the first run of the day.
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    connectionTimeoutMillis: 120_000,
  }),
});

const CAMP_SLUG = "camp-meeting-2027";
const NAIRA = 100;

function at(day: number, hour: number, minute = 0) {
  return new Date(Date.UTC(2027, 1, day, hour - 1, minute)); // WAT = UTC+1
}

async function main() {
  console.log("→ Seeding Dominion House…");

  // ── camp ───────────────────────────────────────────────────────────────────
  // Camp facts are configuration, so re-seeding refreshes them rather than
  // skipping an existing row. Anything the desk owns day to day, registrants,
  // payments, rooms, is never touched here.
  const campFacts = {
    name: "Fresh Fire Camp Meeting 2027",
    tagline: "Four days at Redemption City. The whole house, one gathering.",
    description:
      "Fresh Fire is where every Dominion House lighthouse comes together, four days of teaching, prayer and worship at Redemption City that set the direction for the year.",
    venue: "Redemption City",
    startsAt: at(25, 16),
    endsAt: at(28, 13),
    registrationClosesAt: new Date("2027-02-18T23:59:00+01:00"),
    paymentDeadline: new Date("2027-02-18T23:59:00+01:00"),
    installmentsEnabled: true,
    minFirstInstallmentKobo: 10_000 * NAIRA,
  };

  const camp = await db.camp.upsert({
    where: { slug: CAMP_SLUG },
    update: campFacts,
    create: {
      slug: CAMP_SLUG,
      name: "Fresh Fire Camp Meeting 2027",
      theme: null,
      tagline: "Four days at Redemption City. The whole house, one gathering.",
      description:
        "Fresh Fire is where every Dominion House lighthouse comes together, four days of teaching, prayer and worship at Redemption City that set the direction for the year.",
      venue: "Redemption City",
      venueAddress: null,
      startsAt: at(25, 16),
      endsAt: at(28, 13),
      currency: "NGN",
      isActive: true,
      registrationOpensAt: new Date("2026-08-01T00:00:00+01:00"),
      registrationClosesAt: new Date("2027-02-18T23:59:00+01:00"),
      capacity: 1200,
      installmentsEnabled: true,
      minFirstInstallmentKobo: 10_000 * NAIRA,
      paymentDeadline: new Date("2027-02-18T23:59:00+01:00"),
      accommodationEnabled: true,
      requireFullPayForRoom: true,
    },
  });

  // ── pricing ────────────────────────────────────────────────────────────────
  const tiers = [
    { category: "ADULT" as const, label: "Adult", amount: 50_000, ageMin: 20, ageMax: null, sortOrder: 1, description: "Done with university, or 20 and above. Full board, shared accommodation, all sessions." },
    { category: "STUDENT" as const, label: "Campus Student", amount: 35_000, ageMin: 15, ageMax: null, sortOrder: 2, description: "In a tertiary institution, or on NYSC." },
    { category: "TEEN" as const, label: "Teenager", amount: 35_000, ageMin: 13, ageMax: 17, sortOrder: 3, description: "13–17. Supervised block, own track of sessions." },
    { category: "CHILD" as const, label: "Children", amount: 35_000, ageMin: 0, ageMax: 12, sortOrder: 4, description: "0–12. Must be registered with a parent or guardian." },
  ];

  for (const tier of tiers) {
    await db.priceTier.upsert({
      where: { campId_category: { campId: camp.id, category: tier.category } },
      update: {
        amountKobo: tier.amount * NAIRA,
        label: tier.label,
        description: tier.description,
        ageMin: tier.ageMin,
        ageMax: tier.ageMax,
      },
      create: {
        campId: camp.id,
        category: tier.category,
        label: tier.label,
        description: tier.description,
        amountKobo: tier.amount * NAIRA,
        ageMin: tier.ageMin,
        ageMax: tier.ageMax,
        sortOrder: tier.sortOrder,
      },
    });
  }

  // ── rooms ──────────────────────────────────────────────────────────────────
  const roomPlan: {
    block: string;
    prefix: string;
    count: number;
    capacity: number;
    gender: RoomGender;
    type: RoomType;
    minPosition?: Position;
  }[] = [
    { block: "Carmel", prefix: "C", count: 6, capacity: 2, gender: "MIXED", type: "PRIVATE", minPosition: "CAMPUS_PASTOR" },
    { block: "Eden", prefix: "E", count: 8, capacity: 4, gender: "MALE", type: "SHARED", minPosition: "TEAM_COORDINATOR" },
    { block: "Hermon", prefix: "H", count: 8, capacity: 4, gender: "FEMALE", type: "SHARED", minPosition: "TEAM_COORDINATOR" },
    { block: "Zion", prefix: "Z", count: 10, capacity: 12, gender: "MALE", type: "DORMITORY" },
    { block: "Bethel", prefix: "B", count: 10, capacity: 12, gender: "FEMALE", type: "DORMITORY" },
    { block: "Olive", prefix: "O", count: 6, capacity: 6, gender: "MIXED", type: "FAMILY" },
  ];

  for (const plan of roomPlan) {
    for (let index = 1; index <= plan.count; index += 1) {
      const name = `${plan.prefix}${String(index).padStart(2, "0")}`;
      await db.room.upsert({
        where: { campId_block_name: { campId: camp.id, block: plan.block, name } },
        update: { minPosition: plan.minPosition ?? null },
        create: {
          campId: camp.id,
          block: plan.block,
          name,
          capacity: plan.capacity,
          gender: plan.gender,
          type: plan.type,
          minPosition: plan.minPosition ?? null,
          floor: index <= plan.count / 2 ? "Ground" : "Upper",
        },
      });
    }
  }

  // ── schedule ───────────────────────────────────────────────────────────────
  const schedule: {
    day: number;
    start: [number, number];
    end?: [number, number];
    title: string;
    type: ScheduleType;
    speaker?: string;
    location?: string;
    description?: string;
  }[] = [
    // Thursday 25, arrival
    { day: 25, start: [12, 0], end: [16, 0], title: "Arrival & camp check-in", type: "LOGISTICS", location: "Main Gate", description: "Scan your ticket at the gate, collect your wristband and room key." },
    { day: 25, start: [17, 0], end: [18, 0], title: "Camp dinner", type: "MEAL", location: "Dining Hall" },
    { day: 25, start: [19, 0], end: [21, 30], title: "Opening night", type: "SERVICE", location: "Main Tent" },
    // Friday 26
    { day: 26, start: [5, 30], end: [6, 30], title: "Morning prayer", type: "PRAYER", location: "Prayer Ground" },
    { day: 26, start: [7, 0], end: [8, 0], title: "Breakfast", type: "MEAL", location: "Dining Hall" },
    { day: 26, start: [9, 0], end: [11, 0], title: "Teaching I", type: "SESSION", location: "Main Tent" },
    { day: 26, start: [11, 30], end: [13, 0], title: "Breakouts: Leaders, Campus, Teens", type: "BREAKOUT", location: "Breakout Halls" },
    { day: 26, start: [13, 30], end: [14, 30], title: "Lunch", type: "MEAL", location: "Dining Hall" },
    { day: 26, start: [16, 0], end: [17, 30], title: "Camp games", type: "ACTIVITY", location: "Field" },
    { day: 26, start: [19, 0], end: [22, 0], title: "Night of worship", type: "SERVICE", location: "Main Tent" },
    // Saturday 27
    { day: 27, start: [5, 30], end: [6, 30], title: "Morning prayer", type: "PRAYER", location: "Prayer Ground" },
    { day: 27, start: [7, 0], end: [8, 0], title: "Breakfast", type: "MEAL", location: "Dining Hall" },
    { day: 27, start: [9, 0], end: [11, 0], title: "Teaching II", type: "SESSION", location: "Main Tent" },
    { day: 27, start: [11, 30], end: [13, 0], title: "Departmental clinics", type: "BREAKOUT", location: "Breakout Halls" },
    { day: 27, start: [13, 30], end: [14, 30], title: "Lunch", type: "MEAL", location: "Dining Hall" },
    { day: 27, start: [15, 0], end: [17, 0], title: "Baptism", type: "ACTIVITY", location: "Waterside" },
    { day: 27, start: [19, 0], end: [23, 0], title: "Impartation night", type: "SERVICE", location: "Main Tent" },
    // Sunday 28, close
    { day: 28, start: [5, 30], end: [6, 30], title: "Morning prayer", type: "PRAYER", location: "Prayer Ground" },
    { day: 28, start: [8, 0], end: [10, 30], title: "Closing service & commissioning", type: "SERVICE", location: "Main Tent" },
    { day: 28, start: [11, 0], end: [13, 0], title: "Departure", type: "LOGISTICS", location: "Main Gate" },
  ];

  const existingSchedule = await db.scheduleItem.count({ where: { campId: camp.id } });
  if (existingSchedule === 0) {
    let order = 0;
    for (const item of schedule) {
      await db.scheduleItem.create({
        data: {
          campId: camp.id,
          day: new Date(Date.UTC(2027, 1, item.day)),
          startsAt: at(item.day, item.start[0], item.start[1]),
          endsAt: item.end ? at(item.day, item.end[0], item.end[1]) : null,
          title: item.title,
          description: item.description ?? null,
          speaker: item.speaker ?? null,
          location: item.location ?? null,
          type: item.type,
          sortOrder: order++,
        },
      });
    }
  }

  // ── staff ──────────────────────────────────────────────────────────────────
  const staff = [
    { name: "Camp Administrator", email: "admin@dominionhouse.org", role: "SUPER_ADMIN" as const, password: "DominionHouse2027!" },
    { name: "Finance Desk", email: "finance@dominionhouse.org", role: "FINANCE" as const, password: "DominionHouse2027!" },
    { name: "Registration Desk", email: "registration@dominionhouse.org", role: "REGISTRATION" as const, password: "DominionHouse2027!" },
  ];

  for (const person of staff) {
    await db.adminUser.upsert({
      where: { email: person.email },
      update: { name: person.name, role: person.role, isActive: true },
      create: {
        name: person.name,
        email: person.email,
        role: person.role,
        passwordHash: await bcrypt.hash(person.password, 10),
      },
    });
  }

  // ── announcements ──────────────────────────────────────────────────────────
  const announcementCount = await db.announcement.count({ where: { campId: camp.id } });
  if (announcementCount === 0) {
    await db.announcement.create({
      data: {
        campId: camp.id,
        title: "What to pack",
        body: "Evenings get cool, so bring a jacket.\n\nAlso pack: a torch, a refillable water bottle, your own toiletries, sandals for the shower block, and a notebook. Bedding is provided.",
        isPinned: true,
        publishedAt: new Date(),
      },
    });
  }

  // ── hero gallery ───────────────────────────────────────────────────────────
  // Placeholder stock footage, chosen only because these URLs are served with
  // CORS headers (required to upload a video frame to WebGL). Swap them for the
  // church's own footage at /admin/content, nothing here is vetted for content.
  const heroMedia = [
    { title: "Worship", videoUrl: "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4" },
    { title: "The Word", videoUrl: "https://videos.pexels.com/video-files/2278095/2278095-hd_1920_1080_30fps.mp4" },
    { title: "Prayer", videoUrl: "https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_25fps.mp4" },
    { title: "Community", videoUrl: "https://videos.pexels.com/video-files/4114797/4114797-hd_1920_1080_25fps.mp4" },
    { title: "Missions", videoUrl: "https://videos.pexels.com/video-files/2098989/2098989-hd_1920_1080_30fps.mp4" },
    { title: "Discipleship", videoUrl: "https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4" },
    { title: "Serving", videoUrl: "https://videos.pexels.com/video-files/6981411/6981411-hd_1920_1080_25fps.mp4" },
    { title: "Gathering", videoUrl: "https://videos.pexels.com/video-files/3255275/3255275-hd_1920_1080_25fps.mp4" },
  ];

  if ((await db.siteMedia.count()) === 0) {
    for (const [index, media] of heroMedia.entries()) {
      await db.siteMedia.create({
        data: {
          placement: "HERO_GALLERY",
          title: media.title,
          videoUrl: media.videoUrl,
          sortOrder: index,
        },
      });
    }
  }

  // ── camp depth cards ───────────────────────────────────────────────────────
  // Photos live in public/camp/, optimised to 1200x1600. No captions are shown.
  const campCards = [
    { title: "Teaching", imageUrl: "/camp/teaching.jpg" },
    { title: "Worship", imageUrl: "/camp/worship.jpg" },
    { title: "Prayer", imageUrl: "/camp/prayer.jpg" },
    { title: "Breakouts", imageUrl: "/camp/breakouts.jpg" },
    { title: "Impartation", imageUrl: "/camp/impartation.jpg" },
  ];

  if ((await db.siteMedia.count({ where: { placement: "CAMP_CARDS" } })) === 0) {
    for (const [index, card] of campCards.entries()) {
      await db.siteMedia.create({
        data: {
          placement: "CAMP_CARDS",
          title: card.title,
          imageUrl: card.imageUrl,
          sortOrder: index,
        },
      });
    }
  }

  console.log("✓ Camp:", camp.name);
  console.log("✓ Hero cards:", await db.siteMedia.count({ where: { placement: "HERO_GALLERY" } }));
  console.log("✓ Camp cards:", await db.siteMedia.count({ where: { placement: "CAMP_CARDS" } }));
  console.log("✓ Rooms:", await db.room.count({ where: { campId: camp.id } }));
  console.log("✓ Schedule items:", await db.scheduleItem.count({ where: { campId: camp.id } }));
  console.log("✓ Staff logins: admin@dominionhouse.org / DominionHouse2027!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
