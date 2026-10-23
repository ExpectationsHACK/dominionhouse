/**
 * Imports the Fresh Fire Camp 2027 CIM Google Form CSV as pending campus
 * student registrations. Existing attendees are left unchanged.
 *
 *   npx tsx scripts/import-cim.ts "<path to the CSV>"           # dry run
 *   npx tsx scripts/import-cim.ts "<path to the CSV>" --commit  # imports
 *
 * No email is sent and no payment or ticket is recorded.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import type { Gender, HowHeard, Position } from "../src/generated/prisma/enums";
import { csvToRecords } from "../src/lib/csv";
import { registrationCode } from "../src/lib/codes";
import { amountDueKobo } from "../src/lib/pricing";

const SOURCE = "Fresh Fire Camp 2027 - CIM form";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NOTHING = /^(n\/?a|nil+|none?(\s+for now)?|no(ne)?|non|nothing|0|-|\.)$/i;

type Planned = {
  row: number;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  data: Omit<Prisma.RegistrantUncheckedCreateInput, "campId" | "registrationCode">;
};

const POSITION_BY_ANSWER: Record<string, Position> = {
  disciple: "DISCIPLE",
  "sub team leader": "POWER_4_LEADER",
  "campus coordinator": "TEAM_COORDINATOR",
  "team leader": "TEAM_LEADER",
  "campus pastor": "CAMPUS_PASTOR",
};

const HOW_HEARD_BY_ANSWER: Record<string, HowHeard> = {
  "i am a member/partner": "MEMBER_OR_PARTNER",
  "through a friend": "THROUGH_A_FRIEND",
  "social media": "SOCIAL_MEDIA",
  "through email": "THROUGH_EMAIL",
  "through sms": "THROUGH_SMS",
};

const tidyName = (value: string) => {
  const name = value.replace(/\s+/g, " ").trim();
  return name === name.toLowerCase()
    ? name.replace(/(^|[\s'-])(\p{L})/gu, (_, lead, letter) => lead + letter.toUpperCase())
    : name;
};

const phoneKey = (phone: string) => phone.replace(/\D/g, "").slice(-10);
const nameKey = (first: string, last: string) =>
  `${first} ${last}`.toLowerCase().replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ").trim();

function yes(value: string) {
  return /^(yes|y|true|1)$/i.test(value.trim());
}

function meaningful(value: string) {
  const text = value.trim();
  return text && !NOTHING.test(text) ? text : null;
}

async function main() {
  const [path, ...flags] = process.argv.slice(2);
  const commit = flags.includes("--commit");
  if (!path) {
    console.error('Usage: npx tsx scripts/import-cim.ts "<file.csv>" [--commit]');
    process.exit(1);
  }

  const records = csvToRecords(readFileSync(path, "utf8"));
  const columns = [
    "Email address",
    "First name",
    "Last name",
    "Gender",
    "Phone number",
    "Select most appropriate option",
    "Select your payment plan",
    "Select your region",
    "Is this your first time",
    "How did you hear",
    "Name of University",
  ];
  const headers = Object.keys(records[0] ?? {});
  const column = (prefix: string) => {
    const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
    const header = headers.find((value) => normalize(value).startsWith(normalize(prefix)));
    if (!header) throw new Error(`Column "${prefix}" not found in the CSV.`);
    return header;
  };
  const C = Object.fromEntries(columns.map((name) => [name, column(name)])) as Record<string, string>;
  const get = (record: Record<string, string>, label: string) => record[C[label]]?.trim() ?? "";

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });

  try {
    const camp = await db.camp.findFirst({
      where: { isActive: true },
      include: { priceTiers: { where: { isActive: true } } },
      orderBy: { startsAt: "asc" },
    });
    if (!camp) throw new Error("No active camp.");
    const tier = camp.priceTiers.find((priceTier) => priceTier.category === "STUDENT");
    if (!tier) throw new Error("No active campus student ticket is available.");
    const childTier = camp.priceTiers.find((priceTier) => priceTier.category === "CHILD");
    const amountDue = amountDueKobo({
      category: "STUDENT",
      tierAmountKobo: tier.amountKobo,
      childFeeKobo: childTier?.amountKobo ?? 15_000_00,
    });

    const skipped: { row: number; reason: string }[] = [];
    const planned = new Map<string, Planned>();

    records.forEach((record, index) => {
      const row = index + 2;
      const firstName = tidyName(get(record, "First name"));
      const lastName = tidyName(get(record, "Last name"));
      const email = get(record, "Email address").toLowerCase().replace(/\s+/g, "");
      const phone = get(record, "Phone number").replace(/[\s()-]/g, "");
      const region = get(record, "Select your region");

      if (!firstName || !lastName) return skipped.push({ row, reason: "missing first or last name" });
      if (!EMAIL.test(email)) return skipped.push({ row, reason: "no usable email address" });
      if (phoneKey(phone).length < 7) return skipped.push({ row, reason: "no usable phone number" });
      if (!region) return skipped.push({ row, reason: "no campus region" });

      const rawPosition = get(record, "Select most appropriate option");
      const position = POSITION_BY_ANSWER[rawPosition.toLowerCase()] ?? "DISCIPLE";
      const genderAnswer = get(record, "Gender").toLowerCase();
      const gender: Gender | null = genderAnswer === "male" ? "MALE" : genderAnswer === "female" ? "FEMALE" : null;
      const plan = get(record, "Select your payment plan");
      const installmentCount = /install?ments?/i.test(plan)
        ? Math.min(5, Number(/(\d+)/.exec(plan)?.[1] ?? 0))
        : 0;
      const howHeardAnswer = get(record, "How did you hear").toLowerCase();
      const howHeard = HOW_HEARD_BY_ANSWER[howHeardAnswer] ?? null;

      const data: Planned["data"] = {
        firstName,
        lastName,
        email,
        phone,
        gender,
        position,
        positionNote:
          position === "DISCIPLE" && rawPosition && !/^disciple$/i.test(rawPosition) ? rawPosition : null,
        region,
        isFirstCamp: yes(get(record, "Is this your first time")),
        howHeard,
        branch: meaningful(get(record, "Name of University")),
        category: "STUDENT",
        priceTierId: tier.id,
        amountDueKobo: amountDue,
        paymentPlan: installmentCount > 1 ? "INSTALLMENT" : "FULL",
        installmentCount: installmentCount > 1 ? installmentCount : null,
        consentPhoto: false,
        status: "PENDING",
        notes: `Imported from the CIM form. Payment remains pending; no payment or ticket was recorded.`,
        importedFrom: SOURCE,
      };

      const earlier = planned.get(email);
      if (earlier) {
        planned.set(email, { row, email, phone, firstName, lastName, data });
        skipped.push({ row: earlier.row, reason: `duplicate form email; kept later row ${row}` });
      } else {
        planned.set(email, { row, email, phone, firstName, lastName, data });
      }
    });

    const registered = await db.registrant.findMany({
      where: { campId: camp.id },
      select: { email: true, phone: true, firstName: true, lastName: true },
    });
    const existingEmails = new Set(registered.map((registrant) => registrant.email.toLowerCase()));
    const existingPhones = new Map(
      registered.filter((registrant) => phoneKey(registrant.phone).length >= 7)
        .map((registrant) => [phoneKey(registrant.phone), registrant.email]),
    );
    const existingNames = new Map(
      registered.map((registrant) => [nameKey(registrant.firstName, registrant.lastName), registrant.email]),
    );

    const toImport: Planned[] = [];
    for (const plan of [...planned.values()].sort((a, b) => a.row - b.row)) {
      const matchEmail = existingEmails.has(plan.email);
      const matchPhone = existingPhones.get(phoneKey(plan.phone));
      const matchName = existingNames.get(nameKey(plan.firstName, plan.lastName));
      if (matchEmail) skipped.push({ row: plan.row, reason: "email already registered" });
      else if (matchPhone) {
        skipped.push({
          row: plan.row,
          reason: `phone already belongs to a registered attendee (same name: ${Boolean(matchName)})`,
        });
      }
      else if (matchName) skipped.push({ row: plan.row, reason: "name already belongs to a registered attendee" });
      else toImport.push(plan);
    }

    console.log(`${records.length} form rows; ${planned.size} unique usable emails.`);
    console.log(`${toImport.length} new campus-student registrations planned; all will be pending.`);
    console.log(`Student ticket: NGN ${(tier.amountKobo / 100).toLocaleString("en-NG")} per attendee.`);
    console.log(`${skipped.length} row(s) skipped:`);
    for (const item of skipped.sort((a, b) => a.row - b.row)) {
      console.log(`  row ${String(item.row).padStart(3)}: ${item.reason}`);
    }
    console.log(
      `Payment plans: ${toImport.filter((plan) => plan.data.paymentPlan === "INSTALLMENT").length} instalment, ` +
        `${toImport.filter((plan) => plan.data.paymentPlan === "FULL").length} full.`,
    );

    if (!commit) {
      console.log("\nDry run, nothing written. Run again with --commit to import.\n");
      return;
    }

    await db.$transaction(async (tx) => {
      await tx.registrant.createMany({
        data: toImport.map((plan) => ({
          ...plan.data,
          campId: camp.id,
          registrationCode: registrationCode(),
        })),
      });
      await tx.auditLog.create({
        data: {
          actorLabel: "import-cim script",
          action: "registrant.imported",
          entity: "Registrant",
          meta: { source: SOURCE, file: path.split(/[\\/]/).pop(), rows: records.length, created: toImport.length, skipped: skipped.length },
        },
      });
    });
    console.log(`\nImported ${toImport.length} pending registrants. No email was sent.\n`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
