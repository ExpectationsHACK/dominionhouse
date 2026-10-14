/**
 * Replaces the active camp's programme with the Fresh Fire 2027 schedule
 * ("Full Schedule.pdf" from the camp team), corrects the camp tagline, and
 * sets camp to end when the programme does.
 *
 *   npx tsx scripts/replace-schedule.ts            # dry run: prints the programme, writes nothing
 *   npx tsx scripts/replace-schedule.ts --commit   # replaces it (the live site, same database)
 *
 * Times are Lagos time. Each day's sessions are listed in the order of the
 * document; "PV" in it is Pastor Vincent.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { ScheduleType } from "../src/generated/prisma/enums";

const TAGLINE = "Four days of Impartation, Immersion, Realignment and Reawakening.";
/** The sent-forth blessing closes camp at 2pm on the Sunday. */
const ENDS_AT = new Date("2027-02-28T14:00:00+01:00");

type Item = [start: string, end: string | null, title: string, speaker: string | null, type: ScheduleType, description?: string];

const SOZO = "Sozo Worship";

const DAYS: { date: string; items: Item[] }[] = [
  {
    date: "2027-02-25", // Thursday, 3pm to 9pm
    items: [
      ["15:00", "15:30", "Call to worship", SOZO, "SERVICE"],
      ["15:30", "16:00", "Prayer sessions", null, "PRAYER", "Minister Jumoke Oladosu (3:30), Pastor David Richard (3:40) and Pastor Victoria Allwell (3:50)."],
      ["16:00", "16:20", "Worship", SOZO, "SERVICE"],
      ["16:20", "16:45", "Camp orientation", "Pastor Isoa", "LOGISTICS", "Pastor Isoa welcomes Rev Dotun."],
      ["16:45", "18:15", "Welcome charge", "Rev Dotun Arifalo", "SESSION"],
      ["18:15", "18:25", "Special worship and camp song", SOZO, "SERVICE"],
      ["18:25", "18:30", "Welcoming Pastor Vincent", "Pastor Isoa", "SERVICE"],
      ["18:30", "20:55", "Word session", "Pastor Vincent Arifalo", "SESSION"],
      ["20:55", "21:00", "Announcements", "Pastor JT", "LOGISTICS"],
      ["21:00", null, "Dinner and lights out", null, "MEAL"],
    ],
  },
  {
    date: "2027-02-26", // Friday
    items: [
      ["06:00", "06:30", "Bath and freshen up", "Hostel and block captains", "LOGISTICS"],
      ["06:30", "06:50", "Opening prayer sessions", null, "PRAYER", "Director Joy Malik (6:30) and Director Afopefolorun Akanbi-Badru (6:40)."],
      ["06:50", "07:05", "Worship", SOZO, "SERVICE"],
      ["07:05", "07:10", "Welcoming Pastor Ayo", "Pastor Olamide Jokosenumi", "SERVICE"],
      ["07:10", "08:40", "First word", "Pastor Ayomide Olofinjana", "SESSION"],
      ["08:40", "08:50", "Worship interlude", SOZO, "SERVICE"],
      ["08:50", "11:20", "Second word", "Rev Dotun Arifalo", "SESSION"],
      ["11:20", "11:25", "Announcements", "Pastor Damilola Daramola", "LOGISTICS"],
      ["11:25", null, "Brunch", null, "MEAL"],
      ["13:30", "14:00", "Call to worship", SOZO, "SERVICE"],
      ["14:00", "14:10", "Opening prayer", "Captain Mofe Arifalo", "PRAYER"],
      ["14:10", "14:20", "Worship", SOZO, "SERVICE"],
      ["14:20", "14:25", "Welcoming Pastor Vincent", "Pastor Damilola Daramola", "SERVICE"],
      ["14:25", "16:50", "Word session", "Pastor Vincent Arifalo", "SESSION"],
      ["16:50", "17:00", "Announcements and offering", "Pastor Bisi", "LOGISTICS"],
      ["19:45", "20:00", "Call to worship", SOZO, "SERVICE"],
      ["20:00", "20:15", "Prayer session", "Director Wuraola Olusanya", "PRAYER"],
      ["20:15", "20:25", "Worship", SOZO, "SERVICE"],
      ["20:25", "20:30", "Welcoming Rev Dotun", "Pastor Omolade Daramola", "SERVICE"],
      ["20:30", "23:30", "Word and flow", "Rev Dotun Arifalo", "SESSION"],
      ["23:30", "23:35", "Announcements", "Pastor Bimpe Adebisi", "LOGISTICS"],
    ],
  },
  {
    date: "2027-02-27", // Saturday
    items: [
      ["06:00", "06:45", "Bath and freshen up", "Hostel and block captains", "LOGISTICS"],
      ["06:15", "07:00", "Call to worship", SOZO, "SERVICE"],
      ["07:00", "07:10", "Opening prayer", "Pastor Omolade Daramola", "PRAYER"],
      ["07:10", "07:25", "Worship", SOZO, "SERVICE"],
      ["07:25", "07:30", "Welcoming Pastor Isoa", "Pastor Yeni", "SERVICE"],
      ["07:30", "09:00", "First word", "Pastor Isoa", "SESSION"],
      ["09:00", "09:10", "Special ministration", SOZO, "SERVICE"],
      ["09:10", "09:15", "Welcoming Pastor Vincent", "Pastor Damilola Daramola", "SERVICE"],
      ["09:15", "11:45", "Second word", "Pastor Vincent Arifalo", "SESSION"],
      ["11:45", "11:50", "Announcements", "Pastor JT", "LOGISTICS"],
      ["11:50", null, "Brunch", null, "MEAL"],
      ["13:30", "14:00", "Call to worship", SOZO, "SERVICE"],
      ["14:00", "14:10", "Opening prayer", "Minister Victoria Yomo", "PRAYER"],
      ["14:10", "15:50", "MIP graduation ceremony", null, "ACTIVITY"],
      ["15:50", "17:10", "MIP induction", null, "ACTIVITY"],
      ["17:10", "17:20", "Announcements and offering", "Pastor Bimpe Adebisi", "LOGISTICS"],
      ["17:20", null, "Break and dinner", null, "MEAL"],
      ["19:45", "20:00", "Call to worship", SOZO, "SERVICE"],
      ["20:00", "20:10", "Opening prayer", "Minister Blessing James", "PRAYER"],
      ["20:10", "20:25", "Worship", SOZO, "SERVICE"],
      ["20:25", "20:30", "Welcoming Pastor Vincent", "Pastor Damilola Daramola", "SERVICE"],
      ["20:30", null, "Word and flow", "Pastor Vincent and Rev Dotun Arifalo", "SESSION", "Followed by announcements from Pastor JT, then lights out."],
    ],
  },
  {
    date: "2027-02-28", // Sunday
    items: [
      ["08:45", "09:00", "Call to worship", SOZO, "SERVICE"],
      ["09:00", "09:10", "Opening prayer", "Pastor Yeni Manuel", "PRAYER"],
      ["09:10", "09:30", "Worship and high praise", SOZO, "SERVICE"],
      ["09:30", "09:40", "Welcome charge", "Pastor Tutu", "SERVICE", "Pastor Tutu brings up Pastor Vincent."],
      ["09:45", "11:15", "Word session", "Pastor Vincent Arifalo", "SESSION"],
      ["11:15", "11:25", "Special song ministration", "Pastor Ayo and Sozo Worship", "SERVICE"],
      ["11:25", "11:35", "Offering", "Pastor Bisi", "SERVICE", "The camp song plays while the offering is taken."],
      ["11:35", "12:05", "Commission charge and call to partnership", "Rev Dotun Arifalo", "SESSION"],
      ["12:05", "13:45", "Commissioning and ordination ceremony", "All Senior Pastors", "ACTIVITY", "The commission medley plays during the ordination, led by Pastor Ayo and Pastor Tutu."],
      ["13:45", "13:55", "Announcements, appreciation and closing", "Pastor Isoa", "LOGISTICS"],
      ["13:55", "14:00", "Sent forth blessings", "Pastor Vincent Arifalo", "SERVICE"],
    ],
  },
];

/** A Lagos wall-clock time (UTC+1, no daylight saving) as a Date. */
const lagos = (date: string, time: string) => new Date(`${date}T${time}:00+01:00`);

async function main() {
  const commit = process.argv.includes("--commit");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

  const camp = await db.camp.findFirstOrThrow({ where: { isActive: true } });
  const existing = await db.scheduleItem.count({ where: { campId: camp.id } });

  // Already imported (October 2026), and the admin desk has corrected items
  // since: replacing would undo their edits. --force only if that's intended.
  const edited = (await db.scheduleItem.findMany({ where: { campId: camp.id } })).filter(
    (item) => item.updatedAt.getTime() - item.createdAt.getTime() > 60_000,
  );
  if (commit && edited.length > 0 && !process.argv.includes("--force")) {
    console.log(`${edited.length} programme items were edited in the admin since they were added:`);
    for (const item of edited) console.log(`  ${item.title}${item.speaker ? `, ${item.speaker}` : ""}`);
    console.log("Replacing would undo those edits. Nothing written; add --force to replace anyway.");
    await db.$disconnect();
    return;
  }

  let sortOrder = 0;
  const rows = DAYS.flatMap(({ date, items }) =>
    items.map(([start, end, title, speaker, type, description]) => ({
      campId: camp.id,
      day: lagos(date, "00:00"),
      startsAt: lagos(date, start),
      endsAt: end ? lagos(date, end) : null,
      title,
      speaker,
      type,
      description: description ?? null,
      sortOrder: sortOrder++,
    })),
  );

  for (const { date, items } of DAYS) {
    console.log(`\n${new Date(`${date}T12:00:00+01:00`).toDateString()}`);
    for (const [start, end, title, speaker] of items) {
      console.log(`  ${start}${end ? `–${end}` : "      "}  ${title}${speaker ? `, ${speaker}` : ""}`);
    }
  }
  console.log(`\n${camp.name}: ${existing} items now → ${rows.length} new.`);
  console.log(`Tagline: "${camp.tagline}" → "${TAGLINE}"`);
  console.log(`Camp ends: ${camp.endsAt.toISOString()} → ${ENDS_AT.toISOString()}`);

  if (!commit) {
    console.log("\nDry run, nothing written. Run again with --commit to replace the programme.");
  } else {
    await db.$transaction([
      db.scheduleItem.deleteMany({ where: { campId: camp.id } }),
      db.scheduleItem.createMany({ data: rows }),
      db.camp.update({ where: { id: camp.id }, data: { tagline: TAGLINE, endsAt: ENDS_AT } }),
    ]);
    console.log("\nProgramme replaced and tagline corrected.");
  }
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
