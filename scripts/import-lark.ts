/**
 * Imports the Fresh Fire Camp Meeting 2027 "LARK" form export (.xlsx) as
 * registrants, so the people who registered on the outside form have a camp
 * profile without registering again: they sign in at /portal/login with the
 * email and phone number they gave on the form.
 *
 *   npx tsx scripts/import-lark.ts "<path to the .xlsx>"            # dry run, writes nothing
 *   npx tsx scripts/import-lark.ts "<path to the .xlsx>" --commit   # imports
 *
 * Safe to run again with an updated export: anyone already registered (on the
 * site or by an earlier import) is skipped, never overwritten. No emails are
 * sent. The form didn't ask for gender or an emergency contact, so those are
 * left empty and the camp profile asks for them on first sign-in.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import type { AgeCategory, AgeGroup, HowHeard, Position } from "../src/generated/prisma/enums";
import { qrPayload, registrationCode, ticketCode } from "../src/lib/codes";
import { amountDueKobo } from "../src/lib/pricing";

const SOURCE = "LARK form";

// ── a minimal .xlsx reader: a zip of XML parts ─────────────────────────────────

function unzip(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  // End of central directory: the last record whose signature is 0x06054b50.
  let eocd = buffer.length - 22;
  while (eocd >= 0 && buffer.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("Not a zip file (is this really an .xlsx?)");
  const entries = buffer.readUInt16LE(eocd + 10);
  let at = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < entries; i++) {
    const method = buffer.readUInt16LE(at + 10);
    const compressed = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const local = buffer.readUInt32LE(at + 42);
    const name = buffer.toString("utf8", at + 46, at + 46 + nameLength);
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const data = buffer.subarray(dataStart, dataStart + compressed);
    files.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

const decode = (text: string) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");

function columnIndex(ref: string) {
  let n = 0;
  for (const ch of ref.replace(/\d+/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** The first sheet's rows as arrays of cell text. */
function readFirstSheet(path: string): string[][] {
  const files = unzip(readFileSync(path));
  const shared: string[] = [];
  const strings = files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  for (const si of strings.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    shared.push(decode((si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join("")));
  }
  const sheetName = [...files.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort()[0];
  if (!sheetName) throw new Error("No worksheet found in the file.");
  const sheet = files.get(sheetName)!.toString("utf8");

  const rows: string[][] = [];
  for (const row of sheet.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? []) {
    const cells: string[] = [];
    for (const cell of row.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) ?? []) {
      const ref = /r="([A-Z]+\d+)"/.exec(cell)?.[1];
      if (!ref) continue;
      const type = /t="(\w+)"/.exec(cell)?.[1];
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1];
      const inline = /<is>([\s\S]*?)<\/is>/.exec(cell)?.[1];
      const value =
        type === "s" && raw !== undefined
          ? shared[Number(raw)]
          : type === "inlineStr" && inline
            ? decode(inline.replace(/<[^>]+>/g, ""))
            : raw !== undefined
              ? decode(raw)
              : "";
      cells[columnIndex(ref)] = value;
    }
    rows.push(Array.from(cells, (value) => (value ?? "").trim()));
  }
  return rows;
}

// ── mapping the form's answers onto the camp register ───────────────────────────

const AGE_GROUPS: Record<string, { category: AgeCategory; ageGroup: AgeGroup | null }> = {
  "10 - 17": { category: "TEEN", ageGroup: null },
  "18 - 25": { category: "ADULT", ageGroup: "AGE_18_25" },
  "26 - 35": { category: "ADULT", ageGroup: "AGE_26_35" },
  "36 - 50": { category: "ADULT", ageGroup: "AGE_36_50" },
  "51 - 70": { category: "ADULT", ageGroup: "AGE_51_70" },
};

/** The form's wording for each role, onto the site's positions. */
const POSITIONS: Record<string, Position> = {
  disciple: "DISCIPLE",
  "sub team leader": "POWER_4_LEADER",
  // The site's "Team Co-ordinator" option is TEAM_LEADER (see positions.ts).
  "team coordinator": "TEAM_LEADER",
  "team co-ordinator": "TEAM_LEADER",
  captain: "CAPTAIN",
  captains: "CAPTAIN",
  director: "DIRECTOR",
  minister: "MINISTER",
  "campus pastor": "CAMPUS_PASTOR",
  pastor: "PASTOR",
  "lighthouse pastor": "LIGHTHOUSE_PASTOR",
};

/** The form's "where you belong" answers, onto the site's Lighthouse names. */
const LIGHTHOUSES: Record<string, string> = {
  "legacy center": "Legacy Center",
  "legacy centre": "Legacy Center",
  "bode thomas lighthouse": "Bode Thomas",
  "ijegun lighthouse": "Ijegun",
  "agric lighthouse": "Agric",
  "lekki lighthouse": "Lekki",
  "jumofak lighthouse": "Jumofak",
  iwkb: "IWKB",
  guest: "Guest",
};

const HOW_HEARD: Record<string, HowHeard> = {
  "i am a member/partner": "MEMBER_OR_PARTNER",
  "through a friend": "THROUGH_A_FRIEND",
  "social media": "SOCIAL_MEDIA",
  "through email": "THROUGH_EMAIL",
  "through sms": "THROUGH_SMS",
};

/** "nil", "None for now", "NA"… all mean nothing to note. */
const NOTHING = /^(n\/?a|nil+|none?(\s+for now)?|no(ne)?|non|no kids|nothing|0|-|\.)$/i;
const meaningful = (value: string) => (value && !NOTHING.test(value.trim()) ? value.trim() : null);

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** "chiamaka" → "Chiamaka"; names already cased are left as typed. */
function tidyName(name: string) {
  const trimmed = name.replace(/\s+/g, " ").trim();
  return trimmed === trimmed.toLowerCase()
    ? trimmed.replace(/(^|[\s'-])(\p{L})/gu, (_, lead, letter) => lead + letter.toUpperCase())
    : trimmed;
}

/** Excel stores dates as days since 1899-12-30. */
const fromExcelDate = (serial: string) =>
  Number.isFinite(Number(serial)) && serial ? new Date((Number(serial) - 25569) * 86_400_000) : null;

type Planned = {
  row: number;
  name: string;
  email: string;
  phone: string;
  submittedAt: Date | null;
  data: Omit<Prisma.RegistrantUncheckedCreateInput, "campId" | "registrationCode">;
  free: boolean;
};

async function main() {
  const [path, ...flags] = process.argv.slice(2);
  const commit = flags.includes("--commit");
  if (!path) {
    console.error('Usage: npx tsx scripts/import-lark.ts "<file.xlsx>" [--commit]');
    process.exit(1);
  }

  const [header, ...rows] = readFirstSheet(path);
  const col = (label: string) => {
    const index = header.findIndex((cell) => cell.toLowerCase().startsWith(label.toLowerCase()));
    if (index < 0) throw new Error(`Column "${label}" not found in the sheet.`);
    return index;
  };
  const C = {
    submitted: col("Submitted on"),
    first: col("First Name"),
    last: col("Last Name"),
    ageGroup: col("Age Group"),
    email: col("Email Address"),
    belong: col("Indicate Where you belong"),
    role: col("Select most appropriate option"),
    accommodation: col("Accommodation Categories"),
    plan: col("Select your Payment Plan"),
    parent: col("Are you a parent"),
    couple: col("Are you a couple"),
    over10: col("Are you coming with a child"),
    howMany: col("State how many kids"),
    medical: col("Please provide any medical"),
    firstTime: col("Is this your first time"),
    howHeard: col("How did you hear"),
    marital: col("Marital Status"),
    location: col("Location"),
    phone: col("Phone Number"),
  };

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  try {
    const camp = await db.camp.findFirst({
      where: { isActive: true },
      include: { priceTiers: { where: { isActive: true } } },
      orderBy: { startsAt: "asc" },
    });
    if (!camp) throw new Error("No active camp.");
    const childFeeKobo = camp.priceTiers.find((tier) => tier.category === "CHILD")?.amountKobo ?? 15_000_00;

    const skipped: { row: number; name: string; reason: string }[] = [];
    const planned = new Map<string, Planned>();

    const sheetEmails = rows.map((cells) => (cells[C.email] ?? "").toLowerCase().replace(/\s+/g, ""));
    const existing = new Set(
      (
        await db.registrant.findMany({
          where: { campId: camp.id, email: { in: sheetEmails.filter((email) => EMAIL.test(email)) } },
          select: { email: true },
        })
      ).map((registrant) => registrant.email),
    );

    rows.forEach((cells, index) => {
      const row = index + 2; // the sheet's own row number, header is 1
      const get = (i: number) => cells[i] ?? "";
      const name = `${tidyName(get(C.first))} ${tidyName(get(C.last))}`.trim() || `Row ${row}`;
      const email = get(C.email).toLowerCase().replace(/\s+/g, "");
      const phone = get(C.phone).replace(/[\s()-]/g, "");

      if (!EMAIL.test(email)) return skipped.push({ row, name, reason: `no usable email ("${get(C.email)}")` });
      if (existing.has(email)) return skipped.push({ row, name, reason: "already registered, left as it is" });
      if (phone.replace(/\D/g, "").length < 7) return skipped.push({ row, name, reason: "no phone number, so they couldn't sign in" });

      const age = AGE_GROUPS[get(C.ageGroup)];
      if (!age) return skipped.push({ row, name, reason: `unknown age group "${get(C.ageGroup)}"` });
      const tier = camp.priceTiers.find((priceTier) => priceTier.category === age.category);
      if (!tier) return skipped.push({ row, name, reason: `no ${age.category.toLowerCase()} ticket on sale` });

      const belong = get(C.belong);
      const lighthouse = LIGHTHOUSES[belong.toLowerCase()] ?? (belong || null);
      const role = get(C.role);
      const position = POSITIONS[role.toLowerCase()] ?? "DISCIPLE";
      const amount = amountDueKobo({ category: age.category, tierAmountKobo: tier.amountKobo, lighthouse, childFeeKobo });
      const instalments = /install?ments?/i.test(get(C.plan)) && amount > 0;
      const count = Number(/(\d+)/.exec(get(C.plan))?.[1] ?? 0);
      const submittedAt = fromExcelDate(get(C.submitted));

      // Children aren't priced from the form's free-text answers: the desk
      // confirms ages and adds any 5–11 fee, so the answers go in the notes.
      const childAnswers = [
        get(C.parent) === "Yes" ? "parent with children" : null,
        get(C.couple) === "Yes" ? "couple with children" : null,
        get(C.over10) === "Yes" ? "bringing a child/teen over 10" : null,
        meaningful(get(C.howMany)) ? `how many: "${get(C.howMany)}"` : null,
      ].filter(Boolean);
      const notes = [
        `Imported from the LARK form${submittedAt ? ` (submitted ${submittedAt.toISOString().slice(0, 10)})` : ""}.`,
        position === "DISCIPLE" && role && !/^disciple$/i.test(role) ? `Role on the form: ${role}.` : null,
        lighthouse && !Object.values(LIGHTHOUSES).includes(lighthouse) ? `"Where you belong" on the form: ${belong}.` : null,
        childAnswers.length ? `Children, confirm ages and fees: ${childAnswers.join("; ")}.` : null,
      ]
        .filter(Boolean)
        .join(" ");

      const plan: Planned = {
        row,
        name,
        email,
        phone,
        submittedAt,
        free: amount === 0,
        data: {
          firstName: tidyName(get(C.first)) || "Unknown",
          lastName: tidyName(get(C.last)) || "-",
          email,
          phone,
          gender: null,
          position,
          positionNote: position === "DISCIPLE" && role && !/^disciple$/i.test(role) ? role : null,
          lighthouse,
          isFirstCamp: get(C.firstTime) === "Yes",
          ageGroup: age.ageGroup,
          maritalStatus:
            age.category === "ADULT" ? (/married/i.test(get(C.marital)) ? "MARRIED" : /single/i.test(get(C.marital)) ? "SINGLE" : null) : null,
          howHeard: HOW_HEARD[get(C.howHeard).toLowerCase()] ?? null,
          address: meaningful(get(C.location)),
          emergencyName: null,
          emergencyPhone: null,
          medicalNotes: meaningful(get(C.medical)),
          category: age.category,
          priceTierId: tier.id,
          amountDueKobo: amount,
          wantsPersonalAccommodation: /private/i.test(get(C.accommodation)),
          paymentPlan: instalments ? "INSTALLMENT" : "FULL",
          installmentCount: instalments && count > 1 ? Math.min(count, 5) : null,
          consentPhoto: false,
          status: amount === 0 ? "PAID" : "PENDING",
          notes,
          importedFrom: SOURCE,
          ...(submittedAt ? { createdAt: submittedAt } : {}),
        },
      };

      // The same person submitting twice: the latest submission wins.
      const earlier = planned.get(email);
      if (earlier) {
        const keepLater = (plan.submittedAt?.getTime() ?? 0) >= (earlier.submittedAt?.getTime() ?? 0);
        const [kept, dropped] = keepLater ? [plan, earlier] : [earlier, plan];
        planned.set(email, kept);
        skipped.push({ row: dropped.row, name: dropped.name, reason: `${email} appears again on row ${kept.row}; kept the later submission` });
        return;
      }
      planned.set(email, plan);
    });

    const toImport = [...planned.values()].sort((a, b) => a.row - b.row);
    console.log(`\n${rows.length} rows in the sheet.`);
    console.log(`${toImport.length} to import (${toImport.filter((plan) => plan.free).length} free Guest tickets, issued straight away).`);
    console.log(`${skipped.length} skipped:`);
    for (const item of skipped.sort((a, b) => a.row - b.row)) {
      console.log(`  row ${String(item.row).padStart(3)}  ${item.name}: ${item.reason}`);
    }

    // How the answers mapped, in aggregate: enough to sanity-check the run.
    const tally = (pick: (plan: Planned) => unknown) => {
      const counts = new Map<string, number>();
      for (const plan of toImport) {
        const key = String(pick(plan) ?? "(none)");
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return [...counts].sort((a, b) => b[1] - a[1]).map(([key, n]) => `${key} ${n}`).join(", ");
    };
    console.log(`
Tickets: ${tally((plan) => plan.data.category)}`);
    console.log(`Positions: ${tally((plan) => plan.data.position)}`);
    console.log(`Lighthouses: ${tally((plan) => plan.data.lighthouse)}`);
    console.log(`Plans: ${tally((plan) => (plan.data.paymentPlan === "INSTALLMENT" ? `${plan.data.installmentCount} instalments` : "full"))}`);
    console.log(`Amount due: ${tally((plan) => `NGN ${(Number(plan.data.amountDueKobo) / 100).toLocaleString("en-NG")}`)}`);
    console.log(`Personal room requested: ${toImport.filter((plan) => plan.data.wantsPersonalAccommodation).length}`);
    console.log(`Children noted for the desk: ${toImport.filter((plan) => String(plan.data.notes).includes("Children")).length}`);

    if (!commit) {
      console.log("\nDry run, nothing written. Run again with --commit to import.\n");
      return;
    }

    let created = 0;
    for (const plan of toImport) {
      const registrant = await db.registrant.create({
        data: { ...plan.data, campId: camp.id, registrationCode: registrationCode() },
      });
      if (plan.free) {
        await db.ticket.create({
          data: { registrantId: registrant.id, code: ticketCode(), qrPayload: qrPayload(), status: "VALID" },
        });
      }
      created += 1;
    }
    await db.auditLog.create({
      data: {
        actorLabel: "import-lark script",
        action: "registrant.imported",
        entity: "Registrant",
        meta: { source: SOURCE, file: path.split(/[\\/]/).pop(), rows: rows.length, created, skipped: skipped.length },
      },
    });
    console.log(`\nImported ${created} registrants.\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
