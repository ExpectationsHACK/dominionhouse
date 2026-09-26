// Integration test of the registration server action against the REAL database
// and Resend. Run: npm run test:int
import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  const jar = new Map<string, string>();
  return {
    cookies: async () => ({
      get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
      set: (name: string, value: string) => void jar.set(name, value),
      delete: (name: string) => void jar.delete(name),
    }),
    headers: async () => new Headers(),
  };
});

import { db } from "@/lib/db";
import { registerForCamp } from "@/app/(site)/camp/register/actions";

const EMAILS = ["delivered+reg1@resend.dev", "delivered+reg2@resend.dev", "delivered+reg3@resend.dev"];

afterAll(async () => {
  await db.emailLog.deleteMany({ where: { to: { in: EMAILS } } });
  await db.registrant.deleteMany({ where: { email: { in: EMAILS } } });
});

function form(email: string, extra: Record<string, string> = {}) {
  const data = new FormData();
  const fields: Record<string, string> = {
    registeringAs: "ADULT", firstName: "Reg", lastName: "Tester", email, phone: "08031234567", gender: "FEMALE",
    position: "DISCIPLE", lighthouse: "Guest", emergencyName: "Em Ergency", emergencyPhone: "08031234568",
    paymentPlan: "INSTALLMENT", installmentChoice: "4", agreeTerms: "on", consentPhoto: "on", ...extra,
  };
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) data.set(k, v);
  return data;
}

/** The action ends with redirect(), which throws; return where it pointed. */
async function submit(data: FormData) {
  try {
    const state = await registerForCamp({ ok: false }, data);
    return { state, redirectTo: null as string | null };
  } catch (error) {
    const digest = (error as { digest?: string }).digest ?? "";
    if (!digest.startsWith("NEXT_REDIRECT")) throw error;
    return { state: null, redirectTo: digest.split(";")[2] };
  }
}

describe("registerForCamp on the real database", () => {
  it("registers, stores the record, emails the confirmation and goes to payment", async () => {
    const { redirectTo } = await submit(form(EMAILS[0]));
    expect(redirectTo).toMatch(/^\/camp\/payment\?email=delivered%2Breg1%40resend\.dev&welcome=1$/);

    const registrant = await db.registrant.findFirstOrThrow({ where: { email: EMAILS[0] } });
    expect(registrant.registrationCode).toMatch(/^FFC27-[2-9A-HJKMNP-Z]{6}$/);
    expect(registrant).toMatchObject({
      status: "PENDING", amountDueKobo: 5_000_000, paymentPlan: "INSTALLMENT", installmentCount: 4,
      position: "DISCIPLE", lighthouse: "Guest", category: "ADULT",
    });
    expect(registrant.dateOfBirth).toBeNull();
    expect(registrant.department).toBeNull();

    const logs = await db.emailLog.findMany({ where: { to: EMAILS[0] } });
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ template: "registration-received", status: "SENT" });
    expect(logs[0].providerId).toBeTruthy();
    expect(logs[0].providerId).not.toBe("console");
    expect(logs[0].subject).toContain(registrant.registrationCode);
  });

  it("Pay later registers the same way and goes straight to the camp profile", async () => {
    // Exactly what the form posts for "Pay later": pay-in-full stored, plus the flag.
    const { redirectTo } = await submit(form(EMAILS[1], { payLater: "1", paymentPlan: "FULL", installmentChoice: undefined as unknown as string }));
    expect(redirectTo).toBe("/portal");
    const registrant = await db.registrant.findFirstOrThrow({ where: { email: EMAILS[1] } });
    expect(registrant.status).toBe("PENDING");
    expect(registrant.paymentPlan).toBe("FULL");
    expect(await db.emailLog.count({ where: { to: EMAILS[1], template: "registration-received", status: "SENT" } })).toBe(1);
  });

  it("refuses the same email twice and does not send a second email", async () => {
    const { state } = await submit(form(EMAILS[1]));
    expect(state?.ok).toBe(false);
    expect(state?.error).toMatch(/already registered/);
    expect(await db.registrant.count({ where: { email: EMAILS[1] } })).toBe(1);
    expect(await db.emailLog.count({ where: { to: EMAILS[1] } })).toBe(1);
  });

  it("rejects bad input without creating anything", async () => {
    const noTerms = form(EMAILS[2]);
    noTerms.delete("agreeTerms");
    expect((await submit(noTerms)).state?.ok).toBe(false);
    expect((await submit(form(EMAILS[2], { position: "KING" }))).state?.ok).toBe(false);
    expect((await submit(form(EMAILS[2], { phone: "123" }))).state?.ok).toBe(false);
    expect(await db.registrant.count({ where: { email: EMAILS[2] } })).toBe(0);
  });
});
