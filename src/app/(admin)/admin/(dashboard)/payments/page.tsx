import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Pagination, TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Stat } from "@/components/ui";
import { FINANCE_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { dateTimeLabel } from "@/lib/dates";
import { PAYMENT_STATUS } from "@/lib/payment-outcome";
import { formatKobo } from "@/lib/money";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

const PAGE_SIZE = 40;

const METHODS = new Set(["PAYSTACK", "BANK_TRANSFER", "CASH", "POS", "WAIVER"]);
const STATUSES = new Set(["SUCCESS", "PENDING", "FAILED", "DECLINED", "ABANDONED", "REVERSED"]);

type Filters = { q?: string; method?: string; status?: string; page?: string };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  await requireAdmin(FINANCE_ROLES);
  const camp = await requireActiveCamp();
  const filters = await searchParams;

  const where: Prisma.PaymentWhereInput = { registrant: { campId: camp.id } };
  const and: Prisma.PaymentWhereInput[] = [];

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { registrant: { firstName: { contains: q, mode: "insensitive" } } },
        { registrant: { lastName: { contains: q, mode: "insensitive" } } },
        { registrant: { email: { contains: q, mode: "insensitive" } } },
        { registrant: { registrationCode: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (filters.method && METHODS.has(filters.method)) and.push({ method: filters.method as never });
  if (filters.status && STATUSES.has(filters.status)) and.push({ status: filters.status as never });
  if (and.length) where.AND = and;

  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);

  const [rows, total, successTotal, byMethod] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { registrant: true, recordedBy: true },
    }),
    db.payment.count({ where }),
    db.payment.aggregate({
      where: { ...where, status: "SUCCESS" },
      _sum: { amountKobo: true },
      _count: { _all: true },
    }),
    db.payment.groupBy({
      by: ["method"],
      where: { registrant: { campId: camp.id }, status: "SUCCESS" },
      _sum: { amountKobo: true },
      _count: { _all: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilters = [filters.q, filters.method, filters.status].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Finance</Eyebrow>
        <h1 className="display mt-2 text-5xl">Payments</h1>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Matched total"
          value={formatKobo(successTotal._sum.amountKobo ?? 0)}
          hint={`${successTotal._count._all} successful payments`}
          tone="brand"
        />
        {byMethod
          .sort((a, b) => (b._sum.amountKobo ?? 0) - (a._sum.amountKobo ?? 0))
          .slice(0, 3)
          .map((row) => (
            <Stat
              key={row.method}
              label={row.method.replace("_", " ").toLowerCase()}
              value={formatKobo(row._sum.amountKobo ?? 0)}
              hint={`${row._count._all} payments`}
            />
          ))}
      </div>

      <FilterBar
        action="/admin/payments"
        activeCount={activeFilters}
        searchValue={filters.q}
        searchPlaceholder="Search reference, name, email or code"
      >
        <FilterSelect
          name="method"
          label="Method"
          value={filters.method}
          options={[
            { value: "PAYSTACK", label: "Paystack" },
            { value: "BANK_TRANSFER", label: "Bank transfer" },
            { value: "CASH", label: "Cash" },
            { value: "POS", label: "POS" },
            { value: "WAIVER", label: "Bursary" },
          ]}
        />
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={[
            { value: "SUCCESS", label: "Successful" },
            { value: "PENDING", label: "Pending" },
            { value: "FAILED", label: "Failed" },
            { value: "DECLINED", label: "Declined" },
            { value: "ABANDONED", label: "Not completed" },
            { value: "REVERSED", label: "Reversed" },
          ]}
        />
      </FilterBar>

      <TableWrap>
        <thead>
          <tr>
            <Th>Reference</Th>
            <Th>Registrant</Th>
            <Th>Method</Th>
            <Th>Status</Th>
            <Th align="right">Amount</Th>
            <Th>When</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={6} message="No payments match those filters." />
          ) : (
            rows.map((payment) => (
              <Tr key={payment.id}>
                <Td>
                  <span className="font-mono text-xs">{payment.reference}</span>
                  {payment.note ? (
                    <p className="mt-0.5 text-xs text-ink-45">{payment.note}</p>
                  ) : null}
                </Td>
                <Td>
                  <Link
                    href={`/admin/registrants/${payment.registrantId}`}
                    className="font-semibold hover:underline"
                  >
                    {payment.registrant.firstName} {payment.registrant.lastName}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-45">{payment.registrant.email}</p>
                </Td>
                <Td>
                  <Badge tone="neutral">{payment.method.replace("_", " ").toLowerCase()}</Badge>
                  {payment.recordedBy ? (
                    <p className="mt-1 text-xs text-ink-45">by {payment.recordedBy.name}</p>
                  ) : null}
                </Td>
                <Td>
                  <Badge tone={PAYMENT_STATUS[payment.status].tone}>
                    {PAYMENT_STATUS[payment.status].label}
                  </Badge>
                </Td>
                <Td align="right">
                  <span className="font-mono text-sm font-semibold">
                    {formatKobo(payment.amountKobo)}
                  </span>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-ink-45">
                    {dateTimeLabel.format(payment.paidAt ?? payment.createdAt)}
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
        basePath="/admin/payments"
        params={filters as Record<string, string | undefined>}
      />
    </div>
  );
}
