import type { Metadata } from "next";
import Link from "next/link";
import { Scanner } from "./scanner";
import { undoCheckIn } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { Eyebrow, Panel, PanelHeader, Stat } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { GATE_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { timeLabel } from "@/lib/dates";

export const metadata: Metadata = { title: "Check-in", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  await requireAdmin(GATE_ROLES);
  const camp = await requireActiveCamp();

  const [checkedIn, issued, recent] = await Promise.all([
    db.ticket.count({ where: { registrant: { campId: camp.id }, status: "CHECKED_IN" } }),
    db.ticket.count({ where: { registrant: { campId: camp.id } } }),
    db.ticket.findMany({
      where: { registrant: { campId: camp.id }, status: "CHECKED_IN" },
      orderBy: { checkedInAt: "desc" },
      take: 12,
      include: { registrant: true, checkedInBy: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>The gate</Eyebrow>
          <h1 className="display mt-2 text-5xl">Check-in</h1>
        </div>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-3">
        <Stat label="Checked in" value={checkedIn} tone="brand" />
        <Stat label="Tickets issued" value={issued} />
        <Stat label="Still to arrive" value={Math.max(0, issued - checkedIn)} />
      </div>

      <Scanner />

      <Panel>
        <PanelHeader title="Just arrived" description="The last twelve people through the gate." />
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-45">Nobody has checked in yet.</p>
        ) : (
          <ul>
            {recent.map((ticket) => (
              <li
                key={ticket.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/registrants/${ticket.registrantId}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {ticket.registrant.firstName} {ticket.registrant.lastName}
                  </Link>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-45">
                    {ticket.code}
                    {ticket.checkedInAt ? ` · ${timeLabel.format(ticket.checkedInAt)}` : ""}
                    {ticket.checkedInBy ? ` · ${ticket.checkedInBy.name}` : ""}
                  </p>
                </div>
                <ActionForm action={undoCheckIn} confirm="Undo this check-in?">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <SubmitButton size="sm" variant="ghost" withArrow={false} pendingLabel="…">
                    Undo
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
