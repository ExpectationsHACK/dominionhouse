import { describe, expect, it } from "vitest";
import {
  effectiveMinimumKobo,
  formatKobo,
  percentPaid,
  perInstallmentKobo,
  toKobo,
  toNaira,
} from "@/lib/money";

describe("money", () => {
  it("converts between naira and kobo without float drift", () => {
    expect(toKobo(45_000)).toBe(4_500_000);
    expect(toKobo(0.1 + 0.2)).toBe(30);
    expect(toNaira(4_500_000)).toBe(45_000);
  });

  it("formats whole naira without decimals and stray kobo with them", () => {
    expect(formatKobo(4_500_000)).toContain("45,000");
    expect(formatKobo(4_500_000)).not.toContain(".");
    expect(formatKobo(4_500_050)).toContain("45,000.50");
  });

  it("caps percentPaid at 100 and treats a zero fee as fully paid", () => {
    expect(percentPaid(50, 100)).toBe(50);
    expect(percentPaid(500, 100)).toBe(100);
    expect(percentPaid(0, 0)).toBe(100);
  });

  it("rounds instalments up to whole naira", () => {
    expect(perInstallmentKobo(5_000_000, 1)).toBe(5_000_000);
    // ₦50,000 / 3 = ₦16,666.67 -> ₦16,667
    expect(perInstallmentKobo(5_000_000, 3)).toBe(1_666_700);
  });

  it("lowers the first-payment floor so a five-way split stays possible", () => {
    const campMin = toKobo(10_000);
    expect(effectiveMinimumKobo(campMin, toKobo(35_000))).toBe(toKobo(7_000));
    expect(effectiveMinimumKobo(campMin, toKobo(50_000))).toBe(toKobo(10_000));
    expect(effectiveMinimumKobo(campMin, 0)).toBe(campMin);
  });
});
