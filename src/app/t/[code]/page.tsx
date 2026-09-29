import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutoAdmit } from "./admit";
import { HillContours } from "@/components/site/hill-contours";
import { Badge, DataRow, Eyebrow, Panel } from "@/components/ui";
import { GATE_ROLES } from "@/lib/auth";
import { isWithinCampDays, requireActiveCamp } from "@/lib/camp";
import { campDateRange } from "@/lib/dates";
import { db } from "@/lib/db";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { totalsFor } from "@/lib/registration";
import { getAdminSession } from "@/lib/session";

export const metadata: Metadata = { title: "Ticket", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const value = decodeURIComponent(code).trim().toUpperCase();

  const camp = await requireActiveCamp();

  const ticket = await db.ticket.findFirst({
    where: { OR: [{ qrPayload: code }, { qrPayload: value }, { code: value }] },
    include: { registrant: { include: { payments: { select: { amountKobo: true, status: true } } } } },
  });

  if (!ticket) notFound();

  const registrant = ticket.registrant;
  const totals = totalsFor(registrant);
  const session = await getAdminSession();
  const isGateStaff = Boolean(session && GATE_ROLES.includes(session.role));
  const withinCampDays = isWithinCampDays(camp);

  const eligibleForAutoAdmit =
    isGateStaff &&
    withinCampDays &&
    ticket.status === "VALID" &&
    totals.isSettled;

  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={18} />
      <div className="relative mx-auto max-w-lg px-5 py-16 sm:py-24">
        <Eyebrow className="text-brass">{camp.name}</Eyebrow>
        <p className="mt-2 text-sm text-white/60">
          {campDateRange(camp.startsAt, camp.endsAt)} · {camp.venue}
        </p>

        <div className="mt-8 bg-paper p-6 text-ink sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="display text-3xl">
                {registrant.firstName} {registrant.lastName}
              </h1>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-ink-45">
                {ticket.code}
              </p>
            </div>
            <TicketStatusBadge status={ticket.status} settled={totals.isSettled} />
          </div>

          <div className="mt-6 border-t border-ink/12 pt-5">
            <DataRow label="Ticket" value={CATEGORY_LABEL[registrant.category]} />
            <DataRow label="Registration" value={registrant.registrationCode} />
            {ticket.checkedInAt ? (
              <DataRow label="Checked in" value={ticket.checkedInAt.toLocaleString()} />
            ) : null}
          </div>

          {!totals.isSettled ? (
            <p className="mt-5 border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
              There's a balance outstanding on this registration.
            </p>
          ) : null}

          {isGateStaff && !withinCampDays ? (
            <p className="mt-5 border border-ink/15 bg-bone px-4 py-3 text-sm text-ink-70">
              Camp hasn't started yet, showing their details only.
            </p>
          ) : null}

          {eligibleForAutoAdmit ? <AutoAdmit ticketId={ticket.id} /> : null}
        </div>
      </div>
    </div>
  );
}

function TicketStatusBadge({ status, settled }: { status: string; settled: boolean }) {
  if (status === "REVOKED") return <Badge tone="danger">Revoked</Badge>;
  if (status === "CHECKED_IN") return <Badge tone="success">Checked in</Badge>;
  if (!settled) return <Badge tone="warn">Unpaid</Badge>;
  return <Badge tone="brand">Valid</Badge>;
}
