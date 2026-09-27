"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { csvToRecords } from "@/lib/csv";
import { createManualRegistrant } from "@/lib/manual-registration";
import { rowToAdminRegistrantInput } from "@/lib/registrant-import";

export type ImportRowResult = { row: number; name: string; ok: boolean; message: string };

export type ImportState = {
  error?: string;
  summary?: string;
  results?: ImportRowResult[];
};

const MAX_ROWS = 500;

export async function importRegistrantsCsv(
  _previous: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const admin = await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to upload." };
  }
  if (file.size > 2_000_000) {
    return { error: "That file is too large. Split it into smaller batches." };
  }

  const sendEmail = formData.get("sendEmail") === "on";
  const text = await file.text();
  const records = csvToRecords(text);

  if (records.length === 0) {
    return { error: "No rows found. Check the file has a header row and at least one registrant." };
  }
  if (records.length > MAX_ROWS) {
    return { error: `That's ${records.length} rows, split it into batches of ${MAX_ROWS} or fewer.` };
  }

  const results: ImportRowResult[] = [];
  let created = 0;

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2; // header is row 1
    const name = `${record["First name"] ?? ""} ${record["Last name"] ?? ""}`.trim() || `Row ${rowNumber}`;

    const mapped = rowToAdminRegistrantInput(record, { sendEmail });
    if (!mapped.ok) {
      results.push({ row: rowNumber, name, ok: false, message: mapped.error });
      continue;
    }

    const result = await createManualRegistrant(camp, admin, mapped.data);
    if (!result.ok) {
      results.push({ row: rowNumber, name, ok: false, message: result.error });
      continue;
    }

    created += 1;
    results.push({ row: rowNumber, name, ok: true, message: result.registrationCode });
  }

  await audit({
    actor: admin,
    action: "registrant.imported",
    entity: "Registrant",
    meta: { fileName: file.name, rows: records.length, created },
  });

  revalidatePath("/admin/registrants");
  revalidatePath("/admin");

  return {
    summary: `${created} of ${records.length} row${records.length === 1 ? "" : "s"} registered.`,
    results,
  };
}
