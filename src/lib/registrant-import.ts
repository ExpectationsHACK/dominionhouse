import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { adminRegistrantSchema, fieldErrors, type AdminRegistrantInput } from "@/lib/validation";
import type { AgeCategory } from "@/generated/prisma/enums";

export const IMPORT_COLUMNS = [
  "First name",
  "Last name",
  "Email",
  "Phone",
  "Gender",
  "Ticket",
  "Position",
  "Lighthouse or Ministry",
  "Region",
  "Branch",
  "City",
  "State",
  "First camp",
  "Wants personal room",
  "Transport",
  "Emergency contact",
  "Emergency phone",
  "Emergency relation",
  "Medical notes",
  "Allergies",
  "Child age",
  "Bringing children",
  "Children under 5",
  "Children 5 to 11",
  "Amount paid (NGN)",
  "Payment method",
] as const;

const CATEGORY_BY_LABEL = new Map<string, AgeCategory>(
  Object.entries(CATEGORY_LABEL).map(([value, label]) => [label.toLowerCase(), value as AgeCategory]),
);

const POSITION_BY_LABEL = new Map(
  POSITION_OPTIONS.map((position) => [POSITION_LABEL[position].toLowerCase(), position]),
);

const METHOD_BY_LABEL = new Map<string, "CASH" | "BANK_TRANSFER" | "POS" | "WAIVER">([
  ["cash", "CASH"],
  ["bank transfer", "BANK_TRANSFER"],
  ["pos", "POS"],
  ["waiver", "WAIVER"],
]);

function yesNo(value: string): boolean {
  return ["yes", "y", "true", "1"].includes(value.trim().toLowerCase());
}

export type RowMapResult =
  | { ok: true; data: AdminRegistrantInput }
  | { ok: false; data?: undefined; error: string };

/** One CSV row, mapped to the same shape the "Add registrant" form submits. */
export function rowToAdminRegistrantInput(
  record: Record<string, string>,
  options: { sendEmail: boolean },
): RowMapResult {
  const ticketLabel = (record["Ticket"] ?? "").trim().toLowerCase();
  const category = CATEGORY_BY_LABEL.get(ticketLabel);
  if (!category) {
    return {
      ok: false,
      error: `"${record["Ticket"] ?? ""}" isn't a ticket type (Adult, Campus Student, Teenager, Child).`,
    };
  }

  const positionLabel = (record["Position"] ?? "disciple").trim().toLowerCase();
  const position = POSITION_BY_LABEL.get(positionLabel) ?? "DISCIPLE";

  const genderLabel = (record["Gender"] ?? "").trim().toLowerCase();
  const gender = genderLabel.startsWith("f") ? "FEMALE" : genderLabel.startsWith("m") ? "MALE" : "";

  const methodLabel = (record["Payment method"] ?? "cash").trim().toLowerCase();
  const paymentMethod = METHOD_BY_LABEL.get(methodLabel) ?? "CASH";

  const candidate = {
    registeringAs: category,
    firstName: record["First name"] ?? "",
    lastName: record["Last name"] ?? "",
    email: record["Email"] ?? "",
    phone: record["Phone"] ?? "",
    gender,
    position,
    branch: record["Branch"] ?? "",
    lighthouse: record["Lighthouse or Ministry"] ?? "",
    region: record["Region"] ?? "",
    isFirstCamp: yesNo(record["First camp"] ?? ""),
    city: record["City"] ?? "",
    state: record["State"] ?? "",
    wantsPersonalAccommodation: yesNo(record["Wants personal room"] ?? ""),
    transportNeeded: yesNo(record["Transport"] ?? ""),
    emergencyName: record["Emergency contact"] ?? "",
    emergencyPhone: record["Emergency phone"] ?? "",
    emergencyRelation: record["Emergency relation"] ?? "",
    medicalNotes: record["Medical notes"] ?? "",
    allergies: record["Allergies"] ?? "",
    childAgeYears: record["Child age"] ? Number(record["Child age"]) : undefined,
    bringingChildren: yesNo(record["Bringing children"] ?? ""),
    childrenUnder5: record["Children under 5"] ? Number(record["Children under 5"]) || 0 : 0,
    children5to11: record["Children 5 to 11"] ? Number(record["Children 5 to 11"]) || 0 : 0,
    amountPaidNaira: record["Amount paid (NGN)"] ? Number(record["Amount paid (NGN)"]) || 0 : 0,
    paymentMethod,
    sendEmail: options.sendEmail,
  };

  const parsed = adminRegistrantSchema.safeParse(candidate);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    const [field, message] = Object.entries(errors)[0] ?? ["form", "Check this row."];
    return { ok: false, error: `${field}: ${message}` };
  }

  return { ok: true, data: parsed.data };
}

export function importTemplateCsv(): string {
  const example = [
    "Jane",
    "Doe",
    "jane.doe@example.com",
    "08031234567",
    "Female",
    "Adult",
    "Disciple",
    "Legacy Center",
    "",
    "",
    "Lagos",
    "Lagos",
    "No",
    "No",
    "No",
    "John Doe",
    "08039876543",
    "Spouse",
    "",
    "",
    "",
    "No",
    "0",
    "0",
    "0",
    "Cash",
  ];
  const lines = [IMPORT_COLUMNS.join(","), example.join(",")];
  return `﻿${lines.join("\r\n")}`;
}
