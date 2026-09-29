"use client";

import { useEffect, useState } from "react";
import { admitFromTicketLink } from "@/app/(admin)/admin/(dashboard)/check-in/actions";

/**
 * Fires the moment a gate staff member's phone opens this page from a scan,
 * no extra tap, the person is already standing there. A plain link preview
 * (chat apps unfurling the URL) never runs this, only a real browser does.
 */
export function AutoAdmit({ ticketId }: { ticketId: string }) {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    admitFromTicketLink(ticketId).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  if (!state) {
    return (
      <p className="mt-6 border border-ink/15 bg-bone px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-ink-45">
        Checking in…
      </p>
    );
  }

  return (
    <p
      className={
        state.ok
          ? "mt-6 border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success"
          : "mt-6 border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
      }
    >
      {state.message}
    </p>
  );
}
