import type { Metadata } from "next";
import { setLegacyRaised, stopPartnership } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Panel, Stat } from "@/components/ui";
import { Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { FINANCE_ROLES, requireAdmin } from "@/lib/auth";
import { dateTimeLabel } from "@/lib/dates";
import { db } from "@/lib/db";
import { givingTotals } from "@/lib/giving";
import { formatMoney } from "@/lib/giving-rules";
import { LEGACY_DEFAULT_RAISED_NAIRA } from "@/lib/legacy-place";
import { LEGACY_RAISED_SETTING } from "@/lib/public-data";

export const metadata: Metadata = { title: "Angel Partners", robots: { index: false } };

const STATUS_TONE = { ACTIVE: "success", PENDING: "warn", CANCELLED: "neutral" } as const;
const GIFT_TONE = { SUCCESS: "success", PENDING: "warn", FAILED: "danger" } as const;

export default async function PartnersPage() {
  await requireAdmin(FINANCE_ROLES);

  const [totals, partners, gifts, raisedSetting] = await Promise.all([
    givingTotals(),
    db.partner.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { gifts: { where: { status: "SUCCESS" } } } } },
    }),
    db.gift.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.setting.findUnique({ where: { key: LEGACY_RAISED_SETTING } }),
  ]);
  const raised = Number(raisedSetting?.value ?? LEGACY_DEFAULT_RAISED_NAIRA);

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Legacy Place</Eyebrow>
        <h1 className="display mt-2 text-5xl">Angel Partners</h1>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active partners" value={String(totals.activePartners)} hint="charging monthly" tone="brand" />
        {totals.byCurrency.map((row) => (
          <Stat
            key={row.currency}
            label={`Given online (${row.currency})`}
            value={formatMoney(row.totalMinor, row.currency)}
            hint={`${row.count} successful gifts`}
          />
        ))}
      </div>

      <Panel className="p-6">
        <Eyebrow>Shown on the Give page</Eyebrow>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-70">
          The &ldquo;Raised&rdquo; figure toward the seed goal, in naira. It isn&apos;t worked out
          from online gifts (offline gifts and other currencies count too), so update it as the
          total grows. The page picks it up within a minute.
        </p>
        <ActionForm action={setLegacyRaised} className="mt-4 flex max-w-md flex-wrap items-end gap-3">
          <div className="flex-1">
            <label htmlFor="raised" className="eyebrow text-ink-70">
              Raised so far (₦)
            </label>
            <Input id="raised" name="raised" inputMode="numeric" defaultValue={String(raised)} className="mt-1.5" />
          </div>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
        </ActionForm>
      </Panel>

      <section>
        <h2 className="display text-3xl">Partners</h2>
        <TableWrap>
          <thead>
            <tr>
              <Th>Partner</Th>
              <Th>Monthly</Th>
              <Th>Status</Th>
              <Th>Months paid</Th>
              <Th>Wall</Th>
              <Th>Joined</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <TableEmpty colSpan={7} message="No Angel Partners yet." />
            ) : (
              partners.map((partner) => (
                <Tr key={partner.id}>
                  <Td>
                    <p className="font-semibold">{partner.name}</p>
                    <p className="text-xs text-ink-45">
                      {partner.email} · {partner.phone}
                      {partner.country ? ` · ${partner.country}` : ""}
                    </p>
                  </Td>
                  <Td className="font-mono">{formatMoney(partner.amountMinor, partner.currency)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[partner.status]}>{partner.status.toLowerCase()}</Badge>
                  </Td>
                  <Td className="font-mono">{partner._count.gifts}</Td>
                  <Td>{partner.wallOptIn ? "Yes" : "—"}</Td>
                  <Td className="text-xs text-ink-45">{dateTimeLabel.format(partner.createdAt)}</Td>
                  <Td>
                    {partner.status !== "CANCELLED" ? (
                      <ActionForm
                        action={stopPartnership}
                        confirm={`Stop ${partner.name}'s monthly partnership? Paystack won't charge them again.`}
                      >
                        <input type="hidden" name="partnerId" value={partner.id} />
                        <SubmitButton variant="outline" size="sm" pendingLabel="Stopping…">
                          Stop
                        </SubmitButton>
                      </ActionForm>
                    ) : null}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </section>

      <section>
        <h2 className="display text-3xl">Recent gifts</h2>
        <TableWrap>
          <thead>
            <tr>
              <Th>Giver</Th>
              <Th>Amount</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Reference</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody>
            {gifts.length === 0 ? (
              <TableEmpty colSpan={6} message="No gifts yet." />
            ) : (
              gifts.map((gift) => (
                <Tr key={gift.id}>
                  <Td>
                    <p className="font-semibold">{gift.name}</p>
                    <p className="text-xs text-ink-45">{gift.email}</p>
                  </Td>
                  <Td className="font-mono">{formatMoney(gift.amountMinor, gift.currency)}</Td>
                  <Td>{gift.kind === "MONTHLY" ? "Monthly" : "One-time"}</Td>
                  <Td>
                    <Badge tone={GIFT_TONE[gift.status]}>{gift.status.toLowerCase()}</Badge>
                    {gift.note ? <p className="mt-1 max-w-[16rem] text-xs text-ink-45">{gift.note}</p> : null}
                  </Td>
                  <Td className="font-mono text-xs">{gift.reference}</Td>
                  <Td className="text-xs text-ink-45">{dateTimeLabel.format(gift.paidAt ?? gift.createdAt)}</Td>
                </Tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </section>
    </div>
  );
}
