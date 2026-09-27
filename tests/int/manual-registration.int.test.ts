// Integration test of admin-side registrant creation (the "Add registrant" form
// and the CSV importer share this) against the REAL database and Resend.
// Run: npm run test:int
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { requireActiveCamp } from "@/lib/camp";
import { createManualRegistrant } from "@/lib/manual-registration";
import { toNaira } from "@/lib/money";
import type { AdminRegistrantInput } from "@/lib/validation";
import type { AdminSession } from "@/lib/session";

const EMAILS = [
  "delivered+admin1@resend.dev",
  "delivered+admin2@resend.dev",
  "delivered+admin3@resend.dev",
  "delivered+admin4@resend.dev",
];

let admin: AdminSession;
let camp: Awaited<ReturnType<typeof requireActiveCamp>>;

beforeAll(async () => {
  camp = await requireActiveCamp();
  const adminUser = await db.adminUser.findFirstOrThrow({ where: { isActive: true } });
  admin = { adminId: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role };
});

afterAll(async () => {
  await db.emailLog.deleteMany({ where: { to: { in: EMAILS } } });
  const registrants = await db.registrant.findMany({ where: { email: { in: EMAILS } } });
  await db.payment.deleteMany({ where: { registrantId: { in: registrants.map((r) => r.id) } } });
  await db.ticket.deleteMany({ where: { registrantId: { in: registrants.map((r) => r.id) } } });
  await db.registrant.deleteMany({ where: { email: { in: EMAILS } } });
});

function input(email: string, extra: Partial<AdminRegistrantInput> = {}): AdminRegistrantInput {
  return {
    registeringAs: "ADULT",
    firstName: "Desk",
    lastName: "Entry",
    email,
    phone: "08031234567",
    gender: "FEMALE",
    position: "DISCIPLE",
    lighthouse: "Guest",
    region: "",
    branch: "",
    isFirstCamp: false,
    city: "",
    state: "",
    wantsPersonalAccommodation: false,
    transportNeeded: false,
    emergencyName: "Em Ergency",
    emergencyPhone: "08031234568",
    emergencyRelation: "",
    medicalNotes: "",
    allergies: "",
    amountPaidNaira: 0,
    paymentMethod: "CASH",
    paymentReference: "",
    sendEmail: false,
    ...extra,
  };
}

describe("createManualRegistrant on the real database", () => {
  it("registers someone unpaid, no email sent unless asked", async () => {
    const result = await createManualRegistrant(camp, admin, input(EMAILS[0]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const registrant = await db.registrant.findUniqueOrThrow({ where: { id: result.registrantId } });
    expect(registrant.status).toBe("PENDING");
    expect(registrant.lighthouse).toBe("Guest");
    expect(await db.payment.count({ where: { registrantId: result.registrantId } })).toBe(0);
    expect(await db.emailLog.count({ where: { to: EMAILS[0] } })).toBe(0);
  });

  it("records cash paid in full, issues and emails the ticket", async () => {
    const tier = camp.priceTiers.find((t) => t.category === "ADULT")!;

    const result = await createManualRegistrant(
      camp,
      admin,
      input(EMAILS[1], { amountPaidNaira: toNaira(tier.amountKobo), sendEmail: true }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const registrant = await db.registrant.findUniqueOrThrow({
      where: { id: result.registrantId },
      include: { payments: true, ticket: true },
    });
    expect(registrant.status).toBe("PAID");
    expect(registrant.payments).toHaveLength(1);
    expect(registrant.payments[0]).toMatchObject({ status: "SUCCESS", method: "CASH" });
    expect(registrant.ticket).not.toBeNull();
    expect(registrant.ticket?.status).toBe("VALID");

    const templates = (await db.emailLog.findMany({ where: { to: EMAILS[1] } })).map((l) => l.template);
    expect(templates).toEqual(
      expect.arrayContaining(["registration-received", "payment-receipt", "ticket"]),
    );
  });

  it("refuses a second registration on the same email", async () => {
    const result = await createManualRegistrant(camp, admin, input(EMAILS[1]));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already registered/);
  });

  it("requires a Lighthouse or Ministry for a non-student", async () => {
    const result = await createManualRegistrant(camp, admin, input(EMAILS[2], { lighthouse: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Lighthouse or Ministry/);
    expect(await db.registrant.count({ where: { email: EMAILS[2] } })).toBe(0);
  });

  it("requires a region for a campus student", async () => {
    const result = await createManualRegistrant(
      camp,
      admin,
      input(EMAILS[2], { registeringAs: "STUDENT", lighthouse: "", region: "" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/region/);
  });

  it("won't accept a paid amount bigger than the ticket", async () => {
    const tier = camp.priceTiers.find((t) => t.category === "ADULT")!;
    const result = await createManualRegistrant(
      camp,
      admin,
      input(EMAILS[3], { amountPaidNaira: toNaira(tier.amountKobo) + 10_000 }),
    );
    expect(result.ok).toBe(false);
    expect(await db.registrant.count({ where: { email: EMAILS[3] } })).toBe(0);
  });
});
