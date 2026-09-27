import { describe, expect, it } from "vitest";
import { csvToRecords } from "@/lib/csv";
import { IMPORT_COLUMNS, importTemplateCsv, rowToAdminRegistrantInput } from "@/lib/registrant-import";

describe("csvToRecords", () => {
  it("parses a header row plus data rows, quoted commas included", () => {
    const rows = csvToRecords('First name,Last name\r\n"Doe, Jr.",Jane\r\nJohn,Smith\r\n');
    expect(rows).toEqual([
      { "First name": "Doe, Jr.", "Last name": "Jane" },
      { "First name": "John", "Last name": "Smith" },
    ]);
  });

  it("strips a leading BOM and skips blank rows", () => {
    const rows = csvToRecords("﻿Name\r\nJane\r\n\r\n,\r\n");
    expect(rows).toEqual([{ Name: "Jane" }]);
  });
});

describe("importTemplateCsv", () => {
  it("round-trips through the same column headers rowToAdminRegistrantInput expects", () => {
    const [records] = [csvToRecords(importTemplateCsv())];
    expect(records).toHaveLength(1);
    expect(Object.keys(records[0])).toEqual([...IMPORT_COLUMNS]);

    const mapped = rowToAdminRegistrantInput(records[0], { sendEmail: false });
    expect(mapped.ok).toBe(true);
  });
});

describe("rowToAdminRegistrantInput", () => {
  const base: Record<string, string> = {
    "First name": "Jane",
    "Last name": "Doe",
    Email: "jane@example.com",
    Phone: "08031234567",
    Gender: "Female",
    Ticket: "Adult",
    Position: "Pastor",
    "Lighthouse or Ministry": "Legacy Center",
    Region: "",
    Branch: "",
    City: "",
    State: "",
    "First camp": "Yes",
    "Wants personal room": "No",
    Transport: "no",
    "Emergency contact": "John Doe",
    "Emergency phone": "08039876543",
    "Emergency relation": "",
    "Medical notes": "",
    Allergies: "",
    "Amount paid (NGN)": "50000",
    "Payment method": "Bank Transfer",
  };

  it("maps labels to the enum values the form submits", () => {
    const result = rowToAdminRegistrantInput(base, { sendEmail: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      registeringAs: "ADULT",
      position: "PASTOR",
      gender: "FEMALE",
      isFirstCamp: true,
      wantsPersonalAccommodation: false,
      transportNeeded: false,
      paymentMethod: "BANK_TRANSFER",
      amountPaidNaira: 50000,
      sendEmail: true,
    });
  });

  it("rejects an unrecognised ticket type", () => {
    const result = rowToAdminRegistrantInput({ ...base, Ticket: "VIP" }, { sendEmail: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/ticket type/);
  });

  it("falls back to Disciple for an unrecognised position", () => {
    const result = rowToAdminRegistrantInput({ ...base, Position: "Overlord" }, { sendEmail: false });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.position).toBe("DISCIPLE");
  });

  it("surfaces the underlying validation error, e.g. a bad phone number", () => {
    const result = rowToAdminRegistrantInput({ ...base, Phone: "123" }, { sendEmail: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/phone/i);
  });
});
