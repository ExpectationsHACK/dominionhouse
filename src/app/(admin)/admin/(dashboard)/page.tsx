import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Eyebrow, Meter, Notice, Panel, PanelHeader, Stat, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { campDashboard } from "@/lib/admin-stats";
import { requireActiveCamp } from "@/lib/camp";
import { dateTimeLabel } from "@/lib/dates";
import { formatKobo, percentPaid } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL } from "@/lib/positions";
import { emailMode } from "@/lib/email/send";
import { isMockPayments } from "@/lib/paystack";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const camp = await requireActiveCamp();
  const stats = await campDashboard(camp.id);

  const collectionRate = percentPaid(stats.collectedKobo, stats.expectedKobo);

  return (
    <div className="space-y-7">
      <header>
        <Eyebrow>{camp.name}</Eyebrow>
        <h1 className="display mt-3 text-5xl">Good to see you, {admin.name}</h1>
      </header>

      {isMockPayments || emailMode === "console" ? (
        <Notice tone="warn" title="Running in test mode">
          <ul className="mt-1 space-y-0.5 text-sm">
            {isMockPayments ? <li>Payments are simulated, no Paystack keys configured.</li> : null}
            {emailMode === "console" ? (
              <li>Emails are logged to the outbox but not delivered, no Resend key configured.</li>
            ) : null}
          </ul>
        </Notice>
      ) : null}

      {/* ── the four numbers that matter ─────────────────────────────────── */}
      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Registered"
          value={stats.total}
          hint={`${stats.paid} paid · ${stats.partiallyPaid} part · ${stats.pending} unpaid`}
          tone="brand"
        />
        <Stat
          label="Collected"
          value={formatKobo(stats.collectedKobo)}
          hint={`${collectionRate}% of ${formatKobo(stats.expectedKobo)} expected`}
        />
        <Stat
          label="Outstanding"
          value={formatKobo(stats.outstandingKobo)}
          hint={`${stats.partiallyPaid + stats.pending} people still owe`}
        />
        <Stat
          label="Beds filled"
          value={`${stats.occupancy.filled}/${stats.occupancy.beds}`}
          hint={`${stats.unroomed} waiting on a room`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ── money ─────────────────────────────────────────────────────── */}
        <Panel className="p-6 xl:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Eyebrow>Collection against target</Eyebrow>
            <p className="font-mono text-sm font-semibold">{collectionRate}%</p>
          </div>
          <p className="display mt-3 text-5xl">{formatKobo(stats.collectedKobo)}</p>
          <p className="mt-1 text-sm text-ink-45">
            across {stats.paymentCount} payments · {formatKobo(stats.expectedKobo)} expected in total
          </p>
          <div className="mt-5">
            <Meter percent={collectionRate} />
          </div>

          <div className="mt-7 grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-4">
            {stats.byCategory.map((row) => (
              <div key={row.category} className="bg-paper p-4">
                <p className="eyebrow text-ink-45">{CATEGORY_LABEL[row.category]}</p>
                <p className="display mt-2 text-3xl">{row.count}</p>
                <p className="mt-1 font-mono text-[11px] text-ink-45">
                  {formatKobo(row.expectedKobo)}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── operations ────────────────────────────────────────────────── */}
        <Panel className="p-6">
          <Eyebrow>Camp operations</Eyebrow>
          <dl className="mt-4 space-y-3.5">
            <OpRow label="Tickets issued" value={`${stats.ticketsIssued} of ${stats.total}`} />
            <OpRow label="Checked in" value={String(stats.checkedIn)} />
            <OpRow
              label="Need a bed"
              value={`${stats.accommodationNeeded} people`}
            />
            <OpRow label="Rooms free" value={`${stats.occupancy.free} beds`} />
            <OpRow
              label="New visitor forms"
              value={
                stats.newVisitors > 0 ? (
                  <Link href="/admin/visitors" className="underline underline-offset-4">
                    {stats.newVisitors} waiting
                  </Link>
                ) : (
                  "None"
                )
              }
            />
            <OpRow
              label="Failed emails"
              value={
                stats.failedEmails > 0 ? (
                  <Link href="/admin/emails?status=FAILED" className="text-danger underline underline-offset-4">
                    {stats.failedEmails}
                  </Link>
                ) : (
                  "None"
                )
              }
            />
          </dl>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Latest registrations"
            action={
              <Link
                href="/admin/registrants"
                className="text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
              >
                All registrants
              </Link>
            }
          />
          <ul>
            {stats.recentRegistrants.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-ink-45">Nobody yet.</li>
            ) : (
              stats.recentRegistrants.map((registrant) => (
                <li key={registrant.id} className="border-b border-ink/10 last:border-0">
                  <Link
                    href={`/admin/registrants/${registrant.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bone"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {registrant.firstName} {registrant.lastName}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-45">
                        {POSITION_LABEL[registrant.position]} ·{" "}
                        {registrant.priceTier?.label ?? CATEGORY_LABEL[registrant.category]} ·{" "}
                        {dateTimeLabel.format(registrant.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={registrant.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader
            title="Latest payments"
            action={
              <Link
                href="/admin/payments"
                className="text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
              >
                All payments
              </Link>
            }
          />
          <ul>
            {stats.recentPayments.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-ink-45">No payments yet.</li>
            ) : (
              stats.recentPayments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5 last:border-0"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/registrants/${payment.registrantId}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {payment.registrant.firstName} {payment.registrant.lastName}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-ink-45">
                      {payment.reference} ·{" "}
                      {dateTimeLabel.format(payment.paidAt ?? payment.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge tone="neutral">{payment.method.replace("_", " ").toLowerCase()}</Badge>
                    <p className="font-mono text-sm font-semibold">
                      {formatKobo(payment.amountKobo)}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>

      <Panel className="p-6">
        <Eyebrow>Who&apos;s coming</Eyebrow>
        <div className="mt-5 flex flex-wrap gap-2">
          {stats.byPosition.map((row) => (
            <Link
              key={row.position}
              href={`/admin/registrants?position=${row.position}`}
              className="flex items-baseline gap-2 border border-ink/15 px-3 py-2 transition-colors hover:border-ink"
            >
              <span className="text-sm font-medium">{POSITION_LABEL[row.position]}</span>
              <span className="font-mono text-sm font-semibold text-brass">{row.count}</span>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function OpRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3 last:border-0 last:pb-0">
      <dt className="eyebrow text-ink-45">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}
