import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Pagination, TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Stat } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { dateTimeLabel } from "@/lib/dates";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL } from "@/lib/positions";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Tickets", robots: { index: false } };

const PAGE_SIZE = 40;
const STATUSES = new Set(["VALID", "CHECKED_IN", "REVOKED"]);

type Filters = { q?: string; status?: string; emailed?: string; page?: string };

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  await requireAdmin();
  const camp = await requireActiveCamp();
  const filters = await searchParams;

  const where: Prisma.TicketWhereInput = { registrant: { campId: camp.id } };
  const and: Prisma.TicketWhereInput[] = [];

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { registrant: { firstName: { contains: q, mode: "insensitive" } } },
        { registrant: { lastName: { contains: q, mode: "insensitive" } } },
        { registrant: { email: { contains: q, mode: "insensitive" } } },
        { registrant: { registrationCode: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (filters.status && STATUSES.has(filters.status)) and.push({ status: filters.status as never });
  if (filters.emailed === "no") and.push({ emailSentAt: null });
  if (filters.emailed === "yes") and.push({ emailSentAt: { not: null } });
  if (and.length) where.AND = and;

  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);

  const [rows, total, valid, checkedIn, revoked, notEmailed] = await Promise.all([
    db.ticket.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        registrant: { include: { roomAssignment: { include: { room: true } } } },
        checkedInBy: true,
      },
    }),
    db.ticket.count({ where }),
    db.ticket.count({ where: { registrant: { campId: camp.id }, status: "VALID" } }),
    db.ticket.count({ where: { registrant: { campId: camp.id }, status: "CHECKED_IN" } }),
    db.ticket.count({ where: { registrant: { campId: camp.id }, status: "REVOKED" } }),
    db.ticket.count({ where: { registrant: { campId: camp.id }, emailSentAt: null } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Issued automatically on full payment</Eyebrow>
        <h1 className="display mt-2 text-5xl">Tickets</h1>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Valid" value={valid} tone="brand" />
        <Stat label="Checked in" value={checkedIn} />
        <Stat label="Revoked" value={revoked} />
        <Stat label="Not emailed" value={notEmailed} hint="Delivery still pending or failed" />
      </div>

      <FilterBar
        action="/admin/tickets"
        activeCount={[filters.q, filters.status, filters.emailed].filter(Boolean).length}
        searchValue={filters.q}
        searchPlaceholder="Search ticket number, name or email"
      >
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={[
            { value: "VALID", label: "Valid" },
            { value: "CHECKED_IN", label: "Checked in" },
            { value: "REVOKED", label: "Revoked" },
          ]}
        />
        <FilterSelect
          name="emailed"
          label="Emailed"
          value={filters.emailed}
          options={[
            { value: "yes", label: "Sent" },
            { value: "no", label: "Not sent" },
          ]}
        />
      </FilterBar>

      <TableWrap>
        <thead>
          <tr>
            <Th>Ticket</Th>
            <Th>Holder</Th>
            <Th>Room</Th>
            <Th>Status</Th>
            <Th>Issued</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5} message="No tickets match those filters." />
          ) : (
            rows.map((ticket) => (
              <Tr key={ticket.id}>
                <Td>
                  <span className="font-mono text-sm font-semibold">{ticket.code}</span>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                    {ticket.registrant.registrationCode}
                  </p>
                </Td>
                <Td>
                  <Link
                    href={`/admin/registrants/${ticket.registrantId}`}
                    className="font-semibold hover:underline"
                  >
                    {ticket.registrant.firstName} {ticket.registrant.lastName}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-45">
                    {CATEGORY_LABEL[ticket.registrant.category]} ·{" "}
                    {POSITION_LABEL[ticket.registrant.position]}
                  </p>
                </Td>
                <Td>
                  {ticket.registrant.roomAssignment ? (
                    <span className="font-mono text-xs">
                      {ticket.registrant.roomAssignment.room.block}{" "}
                      {ticket.registrant.roomAssignment.room.name}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-45">, </span>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      tone={
                        ticket.status === "CHECKED_IN"
                          ? "success"
                          : ticket.status === "REVOKED"
                            ? "danger"
                            : "brand"
                      }
                    >
                      {ticket.status.replace("_", " ").toLowerCase()}
                    </Badge>
                    {!ticket.emailSentAt ? <Badge tone="warn">not emailed</Badge> : null}
                  </div>
                  {ticket.checkedInBy ? (
                    <p className="mt-1 text-xs text-ink-45">by {ticket.checkedInBy.name}</p>
                  ) : null}
                </Td>
                <Td>
                  <span className="font-mono text-xs text-ink-45">
                    {dateTimeLabel.format(ticket.issuedAt)}
                  </span>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/admin/tickets"
        params={filters as Record<string, string | undefined>}
      />
    </div>
  );
}
