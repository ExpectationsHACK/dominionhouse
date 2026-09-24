import type { Metadata } from "next";
import { TicketStub } from "@/components/camp/ticket-stub";
import { Arrow, ButtonLink, EmptyState, Eyebrow, Notice } from "@/components/ui";
import { requireRegistrant } from "@/lib/auth";
import { campDateRange } from "@/lib/dates";
import { formatKobo } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { ticketQrDataUrl, totalsFor } from "@/lib/registration";

export const metadata: Metadata = {
  title: "My ticket",
  robots: { index: false, follow: false },
};

export default async function PortalTicketPage() {
  const registrant = await requireRegistrant();
  const totals = totalsFor(registrant);

  if (!registrant.ticket) {
    return (
      <EmptyState
        title="No ticket yet"
        description={`Your ticket is issued the moment your balance clears. ${formatKobo(totals.balanceKobo)} to go.`}
        action={
          <ButtonLink
            href={`/camp/payment?email=${encodeURIComponent(registrant.email)}`}
            className="mt-4"
          >
            Pay the balance <Arrow />
          </ButtonLink>
        }
      />
    );
  }

  const qrDataUrl = await ticketQrDataUrl(registrant.ticket.qrPayload);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_1fr]">
      <div>
        {registrant.ticket.status !== "REVOKED" ? (
          // A plain anchor, not a Link: this is a file response, not a page.
          <a
            href="/portal/ticket/download"
            download
            className="mb-4 inline-flex w-full items-center justify-center gap-2 border border-ink bg-ink px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:border-brass hover:bg-brass sm:w-auto"
          >
            Download my ticket
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 13.5h11" strokeLinecap="square" />
            </svg>
          </a>
        ) : null}
        <TicketStub
          name={`${registrant.firstName} ${registrant.lastName}`}
          category={CATEGORY_LABEL[registrant.category]}
          registrationCode={registrant.registrationCode}
          ticketCode={registrant.ticket.code}
          qrDataUrl={qrDataUrl}
          campName={registrant.camp.name}
          dates={campDateRange(registrant.camp.startsAt, registrant.camp.endsAt)}
          venue={registrant.camp.venue}
          status={registrant.ticket.status}
          room={
            registrant.roomAssignment
              ? {
                  block: registrant.roomAssignment.room.block,
                  name: registrant.roomAssignment.room.name,
                  bedLabel: registrant.roomAssignment.bedLabel,
                }
              : null
          }
        />
      </div>

      <div className="space-y-5">
        <div>
          <Eyebrow>At the gate</Eyebrow>
          <h2 className="display mt-3 text-3xl">How this works</h2>
          <ol className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-70">
            <li className="flex gap-3">
              <span className="font-mono text-sm text-brass">01</span>
              Bring this on your phone: screenshot it in case the signal at camp lets you
              down.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm text-brass">02</span>
              An usher scans the QR code. It works once, and it&apos;s tied to your name.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-sm text-brass">03</span>
              You collect your wristband and room key at the same desk.
            </li>
          </ol>
        </div>

        {registrant.ticket.status === "CHECKED_IN" ? (
          <Notice tone="success" title="Already checked in">
            You were scanned in at the gate. Keep the ticket for your room key.
          </Notice>
        ) : null}

        {registrant.ticket.status === "REVOKED" ? (
          <Notice tone="danger" title="This ticket has been revoked">
            Speak to the camp desk before you travel, dominionhs@gmail.com.
          </Notice>
        ) : null}

        <Notice tone="neutral" title="Sent to your inbox too">
          A copy went to {registrant.email}
          {registrant.ticket.emailSentAt ? "" : " and is being delivered now"}. Don&apos;t forward
          it, the QR code is what gets you in.
        </Notice>
      </div>
    </div>
  );
}
