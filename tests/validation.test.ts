import { describe, expect, it } from "vitest";
import { POSITION_OPTIONS } from "@/lib/positions";
import { emailSchema, identityStep, phoneSchema, registrationSchema } from "@/lib/validation";

const valid = {
  registeringAs: "ADULT",
  firstName: "Divine",
  lastName: "Felix",
  email: "Divine@Example.com ",
  phone: "0803 123 4567",
  gender: "MALE",
  position: "DISCIPLE",
  emergencyName: "Grace Felix",
  emergencyPhone: "+2348031234567",
  paymentPlan: "FULL",
  agreeTerms: "on",
};

describe("registration validation", () => {
  it("accepts a complete registration with no date of birth or department", () => {
    const parsed = registrationSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("divine@example.com");
  });

  it("accepts every position offered in the dropdown, including Disciple", () => {
    for (const position of POSITION_OPTIONS) {
      expect(registrationSchema.safeParse({ ...valid, position }).success).toBe(true);
    }
  });

  it("no longer knows about date of birth or department", () => {
    expect(Object.keys(identityStep.shape)).not.toContain("dateOfBirth");
    expect(Object.keys(registrationSchema.shape)).not.toContain("department");
  });

  it("requires the guidelines to be accepted", () => {
    expect(registrationSchema.safeParse({ ...valid, agreeTerms: undefined }).success).toBe(false);
  });

  it("rejects an unknown position and an unknown ticket category", () => {
    expect(registrationSchema.safeParse({ ...valid, position: "KING" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, registeringAs: "PENSIONER" }).success).toBe(
      false,
    );
  });

  it("validates phones and emails", () => {
    expect(phoneSchema.safeParse("08031234567").success).toBe(true);
    expect(phoneSchema.safeParse("+2348031234567").success).toBe(true);
    expect(phoneSchema.safeParse("+14035551234").success).toBe(true);
    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("not a phone").success).toBe(false);
    expect(emailSchema.safeParse("nope").success).toBe(false);
  });
});
