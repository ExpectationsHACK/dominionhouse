import type { Metadata } from "next";
import Link from "next/link";
import {
  Arrow,
  ButtonLink,
  DataRow,
  Eyebrow,
  Meter,
  Notice,
  Panel,
  PanelHeader,
} from "@/components/ui";
import { requireRegistrant } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayLabel, daysUntil, timeLabel } from "@/lib/dates";
import { formatKobo, percentPaid } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL } from "@/lib/positions";
import { totalsFor } from "@/lib/registration";

export const metadata: Metadata = {
  title: "My camp",
  robots: { index: false, follow: false },
};

export default async function PortalOverviewPage() {
  const registrant = await requireRegistrant();
  const totals = totalsFor(registrant);

  const [nextUp, announcements] = await Promise.all([
    db.scheduleItem.findMany({
      where: { campId: registrant.campId, isPublished: true },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    db.announcement.findMany({
      where: { campId: registrant.campId, publishedAt: { not: null } },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      {!totals.isSettled ? (
        <Notice tone="warn" title={`${formatKobo(totals.balanceKobo)} left on your camp fee`}>
          <p className="mt-1">
            Your ticket is issued automatically the moment this clears.{" "}
            <Link
              href={`/camp/payment?email=${encodeURIComponent(registrant.email)}`}
              className="font-semibold underline underline-offset-4"
            >
              Make a payment
            </Link>
            .
          </p>
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="p-6 lg:col-span-2">
          <Eyebrow>Camp account</Eyebrow>
          <p className="display mt-3 text-5xl">
            {totals.isSettled ? "Paid in full" : formatKobo(totals.balanceKobo)}
          </p>
          <p className="mt-1 text-sm text-ink-45">
            {totals.isSettled
              ? "Nothing outstanding. See you at camp meeting."
              : "still to pay on your camp fee"}
          </p>

          <div className="mt-7">
            <div className="flex items-baseline justify-between gap-4">
              <p className="eyebrow text-ink-45">
                {formatKobo(totals.paidKobo)} of {formatKobo(totals.dueKobo)}
              </p>
              <p className="font-mono text-sm font-semibold">
                {percentPaid(totals.paidKobo, totals.dueKobo)}%
              </p>
            </div>
            <div className="mt-2.5">
              <Meter percent={percentPaid(totals.paidKobo, totals.dueKobo)} />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {totals.isSettled ? (
              <ButtonLink href="/portal/ticket">
                View my ticket <Arrow />
              </ButtonLink>
            ) : (
              <ButtonLink href={`/camp/payment?email=${encodeURIComponent(registrant.email)}`}>
                Pay now <Arrow />
              </ButtonLink>
            )}
            <ButtonLink href="/portal/payments" variant="outline">
              Payment history
            </ButtonLink>
          </div>
        </Panel>

        <Panel className="p-6">
          <Eyebrow>Counting down</Eyebrow>
          <p className="display mt-3 text-6xl text-meridian">{daysUntil(registrant.camp.startsAt)}</p>
          <p className="mt-1 text-sm text-ink-45">days until camp opens</p>

          <div className="mt-6">
            <DataRow label="Ticket" value={CATEGORY_LABEL[registrant.category]} />
            <DataRow label="Position" value={POSITION_LABEL[registrant.position]} />
            <DataRow
              label="Room"
              value={
                registrant.roomAssignment
                  ? `${registrant.roomAssignment.room.block} ${registrant.roomAssignment.room.name}`
                  : "Not yet assigned"
              }
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="First on the programme"
            action={
              <Link
                href="/portal/schedule"
                className="text-[12px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
              >
                Full schedule
              </Link>
            }
          />
          <ul>
            {nextUp.map((item) => (
              <li key={item.id} className="border-b border-ink/10 px-5 py-4 last:border-0">
                <p className="font-mono text-xs text-ink-45">
                  {dayLabel.format(item.day)} · {timeLabel.format(item.startsAt)}
                </p>
                <p className="mt-1 text-sm font-semibold">{item.title}</p>
                {item.speaker ? (
                  <p className="mt-0.5 text-xs text-ink-45">{item.speaker}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="From the camp desk" />
          {announcements.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-45">Nothing yet. We&apos;ll post here.</p>
          ) : (
            <ul>
              {announcements.map((item) => (
                <li key={item.id} className="border-b border-ink/10 px-5 py-4 last:border-0">
                  <div className="flex items-center gap-2">
                    {item.isPinned ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">
                        Pinned
                      </span>
                    ) : null}
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-70">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
