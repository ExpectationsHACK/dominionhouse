import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Pagination, TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Meter, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { dateOnly } from "@/lib/dates";
import { formatKobo, percentPaid } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { LIGHTHOUSES_OR_MINISTRIES } from "@/lib/church";
import {
  buildRegistrantOrder,
  buildRegistrantWhere,
  countActiveFilters,
  PAGE_SIZE,
  parsePage,
  type RegistrantFilters,
} from "@/lib/registrant-query";
import { totalsFor } from "@/lib/registration";

export const metadata: Metadata = { title: "Registrants", robots: { index: false } };

export default async function RegistrantsPage({
  searchParams,
}: {
  searchParams: Promise<RegistrantFilters>;
}) {
  await requireAdmin();
  const camp = await requireActiveCamp();
  const filters = await searchParams;

  const where = buildRegistrantWhere(camp.id, filters);
  const page = parsePage(filters.page);

  const [rows, total, departments] = await Promise.all([
    db.registrant.findMany({
      where,
      orderBy: buildRegistrantOrder(filters.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        payments: { select: { amountKobo: true, status: true } },
        ticket: { select: { code: true, status: true } },
        roomAssignment: { include: { room: { select: { block: true, name: true } } } },
      },
    }),
    db.registrant.count({ where }),
    db.registrant.findMany({
      where: { campId: camp.id, department: { not: null } },
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilters = countActiveFilters(filters);

  const exportQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value && key !== "page") exportQuery.set(key, value);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{total} matching</Eyebrow>
          <h1 className="display mt-2 text-5xl">Registrants</h1>
        </div>
        <Link
          href={`/admin/registrants/export?${exportQuery.toString()}`}
          className="border border-ink px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
          prefetch={false}
        >
          Export CSV
        </Link>
      </header>

      <FilterBar action="/admin/registrants" activeCount={activeFilters} searchValue={filters.q}>
        <FilterSelect
          name="position"
          label="Position"
          value={filters.position}
          options={POSITION_OPTIONS.map((position) => ({
            value: position,
            label: POSITION_LABEL[position],
          }))}
        />
        <FilterSelect
          name="category"
          label="Ticket"
          value={filters.category}
          options={(["ADULT", "STUDENT", "TEEN", "CHILD"] as const).map((category) => ({
            value: category,
            label: CATEGORY_LABEL[category],
          }))}
        />
        <FilterSelect
          name="status"
          label="Payment"
          value={filters.status}
          options={[
            { value: "PAID", label: "Paid in full" },
            { value: "PARTIALLY_PAID", label: "Part paid" },
            { value: "PENDING", label: "Unpaid" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "WAITLISTED", label: "Waitlisted" },
          ]}
        />
        <FilterSelect
          name="gender"
          label="Gender"
          value={filters.gender}
          options={[
            { value: "MALE", label: "Male" },
            { value: "FEMALE", label: "Female" },
          ]}
        />
        <FilterSelect
          name="room"
          label="Room"
          value={filters.room}
          options={[
            { value: "assigned", label: "Assigned" },
            { value: "unassigned", label: "Needs a room" },
            { value: "personal", label: "Wants personal room" },
          ]}
        />
        <FilterSelect
          name="lighthouse"
          label="Lighthouse or Ministry"
          value={filters.lighthouse}
          options={LIGHTHOUSES_OR_MINISTRIES.map((lighthouse) => ({ value: lighthouse, label: lighthouse }))}
        />
        {departments.length > 0 ? (
          <FilterSelect
            name="department"
            label="Department"
            value={filters.department}
            options={departments
              .map((row) => row.department)
              .filter((value): value is string => Boolean(value))
              .map((value) => ({ value, label: value }))}
          />
        ) : null}
        <FilterSelect
          name="sort"
          label="Sort"
          value={filters.sort}
          allLabel="Newest first"
          options={[
            { value: "name", label: "Surname A–Z" },
            { value: "position", label: "Position" },
            { value: "owing", label: "Owing first" },
            { value: "oldest", label: "Oldest first" },
          ]}
        />
      </FilterBar>

      <TableWrap>
        <thead>
          <tr>
            <Th>Registrant</Th>
            <Th>Position</Th>
            <Th>Ticket</Th>
            <Th>Payment</Th>
            <Th>Room</Th>
            <Th>Registered</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={6} message="Nobody matches those filters." />
          ) : (
            rows.map((registrant) => {
              const totals = totalsFor(registrant);
              return (
                <Tr key={registrant.id}>
                  <Td>
                    <Link
                      href={`/admin/registrants/${registrant.id}`}
                      className="font-semibold hover:underline"
                    >
                      {registrant.firstName} {registrant.lastName}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-45">{registrant.email}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                      {registrant.registrationCode}
                      {registrant.ticket ? ` · ${registrant.ticket.code}` : ""}
                    </p>
                  </Td>
                  <Td>
                    <p className="text-sm">{POSITION_LABEL[registrant.position]}</p>
                    {registrant.department ? (
                      <p className="mt-0.5 text-xs text-ink-45">{registrant.department}</p>
                    ) : null}
                    {registrant.lighthouse || registrant.region ? (
                      <p className="mt-0.5 text-xs text-ink-45">
                        {registrant.lighthouse ?? registrant.region}
                      </p>
                    ) : null}
                  </Td>
                  <Td>
                    <p className="text-sm">{CATEGORY_LABEL[registrant.category]}</p>
                    <p className="mt-0.5 text-xs text-ink-45">
                      {registrant.gender === "MALE" ? "Male" : "Female"}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={registrant.status} />
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-ink-45">
                      {formatKobo(totals.paidKobo)} / {formatKobo(totals.dueKobo)}
                    </p>
                    <div className="mt-1.5 w-28">
                      <Meter percent={percentPaid(totals.paidKobo, totals.dueKobo)} />
                    </div>
                  </Td>
                  <Td>
                    {registrant.roomAssignment ? (
                      <span className="font-mono text-xs">
                        {registrant.roomAssignment.room.block} {registrant.roomAssignment.room.name}
                        {registrant.roomAssignment.bedLabel
                          ? ` · ${registrant.roomAssignment.bedLabel}`
                          : ""}
                      </span>
                    ) : (
                      <Badge tone="warn">Needs a bed</Badge>
                    )}
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-ink-45">
                      {dateOnly.format(registrant.createdAt)}
                    </span>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </TableWrap>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/admin/registrants"
        params={filters as Record<string, string | undefined>}
      />
    </div>
  );
}
