import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { ActionForm } from "@/components/admin/action-form";
import { TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Stat, type Tone } from "@/components/ui";
import { Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateOnly, dateTimeLabel } from "@/lib/dates";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Visitors", robots: { index: false } };

const STATUS_TONE: Record<string, Tone> = {
  NEW: "warn",
  CONTACTED: "brand",
  CONNECTED: "success",
  CLOSED: "neutral",
};

const STATUSES = new Set(["NEW", "CONTACTED", "CONNECTED", "CLOSED"]);

async function updateVisitor(_previous: { ok?: string; error?: string }, formData: FormData) {
  "use server";
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const staffNote = String(formData.get("staffNote") ?? "").trim();

  if (!STATUSES.has(status)) return { error: "Unknown status." };

  await db.visitor.update({
    where: { id },
    data: { status: status as never, staffNote: staffNote || null },
  });

  await audit({ actor: admin, action: "visitor.updated", entity: "Visitor", entityId: id, meta: { status } });

  revalidatePath("/admin/visitors");
  return { ok: "Saved." };
}

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;

  const where: Prisma.VisitorWhereInput = {};
  const and: Prisma.VisitorWhereInput[] = [];

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    });
  }
  if (filters.status && STATUSES.has(filters.status)) and.push({ status: filters.status as never });
  if (and.length) where.AND = and;

  const [visitors, counts] = await Promise.all([
    db.visitor.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    db.visitor.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countOf = (status: string) =>
    counts.find((row) => row.status === status)?._count._all ?? 0;

  return (
    <div className="space-y-5">
      <header>
        <Eyebrow>Plan-a-visit forms from the church site</Eyebrow>
        <h1 className="display mt-2 text-5xl">Visitors</h1>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Waiting" value={countOf("NEW")} tone="brand" />
        <Stat label="Contacted" value={countOf("CONTACTED")} />
        <Stat label="Connected" value={countOf("CONNECTED")} />
        <Stat label="Closed" value={countOf("CLOSED")} />
      </div>

      <FilterBar
        action="/admin/visitors"
        activeCount={[filters.q, filters.status].filter(Boolean).length}
        searchValue={filters.q}
        searchPlaceholder="Search name, email or phone"
      >
        <FilterSelect
          name="status"
          label="Status"
          value={filters.status}
          options={[
            { value: "NEW", label: "Waiting" },
            { value: "CONTACTED", label: "Contacted" },
            { value: "CONNECTED", label: "Connected" },
            { value: "CLOSED", label: "Closed" },
          ]}
        />
      </FilterBar>

      <TableWrap>
        <thead>
          <tr>
            <Th>Visitor</Th>
            <Th>Lighthouse &amp; date</Th>
            <Th>Notes</Th>
            <Th>Follow-up</Th>
          </tr>
        </thead>
        <tbody>
          {visitors.length === 0 ? (
            <TableEmpty colSpan={4} message="No visitor forms match those filters." />
          ) : (
            visitors.map((visitor) => (
              <Tr key={visitor.id}>
                <Td className="align-top">
                  <p className="font-semibold">
                    {visitor.firstName} {visitor.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-45">{visitor.email}</p>
                  {visitor.phone ? (
                    <p className="mt-0.5 text-xs text-ink-45">{visitor.phone}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                    {dateTimeLabel.format(visitor.createdAt)}
                  </p>
                </Td>
                <Td className="align-top">
                  <p className="text-sm font-semibold">{visitor.campus ?? "No lighthouse given"}</p>
                  <p className="mt-0.5 text-sm text-ink-70">
                    {visitor.visitDate ? dateOnly.format(visitor.visitDate) : "Date not set"}
                  </p>
                  {visitor.howHeard ? (
                    <p className="mt-0.5 text-xs text-ink-45">via {visitor.howHeard}</p>
                  ) : null}
                  <div className="mt-1.5">
                    <Badge tone={STATUS_TONE[visitor.status] ?? "neutral"}>
                      {visitor.status.toLowerCase()}
                    </Badge>
                  </div>
                </Td>
                <Td className="align-top">
                  {visitor.prayerRequest ? (
                    <p className="max-w-sm text-sm leading-relaxed text-ink-70">
                      {visitor.prayerRequest}
                    </p>
                  ) : (
                    <span className="text-xs text-ink-45">, </span>
                  )}
                  {!visitor.wantsFollowUp ? (
                    <p className="mt-1 text-xs text-danger">Asked not to be contacted</p>
                  ) : null}
                </Td>
                <Td className="align-top">
                  <ActionForm action={updateVisitor} className="min-w-[220px]">
                    <input type="hidden" name="id" value={visitor.id} />
                    <Select name="status" defaultValue={visitor.status} className="py-2 text-sm">
                      <option value="NEW">Waiting</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="CONNECTED">Connected</option>
                      <option value="CLOSED">Closed</option>
                    </Select>
                    <Input
                      name="staffNote"
                      defaultValue={visitor.staffNote ?? ""}
                      placeholder="Note"
                      className="py-2 text-sm"
                    />
                    <SubmitButton size="sm" withArrow={false} pendingLabel="…">
                      Save
                    </SubmitButton>
                  </ActionForm>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
