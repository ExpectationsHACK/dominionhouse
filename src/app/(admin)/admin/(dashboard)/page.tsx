import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Eyebrow, Notice } from "@/components/ui";
import { FINANCE_ROLES, can, requireAdmin } from "@/lib/auth";
import { campDashboard } from "@/lib/admin-stats";
import { BOOTCAMP, bootcampPhase, daysAgo } from "@/lib/bootcamp";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { campDateRange, daysUntil } from "@/lib/dates";
import { formatKobo } from "@/lib/money";
import { emailMode } from "@/lib/email/send";
import { isMockPayments } from "@/lib/paystack";

export const metadata: Metadata = { title: "DH Global Admin", robots: { index: false } };

/**
 * DH Global Admin: the front page of the admin. One card per area of the
 * house (Fresh Fire, the Bootcamp, partners, visitors), each opening its own desk.
 */
export default async function GlobalAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const admin = await requireAdmin();
  const { denied } = await searchParams;
  const camp = await requireActiveCamp();
  const showMoney = can(admin.role, FINANCE_ROLES);
  const weekAgo = daysAgo(7);

  const [campStats, sgbTotal, sgbWeek, partnersActive, partnerInterest, newVisitors, failedEmails] =
    await Promise.all([
      campDashboard(camp.id),
      db.sgbRegistration.count(),
      db.sgbRegistration.count({ where: { createdAt: { gte: weekAgo } } }),
      showMoney ? db.partner.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
      showMoney ? db.partnerInterest.count() : Promise.resolve(0),
      db.visitor.count({ where: { status: "NEW" } }),
      db.emailLog.count({ where: { status: "FAILED" } }),
    ]);

  const phase = bootcampPhase();
  const bootcampWhen =
    phase === "upcoming"
      ? `Starts in ${daysUntil(BOOTCAMP.startsAt)} days`
      : phase === "running"
        ? "Running now"
        : "Finished";

  return (
    <div className="space-y-7">
      <header>
        <Eyebrow>DH Global Admin</Eyebrow>
        <h1 className="display mt-3 text-5xl">Good to see you, {admin.name}</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-70">
          Everything across Dominion House in one place. Open a desk to work on it.
        </p>
      </header>

      {denied ? (
        <Notice tone="warn" title="That page isn't open to your role">
          Ask a super admin if you need it.
        </Notice>
      ) : null}

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

      <div className="grid gap-6 lg:grid-cols-2">
        <DeskCard
          href="/admin/camp"
          eyebrow={`Camp desk · ${campDateRange(camp.startsAt, camp.endsAt)}`}
          title={camp.name}
          note={`${daysUntil(camp.startsAt)} days to camp · ${camp.venue}`}
          figures={[
            { label: "Registered", value: campStats.total },
            { label: "Fully paid", value: campStats.paid },
            {
              label: "Collected",
              value: formatKobo(campStats.collectedKobo),
            },
            { label: "Checked in", value: campStats.checkedIn },
          ]}
        />
        <DeskCard
          href="/admin/bootcamp"
          eyebrow={`Bootcamp · ${BOOTCAMP.dateLabel}`}
          title={BOOTCAMP.name}
          note={`${bootcampWhen} · ${BOOTCAMP.venue}`}
          figures={[
            { label: "Registered", value: sgbTotal },
            { label: "Last 7 days", value: sgbWeek },
          ]}
        />
        {showMoney ? (
          <DeskCard
            href="/admin/partners"
            eyebrow="Giving"
            title="Angel Partners"
            note="Monthly partners and the Register your interest form."
            figures={[
              { label: "Active partners", value: partnersActive },
              { label: "Interest forms", value: partnerInterest },
            ]}
          />
        ) : null}
        <DeskCard
          href="/admin/visitors"
          eyebrow="Church"
          title="Visitors"
          note="Plan-a-visit forms from the Locations page."
          figures={[
            { label: "New, not followed up", value: newVisitors },
            {
              label: "Failed emails",
              value: failedEmails > 0 ? <span className="text-danger">{failedEmails}</span> : 0,
            },
          ]}
        />
      </div>
    </div>
  );
}

function DeskCard({
  href,
  eyebrow,
  title,
  note,
  figures,
}: {
  href: string;
  eyebrow: string;
  title: string;
  note: string;
  figures: { label: string; value: ReactNode }[];
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col border border-ink/12 bg-paper transition-colors hover:border-ink"
    >
      <div className="flex-1 p-6">
        <Eyebrow className="text-brass">{eyebrow}</Eyebrow>
        <h2 className="display mt-3 text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-ink-45">{note}</p>
        <dl className="mt-6 grid grid-cols-2 gap-px border border-ink/12 bg-ink/12 sm:grid-cols-4">
          {figures.map((figure) => (
            <div key={figure.label} className="bg-paper p-3.5">
              <dt className="eyebrow text-ink-45">{figure.label}</dt>
              <dd className="display mt-1.5 text-2xl">{figure.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="flex items-center justify-between border-t border-ink/12 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors group-hover:bg-ink group-hover:text-white">
        Open <span aria-hidden="true">→</span>
      </p>
    </Link>
  );
}
