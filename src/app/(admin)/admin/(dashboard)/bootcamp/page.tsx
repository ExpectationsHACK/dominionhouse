import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Pagination, TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Button, ButtonLink, Eyebrow, Panel, PanelHeader, Stat } from "@/components/ui";
import { can, requireAdmin } from "@/lib/auth";
import { BOOTCAMP, bootcampPhase, bootcampStats } from "@/lib/bootcamp";
import { db } from "@/lib/db";
import { dateTimeLabel, daysUntil, relativeFromNow } from "@/lib/dates";
import { SGB_LOCATIONS } from "@/app/(site)/spiritual-growth-bootcamp/locations";
import { deleteSgbRegistration } from "./actions";
import { CopyButton } from "./copy-button";
import { sgbWhere, type SgbFilters } from "./query";

export const metadata: Metadata = { title: "Spiritual Growth Bootcamp", robots: { index: false } };

const PAGE_SIZE = 50;

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function BootcampAdminPage({
  searchParams,
}: {
  searchParams: Promise<SgbFilters & { page?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const filters: SgbFilters = {
    q: params.q || undefined,
    location: params.location || undefined,
    gender: params.gender || undefined,
    email: params.email || undefined,
  };
  const where = sgbWhere(filters);
  const page = Math.max(1, Number(params.page) || 1);

  const [stats, total, rows, emailRows] = await Promise.all([
    bootcampStats(),
    db.sgbRegistration.count({ where }),
    db.sgbRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.sgbRegistration.findMany({
      where: { email: { not: null } },
      select: { email: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const emails = [...new Set(emailRows.map((row) => row.email!))];
  const phase = bootcampPhase();
  const canDelete = can(admin.role, ["SUPER_ADMIN", "ADMIN"]);
  const activeCount = Object.values(filters).filter(Boolean).length;
  const query = new URLSearchParams(
    Object.entries(filters).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();
  const maxDaily = Math.max(1, ...stats.daily.map((day) => day.count));

  return (
    <div className="space-y-7">
      {/* ── the programme ─────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Eyebrow>Bootcamp desk</Eyebrow>
          <h1 className="display mt-3 text-5xl">{BOOTCAMP.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-ink-70">
            <Badge tone={phase === "running" ? "success" : phase === "upcoming" ? "brand" : "neutral"}>
              {phase === "upcoming"
                ? `Starts in ${daysUntil(BOOTCAMP.startsAt)} days`
                : phase === "running"
                  ? "Running now"
                  : "Finished"}
            </Badge>
            {BOOTCAMP.dateLabel} · {BOOTCAMP.venue}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={BOOTCAMP.path} target="_blank" variant="outline" size="sm">
            Public page ↗
          </ButtonLink>
          <ButtonLink href="/admin/bootcamp/export" prefetch={false} size="sm">
            Download all (CSV)
          </ButtonLink>
        </div>
      </header>

      {/* ── the numbers ───────────────────────────────────────────────── */}
      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Registered"
          value={stats.total}
          hint={stats.latest ? `Latest ${relativeFromNow(stats.latest)}` : "Nobody yet"}
          tone="brand"
        />
        <Stat label="Today" value={stats.today} hint="Since midnight, Lagos time" />
        <Stat label="Last 7 days" value={stats.lastSevenDays} />
        <Stat
          label="Gave an email"
          value={stats.withEmail}
          hint={stats.total ? `${Math.round((stats.withEmail / stats.total) * 100)}% of sign-ups` : undefined}
        />
      </div>

      {/* ── sign-ups per day ──────────────────────────────────────────── */}
      <Panel className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Eyebrow>Sign-ups per day</Eyebrow>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
            Last {stats.daily.length} days
          </p>
        </div>
        <div
          className="mt-6 flex h-40 items-end gap-[3px]"
          role="img"
          aria-label={`Sign-ups per day: ${stats.daily.map((d) => `${d.day} ${d.count}`).join(", ")}`}
        >
          {stats.daily.map((day) => (
            <div key={day.day} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap bg-ink px-1.5 py-0.5 font-mono text-[10px] text-white group-hover:block">
                {shortDate.format(new Date(`${day.day}T00:00:00Z`))}: {day.count}
              </span>
              <div
                className={day.count ? "bg-brass transition-colors group-hover:bg-ink" : "bg-ink/10"}
                style={{ height: day.count ? `${Math.max(4, (day.count / maxDaily) * 100)}%` : "2px" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
          <span>{stats.daily[0] ? shortDate.format(new Date(`${stats.daily[0].day}T00:00:00Z`)) : ""}</span>
          <span>Today</span>
        </div>
      </Panel>

      {/* ── who's coming ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Breakdown
          title="Location"
          rows={stats.locations}
          total={stats.total}
          link={(label) => `/admin/bootcamp?location=${encodeURIComponent(label)}`}
        />
        <Breakdown title="Country of residence" rows={stats.countries} total={stats.total} />
        <div className="space-y-6">
          <Breakdown
            title="Gender"
            rows={stats.gender}
            total={stats.total}
            link={(label) => `/admin/bootcamp?gender=${encodeURIComponent(label)}`}
          />
          {stats.ages.length ? (
            <Breakdown
              title="Age (early sign-ups)"
              rows={stats.ages}
              total={stats.ages.reduce((sum, row) => sum + row.count, 0)}
            />
          ) : null}
        </div>
      </div>

      {/* ── emails ────────────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title={`Emails (${emails.length})`}
          description="Every address given on the form, once each. Copy them into the Bcc line of an email, or download them."
          action={
            <div className="flex flex-wrap gap-2">
              <CopyButton text={emails.join(", ")} label="Copy all emails" />
              <ButtonLink
                href="/admin/bootcamp/export?only=emails"
                prefetch={false}
                variant="outline"
                size="sm"
              >
                Download (CSV)
              </ButtonLink>
            </div>
          }
        />
        {emails.length ? (
          <p className="max-h-40 overflow-auto px-5 py-4 font-mono text-xs leading-relaxed text-ink-70">
            {emails.join(", ")}
          </p>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-ink-45">
            No emails yet. Sign-ups from 13 November on give one.
          </p>
        )}
      </Panel>

      {/* ── registrations ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Registrations</h2>
        <FilterBar
          action="/admin/bootcamp"
          activeCount={activeCount}
          searchValue={filters.q}
          searchPlaceholder="Search name, phone, email or place"
          extra={
            activeCount ? (
              <ButtonLink href={`/admin/bootcamp/export?${query}`} prefetch={false} variant="outline" size="sm">
                Download these
              </ButtonLink>
            ) : null
          }
        >
          <FilterSelect
            name="location"
            label="Location"
            value={filters.location}
            options={[...SGB_LOCATIONS.map((place) => place.name), "Others"].map((name) => ({
              value: name,
              label: name,
            }))}
          />
          <FilterSelect
            name="gender"
            label="Gender"
            value={filters.gender}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
            ]}
          />
          <FilterSelect
            name="email"
            label="Email"
            value={filters.email}
            allLabel="Any"
            options={[
              { value: "yes", label: "Has email" },
              { value: "no", label: "No email" },
            ]}
          />
        </FilterBar>

        <TableWrap>
          <thead>
            <tr>
              <Th>Participant</Th>
              <Th>WhatsApp &amp; email</Th>
              <Th>Gender</Th>
              <Th>Location &amp; country</Th>
              {canDelete ? <Th className="text-right">Remove</Th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <TableEmpty
                colSpan={canDelete ? 5 : 4}
                message={activeCount ? "Nobody matches those filters." : "No Bootcamp registrations yet."}
              />
            ) : (
              rows.map((row) => (
                <Tr key={row.id}>
                  <Td className="align-top">
                    <p className="font-semibold">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                      {dateTimeLabel.format(row.createdAt)}
                    </p>
                  </Td>
                  <Td className="align-top">
                    <a
                      className="underline underline-offset-4"
                      href={`https://wa.me/${row.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.phone}
                    </a>
                    {row.email ? (
                      <a className="mt-1 block text-xs text-ink-45 underline underline-offset-4" href={`mailto:${row.email}`}>
                        {row.email}
                      </a>
                    ) : null}
                  </Td>
                  <Td className="align-top">
                    {row.gender}
                    {row.age ? `, ${row.age}` : ""}
                  </Td>
                  <Td className="align-top">
                    {row.location}
                    {row.country ? <p className="text-xs text-ink-45">{row.country}</p> : null}
                  </Td>
                  {canDelete ? (
                    <Td className="align-top text-right">
                      <ActionForm
                        action={deleteSgbRegistration}
                        confirm={`Remove ${row.firstName} ${row.lastName} from the Bootcamp? This can't be undone.`}
                      >
                        <input type="hidden" name="id" value={row.id} />
                        <Button type="submit" variant="ghost" size="sm" className="text-danger">
                          Remove
                        </Button>
                      </ActionForm>
                    </Td>
                  ) : null}
                </Tr>
              ))
            )}
          </tbody>
        </TableWrap>
        <Pagination
          page={page}
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          total={total}
          basePath="/admin/bootcamp"
          params={filters}
        />
      </section>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  total,
  link,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
  link?: (label: string) => string;
}) {
  return (
    <Panel className="p-6">
      <Eyebrow>{title}</Eyebrow>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-45">Nothing yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const percent = total ? Math.round((row.count / total) * 100) : 0;
            const label = link ? (
              <Link href={link(row.label)} className="hover:underline">
                {row.label}
              </Link>
            ) : (
              row.label
            );
            return (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{label}</span>
                  <span className="shrink-0 font-mono text-xs text-ink-45">
                    <span className="font-semibold text-ink">{row.count}</span> · {percent}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 bg-ink/8">
                  <div className="h-full bg-brass" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
