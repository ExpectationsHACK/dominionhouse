import { describe, expect, it } from "vitest";
import { isWithinCampDays } from "@/lib/camp";

// 25-28 Feb 2027, stored the way the seed does: 16:00 opening, 13:00 close.
const camp = {
  startsAt: new Date(Date.UTC(2027, 1, 25, 15, 0)), // 16:00 WAT
  endsAt: new Date(Date.UTC(2027, 1, 28, 12, 0)), // 13:00 WAT
};

describe("isWithinCampDays", () => {
  it("is true from midnight on the first day, hours before the opening service", () => {
    expect(isWithinCampDays(camp, new Date(Date.UTC(2027, 1, 25, 0, 30)))).toBe(true);
    expect(isWithinCampDays(camp, new Date(Date.UTC(2027, 1, 25, 11, 0)))).toBe(true);
  });

  it("is true through the last day, even after the closing session's UTC hour", () => {
    expect(isWithinCampDays(camp, new Date(Date.UTC(2027, 1, 28, 20, 0)))).toBe(true);
  });

  it("is false the day before camp starts and the day after it ends", () => {
    expect(isWithinCampDays(camp, new Date(Date.UTC(2027, 1, 24, 23, 59)))).toBe(false);
    expect(isWithinCampDays(camp, new Date(Date.UTC(2027, 1, 29, 0, 0)))).toBe(false);
  });

  it("is false today, months before camp", () => {
    expect(isWithinCampDays(camp, new Date(Date.UTC(2026, 8, 29)))).toBe(false);
  });
});
