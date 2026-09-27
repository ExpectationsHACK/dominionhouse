"use client";

import { useActionState } from "react";
import { importRegistrantsCsv, type ImportState } from "./actions";
import { Notice } from "@/components/ui";
import { Checkbox } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

const initialState: ImportState = {};

export function ImportForm() {
  const [state, formAction] = useActionState<ImportState, FormData>(importRegistrantsCsv, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.summary ? <Notice tone="success">{state.summary}</Notice> : null}

      <div className="space-y-1.5">
        <label htmlFor="file" className="eyebrow text-ink-70">
          CSV file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full border border-ink/20 bg-paper px-3.5 py-3 text-sm file:mr-4 file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.08em] file:text-white"
        />
      </div>

      <Checkbox
        name="sendEmail"
        label="Email each person their registration confirmation"
        description="Off by default for a bulk backfill. A payment recorded in the sheet always emails its receipt and ticket regardless."
      />

      <SubmitButton pendingLabel="Importing…">Import</SubmitButton>

      {state.results && state.results.length > 0 ? (
        <div className="border border-ink/12">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/12 bg-ink/5 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {state.results.map((row) => (
                <tr key={row.row} className="border-b border-ink/8 last:border-0">
                  <td className="px-3 py-2 font-mono text-xs text-ink-45">{row.row}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-xs",
                      row.ok ? "text-success" : "font-medium text-danger",
                    )}
                  >
                    {row.ok ? `Registered · ${row.message}` : row.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
