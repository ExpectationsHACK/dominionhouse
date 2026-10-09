import type { Metadata } from "next";
import Link from "next/link";
import { ImportForm } from "./import-form";
import { Eyebrow, Panel, PanelHeader } from "@/components/ui";
import { IMPORT_COLUMNS } from "@/lib/registrant-import";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Import registrants", robots: { index: false } };

export default async function ImportRegistrantsPage() {
  await requireAdmin(OPS_ROLES);

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Admin desk</Eyebrow>
          <h1 className="display mt-2 text-5xl">Import registrants</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-45">
            A whole lighthouse's paper sign-up sheet, in one file. Each row is registered the
            same way the "Add registrant" form does; a row that fails doesn't stop the rest.
          </p>
        </div>
        <Link
          href="/admin/registrants/new"
          className="border border-ink px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
        >
          Add one instead
        </Link>
      </header>

      <Panel>
        <PanelHeader
          title="Upload a CSV"
          action={
            <a
              href="/admin/registrants/import/template"
              className="text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
            >
              Download template
            </a>
          }
        />
        <div className="p-5">
          <ImportForm />
        </div>
      </Panel>

      <Panel className="p-5">
        <Eyebrow>Columns</Eyebrow>
        <p className="mt-2 text-xs leading-relaxed text-ink-45">
          First name, Last name, Email, Phone and Ticket are required. Gender, Emergency
          contact and Emergency phone are required too, everything else can be left blank.
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {IMPORT_COLUMNS.map((column) => (
            <li
              key={column}
              className="border border-ink/12 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-45"
            >
              {column}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
