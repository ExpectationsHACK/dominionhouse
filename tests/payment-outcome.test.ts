import { describe, expect, it } from "vitest";
import {
  classifyGatewayOutcome,
  PAYMENT_STATUS,
  SETTLEABLE_STATUSES,
} from "@/lib/payment-outcome";

describe("classifyGatewayOutcome", () => {
  it("recognises success", () => {
    expect(classifyGatewayOutcome({ status: "success" })).toEqual({ kind: "success" });
  });

  it("records a bank refusal as declined, with the reason", () => {
    const outcome = classifyGatewayOutcome({ status: "failed", gatewayResponse: "Declined" });
    expect(outcome).toMatchObject({ kind: "recorded", status: "DECLINED" });
    const insufficient = classifyGatewayOutcome({
      status: "failed",
      gatewayResponse: "Insufficient Funds",
    });
    expect(insufficient).toMatchObject({ kind: "recorded", status: "DECLINED" });
    if (insufficient.kind === "recorded") expect(insufficient.note).toContain("Insufficient Funds");
  });

  it("records any other failure as failed", () => {
    expect(classifyGatewayOutcome({ status: "failed", gatewayResponse: "Token expired" })).toMatchObject({
      kind: "recorded",
      status: "FAILED",
    });
    expect(classifyGatewayOutcome({ status: "failed" })).toMatchObject({
      kind: "recorded",
      status: "FAILED",
    });
  });

  it("records a left-open checkout as not completed", () => {
    expect(classifyGatewayOutcome({ status: "abandoned" })).toMatchObject({
      kind: "recorded",
      status: "ABANDONED",
    });
  });

  it("never calls an in-flight or unknown state a failure", () => {
    for (const status of ["ongoing", "pending", "queued", "processing", "something-new"]) {
      expect(classifyGatewayOutcome({ status }).kind).toBe("processing");
    }
  });

  it("is case-insensitive on the gateway status", () => {
    expect(classifyGatewayOutcome({ status: "SUCCESS" }).kind).toBe("success");
  });
});

describe("payment status display", () => {
  it("labels every status and shows unsuccessful ones as danger", () => {
    expect(PAYMENT_STATUS.SUCCESS.tone).toBe("success");
    for (const status of ["FAILED", "DECLINED", "ABANDONED", "REVERSED"] as const) {
      expect(PAYMENT_STATUS[status].tone).toBe("danger");
    }
    expect(PAYMENT_STATUS.PENDING.tone).toBe("warn");
  });

  it("lets a verified success settle a row that was recorded as unsuccessful, but not a reversed one", () => {
    expect(SETTLEABLE_STATUSES).toEqual(
      expect.arrayContaining(["PENDING", "FAILED", "DECLINED", "ABANDONED"]),
    );
    expect(SETTLEABLE_STATUSES).not.toContain("SUCCESS");
    expect(SETTLEABLE_STATUSES).not.toContain("REVERSED");
  });
});
