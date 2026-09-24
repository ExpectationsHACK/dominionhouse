import type { Metadata } from "next";
import {
  Arrow,
  Badge,
  ButtonLink,
  DataRow,
  EmptyState,
  Eyebrow,
  Meter,
  Panel,
  PanelHeader,
} from "@/components/ui";
import { requireRegistrant } from "@/lib/auth";
import { dateTimeLabel } from "@/lib/dates";
import { formatKobo, percentPaid } from "@/lib/money";
import { PAYMENT_STATUS } from "@/lib/payment-outcome";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { totalsFor } from "@/lib/registration";

export const metadata: Metadata = {
  title: "My payments",
  robots: { index: false, follow: false },
};

const METHOD_LABEL: Record<string, string> = {
  PAYSTACK: "Card / transfer",
  BANK_TRANSFER: "Bank transfer",
  CASH: "Cash",
  POS: "POS",
  WAIVER: "Bursary",
};

export default async function PortalPaymentsPage() {
  const registrant = await requireRegistrant();
  const totals = totalsFor(registrant);
  // Every attempt is shown, successful or not, so the history is the full story.
  const visible = registrant.payments;
  const payUrl = `/camp/payment?email=${encodeURIComponent(registrant.email)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Panel>
        <PanelHeader title="Payment history" description="Every payment attempt on your camp account, successful or not." />
        {visible.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No payments yet"
              description="Every payment you make, and any that don't go through, will be listed here."
              action={
                <ButtonLink href={payUrl} className="mt-4">
                  Make a payment <Arrow />
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <ul>
            {visible.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 px-5 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm">{payment.reference}</p>
                  <p className="mt-1 text-xs text-ink-45">
                    {dateTimeLabel.format(payment.paidAt ?? payment.createdAt)} ·{" "}
                    {METHOD_LABEL[payment.method] ?? payment.method}
                  </p>
                  {payment.note ? <p className={payment.status === "SUCCESS" ? "mt-1 text-xs text-ink-45" : "mt-1 text-xs text-danger"}>{payment.note}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={PAYMENT_STATUS[payment.status].tone}>
                    {PAYMENT_STATUS[payment.status].label}
                  </Badge>
                  <p className="font-mono text-sm font-semibold">{formatKobo(payment.amountKobo)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-6">
        <Panel className="p-6">
          <Eyebrow>Where you stand</Eyebrow>
          <p className="display mt-3 text-4xl">
            {totals.isSettled ? "Cleared" : formatKobo(totals.balanceKobo)}
          </p>
          <div className="mt-4">
            <Meter percent={percentPaid(totals.paidKobo, totals.dueKobo)} />
          </div>
          <div className="mt-5">
            <DataRow label="Ticket" value={CATEGORY_LABEL[registrant.category]} />
            <DataRow label="Camp fee" value={formatKobo(totals.dueKobo)} />
            <DataRow label="Paid" value={formatKobo(totals.paidKobo)} />
            <DataRow
              label="Balance"
              value={totals.balanceKobo > 0 ? formatKobo(totals.balanceKobo) : "Cleared"}
            />
          </div>
          {totals.balanceKobo > 0 ? (
            <ButtonLink href={payUrl} className="mt-6 w-full">
              Pay now <Arrow />
            </ButtonLink>
          ) : null}
        </Panel>

        <Panel className="p-6">
          <Eyebrow>Something look wrong?</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-ink-70">
            If you paid by bank transfer and it isn&apos;t showing here, send the teller or transfer
            reference to dominionhs@gmail.com and the finance desk will post it to your account.
          </p>
        </Panel>
      </div>
    </div>
  );
}
