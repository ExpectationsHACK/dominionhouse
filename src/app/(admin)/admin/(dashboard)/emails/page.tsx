import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Pagination, TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Notice, Stat } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTimeLabel } from "@/lib/dates";
import { emailMode } from "@/lib/email/send";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Email outbox", robots: { index: false } };

const PAGE_SIZE = 50;
const STATUSES = new Set(["QUEUED", "SENT", "FAILED"]);

type Filters = { q?: string; status?: string; template?: string; page?: string };

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  await requireAdmin();
  const filters = await searchParams;

  const where: Prisma.EmailLogWhereInput = {};
  const and: Prisma.EmailLogWhereInput[] = [];

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { to: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.status && STATUSES.has(filters.status)) and.push({ status: filters.status as never });
  if (filters.template) and.push({ template: filters.template });
  if (and.length) where.AND = and;

  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);

  const [rows, total, sent, failed, templates] = await Promise.all([
    db.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.emailLog.count({ where }),
    db.emailLog.count({ where: { status: "SENT" } }),
    db.emailLog.count({ where: { status: "FAILED" } }),
    db.emailLog.findMany({ distinct: ["template"], select: { template: true }, orderBy: { template: "asc" } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Every message the system has sent</Eyebrow>
        <h1 className="display mt-2 text-5xl">Email outbox</h1>
      </header>

      {emailMode === "console" ? (
        <Notice tone="warn" title="Delivery is switched off">
          No <code className="font-mono text-xs">RESEND_API_KEY</code> is set, so messages are
          logged here but never leave the server. Add the key to start delivering.
        </Notice>
      ) : null}

      <div className="grid gap-px bg-ink/12 sm:grid-cols-3">
        <Stat label="Sent" value={sent} tone="brand" />
        <Stat label="Failed" value={failed} />
        <Stat label="Logged" value={total} />
      </div>

      <FilterBar
        action="/admin/emails"
        activeCount={[filters.q, filters.status, filters.template].filter(Boolean).length}
        searchValue={filters.q}
        searchPlaceholder="Search recipient or subject"
      >
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={[
            { value: "SENT", label: "Sent" },
            { value: "FAILED", label: "Failed" },
            { value: "QUEUED", label: "Queued" },
          ]}
        />
        <FilterSelect
          name="template"
          label="Template"
          value={filters.template}
          options={templates.map((row) => ({ value: row.template, label: row.template }))}
        />
      </FilterBar>

      <TableWrap>
        <thead>
          <tr>
            <Th>To</Th>
            <Th>Subject</Th>
            <Th>Template</Th>
            <Th>Status</Th>
            <Th>When</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={5} message="Nothing in the outbox for those filters." />
          ) : (
            rows.map((log) => (
              <Tr key={log.id}>
                <Td>
                  {log.registrantId ? (
                    <Link
                      href={`/admin/registrants/${log.registrantId}`}
                      className="text-sm hover:underline"
                    >
                      {log.to}
                    </Link>
                  ) : (
                    <span className="text-sm">{log.to}</span>
                  )}
                </Td>
                <Td>
                  <span className="text-sm">{log.subject}</span>
                  {log.error ? <p className="mt-0.5 text-xs text-danger">{log.error}</p> : null}
                </Td>
                <Td>
                  <span className="font-mono text-[11px] text-ink-45">{log.template}</span>
                </Td>
                <Td>
                  <Badge
                    tone={
                      log.status === "SENT" ? "success" : log.status === "FAILED" ? "danger" : "warn"
                    }
                  >
                    {log.status.toLowerCase()}
                  </Badge>
                </Td>
                <Td>
                  <span className="font-mono text-xs text-ink-45">
                    {dateTimeLabel.format(log.sentAt ?? log.createdAt)}
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
        basePath="/admin/emails"
        params={filters as Record<string, string | undefined>}
      />
    </div>
  );
}
