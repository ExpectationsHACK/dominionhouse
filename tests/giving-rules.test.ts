import { describe, expect, it } from "vitest";
import {
  amountProblem,
  formatMoney,
  isGiftReference,
  isGivingCurrency,
  toMinor,
} from "@/lib/giving-rules";

describe("Angel Partner giving rules", () => {
  it("holds the 20/20 covenant minimum for monthly partnership", () => {
    expect(amountProblem(19_999, "NGN", "MONTHLY")).toMatch(/₦20,000 a month/);
    expect(amountProblem(20_000, "NGN", "MONTHLY")).toBeNull();
    expect(amountProblem(19, "USD", "MONTHLY")).toMatch(/\$20 a month/);
    expect(amountProblem(20, "USD", "MONTHLY")).toBeNull();
  });

  it("lets a one-time seed be smaller than the monthly covenant", () => {
    expect(amountProblem(5_000, "NGN", "ONE_TIME")).toBeNull();
    expect(amountProblem(500, "NGN", "ONE_TIME")).toMatch(/smallest seed/);
  });

  it("rejects nonsense and sends very large gifts to the team", () => {
    expect(amountProblem(Number.NaN, "NGN", "ONE_TIME")).toBe("Enter an amount.");
    expect(amountProblem(-5, "USD", "ONE_TIME")).toBe("Enter an amount.");
    expect(amountProblem(20.555, "USD", "MONTHLY")).toMatch(/two decimal/);
    expect(amountProblem(60_000_000, "NGN", "ONE_TIME")).toMatch(/partnership team/);
  });

  it("formats both currencies in their minor units", () => {
    expect(formatMoney(toMinor(20_000), "NGN")).toBe("₦20,000");
    expect(formatMoney(toMinor(20), "USD")).toBe("$20");
    expect(formatMoney(2_050, "USD")).toBe("$20.50");
  });

  it("tells giving references apart from camp payments", () => {
    expect(isGiftReference("DHG-MUX12-ABC234")).toBe(true);
    expect(isGiftReference("DHC27-MUX12-ABC234")).toBe(false);
    expect(isGivingCurrency("NGN")).toBe(true);
    expect(isGivingCurrency("GBP")).toBe(false);
  });
});
