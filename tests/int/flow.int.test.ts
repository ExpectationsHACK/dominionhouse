// Integration test against the REAL database and Resend (not part of `npm test`).
// Run: npx vitest run --config vitest.int.config.mts
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getActiveCamp } from "@/lib/camp";
import { recordUnsuccessfulPayment, settlePayment, getTotals } from "@/lib/registration";

const EMAIL = "delivered+inttest@resend.dev";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let registrantId = "";

afterAll(async () => {
  await db.emailLog.deleteMany({ where: { to: EMAIL } });
  await db.registrant.deleteMany({ where: { email: EMAIL } });
});

async function pay(amountKobo: number, reference: string) {
  await db.payment.create({
    data: { registrantId, reference, amountKobo, method: "PAYSTACK", status: "PENDING" },
  });
}
const status = async () => (await db.registrant.findUniqueOrThrow({ where: { id: registrantId } })).status;
const paymentStatus = async (reference: string) =>
  (await db.payment.findUniqueOrThrow({ where: { reference } })).status;
const emails = () => db.emailLog.findMany({ where: { to: EMAIL }, orderBy: { createdAt: "asc" } });

describe("registration -> payments -> ticket, on the real database", () => {
  it("sets up a registrant owing 50,000 naira", async () => {
    const camp = (await getActiveCamp())!;
    const tier = camp.priceTiers.find((t) => t.category === "ADULT")!;
    const registrant = await db.registrant.create({
      data: {
        campId: camp.id, registrationCode: "FFC27-INT001", firstName: "Int", lastName: "Test", email: EMAIL,
        phone: "08031234567", gender: "MALE", category: "ADULT", position: "DISCIPLE", priceTierId: tier.id,
        amountDueKobo: tier.amountKobo, status: "PENDING", paymentPlan: "INSTALLMENT", installmentCount: 4,
        emergencyName: "X Y", emergencyPhone: "08031234568",
      },
    });
    registrantId = registrant.id;
    expect(tier.amountKobo).toBe(5_000_000);
  });

  it("a part payment is recorded, the balance drops, and no ticket is issued", async () => {
    await pay(1_500_000, "INT-P1");
    const result = await settlePayment({ reference: "INT-P1", channel: "card", verifiedAmountKobo: 1_500_000 });
    expect(result.ok).toBe(true);
    expect(await paymentStatus("INT-P1")).toBe("SUCCESS");
    expect(await status()).toBe("PARTIALLY_PAID");
    expect(await db.ticket.findUnique({ where: { registrantId } })).toBeNull();
    const totals = await getTotals(registrantId);
    expect(totals).toMatchObject({ paidKobo: 1_500_000, balanceKobo: 3_500_000, isSettled: false });
  });

  it("a declined attempt is saved with its reason and does not change the balance", async () => {
    await pay(1_000_000, "INT-P2");
    await recordUnsuccessfulPayment({ reference: "INT-P2", status: "DECLINED", note: "Declined: Insufficient Funds" });
    const row = await db.payment.findUniqueOrThrow({ where: { reference: "INT-P2" } });
    expect(row.status).toBe("DECLINED");
    expect(row.note).toContain("Insufficient Funds");
    expect((await getTotals(registrantId)).paidKobo).toBe(1_500_000);
    expect(await status()).toBe("PARTIALLY_PAID");
  });

  it("an abandoned checkout is saved, and a later verified success still settles it", async () => {
    await pay(500_000, "INT-P3");
    await recordUnsuccessfulPayment({ reference: "INT-P3", status: "ABANDONED", note: "left" });
    expect(await paymentStatus("INT-P3")).toBe("ABANDONED");
    await settlePayment({ reference: "INT-P3", verifiedAmountKobo: 500_000 });
    expect(await paymentStatus("INT-P3")).toBe("SUCCESS");
    // The earlier "not completed" note must not stay on a payment that succeeded.
    expect((await db.payment.findUniqueOrThrow({ where: { reference: "INT-P3" } })).note).toBeNull();
    expect((await getTotals(registrantId)).paidKobo).toBe(2_000_000);
  });

  it("settling the same payment twice changes nothing (no double credit)", async () => {
    const again = await settlePayment({ reference: "INT-P3", verifiedAmountKobo: 500_000 });
    expect(again).toMatchObject({ ok: true, alreadySettled: true });
    expect((await getTotals(registrantId)).paidKobo).toBe(2_000_000);
  });

  it("paying the remaining balance marks PAID and issues one ticket", async () => {
    await sleep(1200);
    await pay(3_000_000, "INT-P4");
    const result = await settlePayment({ reference: "INT-P4", channel: "card", verifiedAmountKobo: 3_000_000 });
    expect(result).toMatchObject({ ok: true, alreadySettled: false });
    expect(await status()).toBe("PAID");

    const ticket = await db.ticket.findUniqueOrThrow({ where: { registrantId } });
    expect(ticket.code).toMatch(/^TKT-FFC-27-[2-9A-HJKMNP-Z]{5}$/);
    expect(ticket.status).toBe("VALID");
    expect(ticket.qrPayload).toHaveLength(24);
  });

  it("a repeat of the final payment does not issue or email a second ticket", async () => {
    const before = (await emails()).filter((e) => e.template === "ticket").length;
    await settlePayment({ reference: "INT-P4", verifiedAmountKobo: 3_000_000 });
    expect(await db.ticket.count({ where: { registrantId } })).toBe(1);
    expect((await emails()).filter((e) => e.template === "ticket").length).toBe(before);
  });

  it("emails: a receipt for each successful payment and one ticket email, all really sent", async () => {
    const log = await emails();
    const receipts = log.filter((e) => e.template === "payment-receipt");
    const tickets = log.filter((e) => e.template === "ticket");
    expect(receipts).toHaveLength(3); // P1, P3, P4 (the declined one sends nothing)
    expect(tickets).toHaveLength(1);
    for (const email of [...receipts, ...tickets]) {
      expect(email.status, `${email.template}: ${email.error}`).toBe("SENT");
      expect(email.providerId).toBeTruthy();
      expect(email.providerId).not.toBe("console");
    }
    expect(tickets[0].subject).toContain("TKT-FFC-27-");
    const ticketRow = await db.ticket.findUniqueOrThrow({ where: { registrantId } });
    expect(ticketRow.emailSentAt).not.toBeNull();
  });

  it("a reversed payment lowers what is paid", async () => {
    await recordUnsuccessfulPayment({ reference: "INT-P1", status: "REVERSED", note: "reversed" });
    expect(await paymentStatus("INT-P1")).toBe("REVERSED");
    expect((await getTotals(registrantId)).paidKobo).toBe(3_500_000);
  });
});
