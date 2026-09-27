import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { importTemplateCsv } from "@/lib/registrant-import";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin(OPS_ROLES);

  return new Response(importTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrant-import-template.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
