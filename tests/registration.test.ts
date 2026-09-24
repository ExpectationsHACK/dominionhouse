import { describe, expect, it } from "vitest";
import {
  installmentPlanFor,
  minimumPayableKobo,
  statusFor,
  totalsFor,
} from "@/lib/registration";

const payment = (amountKobo: number, status = "SUCCESS") => ({ amountKobo, status });

describe("totalsFor", () => {
  it("only counts SUCCESS payments", () => {
    const totals = totalsFor({
      amountDueKobo: 100_000,
      payments: [payment(30_000), payment(40_000, "PENDING"), payment(10_000, "FAILED")],
    });
    expect(totals).toEqual({ dueKobo: 100_000, paidKobo: 30_000, balanceKobo: 70_000, isSettled: false });
  });

  it("settles at exactly the fee and never reports a negative balance", () => {
    expect(totalsFor({ amountDueKobo: 100, payments: [payment(100)] }).isSettled).toBe(true);
    expect(totalsFor({ amountDueKobo: 100, payments: [payment(500)] }).balanceKobo).toBe(0);
  });

  it("treats a zero-fee ticket as settled from the start", () => {
    expect(totalsFor({ amountDueKobo: 0, payments: [] }).isSettled).toBe(true);
  });
});

describe("statusFor", () => {
  const totals = (paid: number, due = 100) =>
    totalsFor({ amountDueKobo: due, payments: [payment(paid)] });

  it("moves PENDING -> PARTIALLY_PAID -> PAID", () => {
    expect(statusFor(totals(0), "PENDING")).toBe("PENDING");
    expect(statusFor(totals(40), "PENDING")).toBe("PARTIALLY_PAID");
    expect(statusFor(totals(100), "PARTIALLY_PAID")).toBe("PAID");
  });

  it("never resurrects a cancelled or waitlisted registration", () => {
    expect(statusFor(totals(100), "CANCELLED")).toBe("CANCELLED");
    expect(statusFor(totals(100), "WAITLISTED")).toBe("WAITLISTED");
  });
});

describe("minimumPayableKobo", () => {
  const totals = (paid: number, due: number) =>
    totalsFor({ amountDueKobo: due, payments: paid ? [payment(paid)] : [] });

  it("requires the full balance when instalments are off", () => {
    const camp = { installmentsEnabled: false, minFirstInstallmentKobo: 1_000_000 };
    expect(minimumPayableKobo(camp, totals(0, 3_500_000))).toBe(3_500_000);
  });

  it("uses the effective first-instalment floor, capped at the balance", () => {
    const camp = { installmentsEnabled: true, minFirstInstallmentKobo: 1_000_000 };
    expect(minimumPayableKobo(camp, totals(0, 5_000_000))).toBe(1_000_000);
    expect(minimumPayableKobo(camp, totals(0, 3_500_000))).toBe(700_000);
    expect(minimumPayableKobo(camp, totals(0, 500_000))).toBe(100_000);
  });

  it("lets top-ups be as small as 100 naira, but never more than the balance", () => {
    const camp = { installmentsEnabled: true, minFirstInstallmentKobo: 1_000_000 };
    expect(minimumPayableKobo(camp, totals(1_000_000, 5_000_000))).toBe(10_000);
    expect(minimumPayableKobo(camp, totals(4_999_950, 5_000_000))).toBe(50);
  });
});

describe("installmentPlanFor", () => {
  it("suggests the whole balance for a pay-in-full registrant", () => {
    const t = totalsFor({ amountDueKobo: 100_000, payments: [] });
    const plan = installmentPlanFor(
      { paymentPlan: "FULL", installmentCount: null, firstInstallmentKobo: null, amountDueKobo: 100_000 },
      t,
      10_000,
    );
    expect(plan.suggestedKobo).toBe(100_000);
    expect(plan.count).toBeNull();
  });

  it("splits evenly across the chosen count and tracks progress", () => {
    const registrant = {
      paymentPlan: "INSTALLMENT",
      installmentCount: 4,
      firstInstallmentKobo: 1_250_000,
      amountDueKobo: 5_000_000,
    };
    const start = installmentPlanFor(
      registrant,
      totalsFor({ amountDueKobo: 5_000_000, payments: [] }),
      100,
    );
    expect(start).toMatchObject({
      count: 4,
      perInstalmentKobo: 1_250_000,
      paidCount: 0,
      suggestedKobo: 1_250_000,
    });

    const half = installmentPlanFor(
      registrant,
      totalsFor({ amountDueKobo: 5_000_000, payments: [payment(2_500_000)] }),
      100,
    );
    expect(half.paidCount).toBe(2);
    expect(half.suggestedKobo).toBe(1_250_000);
  });

  it("caps the suggestion at what is still owed", () => {
    const plan = installmentPlanFor(
      {
        paymentPlan: "INSTALLMENT",
        installmentCount: 4,
        firstInstallmentKobo: 1_250_000,
        amountDueKobo: 5_000_000,
      },
      totalsFor({ amountDueKobo: 5_000_000, payments: [payment(4_900_000)] }),
      100,
    );
    expect(plan.suggestedKobo).toBe(100_000);
  });
});
