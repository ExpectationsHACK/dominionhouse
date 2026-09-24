import { describe, expect, it } from "vitest";
import { isPastoral, POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";

describe("positions", () => {
  it("offers every position exactly once, with a label", () => {
    expect(new Set(POSITION_OPTIONS).size).toBe(POSITION_OPTIONS.length);
    for (const position of POSITION_OPTIONS) expect(POSITION_LABEL[position]).toBeTruthy();
  });

  it("uses the renamed labels and starts at Disciple", () => {
    expect(POSITION_OPTIONS[0]).toBe("DISCIPLE");
    expect(POSITION_LABEL.POWER_4_LEADER).toBe("Sub Team Leader");
    expect(POSITION_LABEL.TEAM_LEADER).toBe("Team Co-ordinator");
  });

  it("does not show the same label twice in the dropdown", () => {
    const labels = POSITION_OPTIONS.map((p) => POSITION_LABEL[p]);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("treats campus pastor and above as pastoral", () => {
    expect(isPastoral("CAMPUS_PASTOR")).toBe(true);
    expect(isPastoral("SENIOR_PASTOR")).toBe(true);
    expect(isPastoral("CAPTAIN")).toBe(false);
    expect(isPastoral("DISCIPLE")).toBe(false);
  });
});
