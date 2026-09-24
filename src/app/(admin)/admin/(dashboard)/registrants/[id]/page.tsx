import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignRoom,
  changeTicketTier,
  issueTicketNow,
  recordOfflinePayment,
  reinstateTicket,
  removeFromRoom,
  resendRoomEmail,
  resendTicket,
  reversePayment,
  revokeTicket,
  setRegistrationStatus,
  updateRegistrant,
  waiveBalance,
} from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { TicketStub } from "@/components/camp/ticket-stub";
import {
  Badge,
  DataRow,
  Eyebrow,
  Meter,
  Panel,
  PanelHeader,
  StatusBadge,
} from "@/components/ui";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { FINANCE_ROLES, OPS_ROLES, can, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { campDateRange, dateTimeLabel } from "@/lib/dates";
import { PAYMENT_STATUS } from "@/lib/payment-outcome";
import { formatKobo, percentPaid, perInstallmentKobo, toNaira } from "@/lib/money";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { ticketQrDataUrl, totalsFor } from "@/lib/registration";

export const metadata: Metadata = { title: "Registrant", robots: { index: false } };

export default async function RegistrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const camp = await requireActiveCamp();
  const { id } = await params;

  const registrant = await db.registrant.findUnique({
    where: { id },
    include: {
      priceTier: true,
      payments: { orderBy: { createdAt: "desc" }, include: { recordedBy: true } },
      ticket: { include: { checkedInBy: true } },
      roomAssignment: { include: { room: true } },
      emailLogs: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!registrant || registrant.campId !== camp.id) notFound();

  const totals = totalsFor(registrant);
  const finance = can(admin.role, FINANCE_ROLES);
  const ops = can(admin.role, OPS_ROLES);

  const rooms = ops
    ? await db.room.findMany({
        where: { campId: camp.id, isActive: true },
        include: { _count: { select: { assignments: true } } },
        orderBy: [{ block: "asc" }, { name: "asc" }],
      })
    : [];

  const qrDataUrl = registrant.ticket ? await ticketQrDataUrl(registrant.ticket.qrPayload) : null;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
        <Link href="/admin/registrants" className="hover:text-ink">
          Registrants
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{registrant.registrationCode}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/12 pb-6">
        <div>
          <h1 className="display text-5xl">
            {registrant.firstName} {registrant.lastName}
          </h1>
          <p className="mt-2 text-sm text-ink-45">
            {registrant.email} · {registrant.phone}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={registrant.status} />
            <Badge tone="neutral">{POSITION_LABEL[registrant.position]}</Badge>
            <Badge tone="neutral">{CATEGORY_LABEL[registrant.category]}</Badge>
            {registrant.ticket ? (
              <Badge tone={registrant.ticket.status === "REVOKED" ? "danger" : "brand"}>
                {registrant.ticket.code}
              </Badge>
            ) : null}
            {registrant.roomAssignment ? (
              <Badge tone="brass">
                {registrant.roomAssignment.room.block} {registrant.roomAssignment.room.name}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="text-right">
          <Eyebrow>Balance</Eyebrow>
          <p className="display mt-1 text-4xl">
            {totals.balanceKobo > 0 ? formatKobo(totals.balanceKobo) : "Cleared"}
          </p>
          <p className="mt-1 font-mono text-[11px] text-ink-45">
            {formatKobo(totals.paidKobo)} of {formatKobo(totals.dueKobo)}
          </p>
          <div className="mt-2 w-40">
            <Meter percent={percentPaid(totals.paidKobo, totals.dueKobo)} />
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          {/* ── money ─────────────────────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Payments"
              description={`${registrant.payments.filter((p) => p.status === "SUCCESS").length} successful`}
            />
            {registrant.payments.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-45">Nothing recorded yet.</p>
            ) : (
              <ul>
                {registrant.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 px-5 py-4 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm">{payment.reference}</p>
                      <p className="mt-1 text-xs text-ink-45">
                        {dateTimeLabel.format(payment.paidAt ?? payment.createdAt)} ·{" "}
                        {payment.method.replace("_", " ").toLowerCase()}
                        {payment.recordedBy ? ` · by ${payment.recordedBy.name}` : ""}
                      </p>
                      {payment.note ? (
                        <p className="mt-1 text-xs text-ink-45">{payment.note}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={PAYMENT_STATUS[payment.status].tone}>
                        {PAYMENT_STATUS[payment.status].label}
                      </Badge>
                      <p className="font-mono text-sm font-semibold">
                        {formatKobo(payment.amountKobo)}
                      </p>
                      {finance && payment.status === "SUCCESS" ? (
                        <ActionForm action={reversePayment} confirm="Reverse this payment?">
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <SubmitButton
                            variant="ghost"
                            size="sm"
                            withArrow={false}
                            pendingLabel="…"
                            className="text-danger"
                          >
                            Reverse
                          </SubmitButton>
                        </ActionForm>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {finance && totals.balanceKobo > 0 ? (
              <div className="border-t border-ink/12 bg-bone p-5">
                <Eyebrow>Record an offline payment</Eyebrow>
                <p className="mt-1.5 text-xs text-ink-45">
                  Bank transfer, cash or POS. This settles exactly like a card payment, the ticket
                  is issued and emailed automatically when the balance clears.
                </p>
                <ActionForm action={recordOfflinePayment} className="mt-4">
                  <input type="hidden" name="registrantId" value={registrant.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Amount (₦)" htmlFor="amountNaira" required>
                      <Input
                        id="amountNaira"
                        name="amountNaira"
                        type="number"
                        min={1}
                        max={toNaira(totals.balanceKobo)}
                        step={100}
                        defaultValue={toNaira(totals.balanceKobo)}
                        required
                      />
                    </Field>
                    <Field label="Method" htmlFor="method" required>
                      <Select id="method" name="method" defaultValue="BANK_TRANSFER">
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="POS">POS</option>
                        <option value="WAIVER">Bursary</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Teller / transfer reference" htmlFor="reference">
                    <Input id="reference" name="reference" placeholder="Leave blank to generate one" />
                  </Field>
                  <Field label="Note" htmlFor="note">
                    <Input id="note" name="note" placeholder="Paid at the Sunday desk" />
                  </Field>
                  <SubmitButton size="sm" pendingLabel="Recording…">
                    Record payment
                  </SubmitButton>
                </ActionForm>

                <div className="mt-5 border-t border-ink/12 pt-4">
                  <ActionForm
                    action={waiveBalance}
                    confirm={`Waive the remaining ${formatKobo(totals.balanceKobo)} as a bursary?`}
                  >
                    <input type="hidden" name="registrantId" value={registrant.id} />
                    <Field label="Bursary note" htmlFor="waive-note">
                      <Input id="waive-note" name="note" placeholder="Approved by the bursary team" />
                    </Field>
                    <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="Waiving…">
                      Waive {formatKobo(totals.balanceKobo)}
                    </SubmitButton>
                  </ActionForm>
                </div>
              </div>
            ) : null}
          </Panel>

          {/* ── ticket ────────────────────────────────────────────────── */}
          <Panel>
            <PanelHeader
              title="Ticket"
              description={
                registrant.ticket
                  ? `Issued ${dateTimeLabel.format(registrant.ticket.issuedAt)}`
                  : "Issued automatically when the balance clears."
              }
            />
            <div className="p-5">
              {registrant.ticket && qrDataUrl ? (
                <div className="space-y-5">
                  <TicketStub
                    name={`${registrant.firstName} ${registrant.lastName}`}
                    category={CATEGORY_LABEL[registrant.category]}
                    registrationCode={registrant.registrationCode}
                    ticketCode={registrant.ticket.code}
                    qrDataUrl={qrDataUrl}
                    campName={camp.name}
                    dates={campDateRange(camp.startsAt, camp.endsAt)}
                    venue={camp.venue}
                    status={registrant.ticket.status}
                    room={
                      registrant.roomAssignment
                        ? {
                            block: registrant.roomAssignment.room.block,
                            name: registrant.roomAssignment.room.name,
                            bedLabel: registrant.roomAssignment.bedLabel,
                          }
                        : null
                    }
                    className="max-w-lg"
                  />

                  <div className="grid gap-2 text-xs text-ink-45">
                    <p>
                      Email sent:{" "}
                      {registrant.ticket.emailSentAt
                        ? dateTimeLabel.format(registrant.ticket.emailSentAt)
                        : "not yet"}
                    </p>
                    {registrant.ticket.checkedInAt ? (
                      <p>
                        Checked in {dateTimeLabel.format(registrant.ticket.checkedInAt)}
                        {registrant.ticket.checkedInBy
                          ? ` by ${registrant.ticket.checkedInBy.name}`
                          : ""}
                      </p>
                    ) : null}
                    {registrant.ticket.revokedReason ? (
                      <p className="text-danger">Revoked: {registrant.ticket.revokedReason}</p>
                    ) : null}
                  </div>

                  {ops ? (
                    <div className="flex flex-wrap gap-3 border-t border-ink/12 pt-4">
                      <ActionForm action={resendTicket}>
                        <input type="hidden" name="registrantId" value={registrant.id} />
                        <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="Sending…">
                          Resend ticket email
                        </SubmitButton>
                      </ActionForm>

                      {registrant.ticket.status === "REVOKED" ? (
                        <ActionForm action={reinstateTicket}>
                          <input type="hidden" name="registrantId" value={registrant.id} />
                          <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="…">
                            Reinstate ticket
                          </SubmitButton>
                        </ActionForm>
                      ) : (
                        <ActionForm action={revokeTicket} confirm="Revoke this ticket?">
                          <input type="hidden" name="registrantId" value={registrant.id} />
                          <input type="hidden" name="reason" value="Revoked at the camp desk" />
                          <SubmitButton
                            size="sm"
                            variant="outline"
                            withArrow={false}
                            pendingLabel="…"
                            className="text-danger"
                          >
                            Revoke ticket
                          </SubmitButton>
                        </ActionForm>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-ink-45">
                    No ticket yet, {formatKobo(totals.balanceKobo)} outstanding.
                  </p>
                  {ops && totals.isSettled ? (
                    <ActionForm action={issueTicketNow}>
                      <input type="hidden" name="registrantId" value={registrant.id} />
                      <SubmitButton size="sm" pendingLabel="Issuing…">
                        Issue ticket now
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                </div>
              )}
            </div>
          </Panel>

          {/* ── email trail ───────────────────────────────────────────── */}
          <Panel>
            <PanelHeader title="Emails sent" description="What this person has received from us." />
            {registrant.emailLogs.length === 0 ? (
              <p className="px-5 py-8 text-sm text-ink-45">Nothing sent yet.</p>
            ) : (
              <ul>
                {registrant.emailLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">{log.subject}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                        {log.template} · {dateTimeLabel.format(log.createdAt)}
                      </p>
                    </div>
                    <Badge tone={log.status === "SENT" ? "success" : log.status === "FAILED" ? "danger" : "neutral"}>
                      {log.status.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ── right column ────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Panel className="p-5">
            <Eyebrow>Registration</Eyebrow>
            <div className="mt-3">
              <DataRow label="Code" value={<span className="font-mono">{registrant.registrationCode}</span>} />
              <DataRow label="Registered" value={dateTimeLabel.format(registrant.createdAt)} />
              <DataRow label="Gender" value={registrant.gender === "MALE" ? "Male" : "Female"} />
              <DataRow label="Lighthouse or Ministry" value={registrant.lighthouse ?? ", "} />
              <DataRow label="Region" value={registrant.region ?? ", "} />
              <DataRow label="Branch" value={registrant.branch ?? ", "} />
              <DataRow label="City" value={[registrant.city, registrant.state].filter(Boolean).join(", ") || ", "} />
              <DataRow
                label="Payment plan"
                value={
                  registrant.paymentPlan === "FULL"
                    ? "Full"
                    : registrant.installmentCount
                      ? `${registrant.installmentCount} instalments of ${formatKobo(perInstallmentKobo(registrant.amountDueKobo, registrant.installmentCount))}`
                      : registrant.firstInstallmentKobo
                        ? `Instalments, first ${formatKobo(registrant.firstInstallmentKobo)}`
                        : "Instalments"
                }
              />
              <DataRow label="First camp" value={registrant.isFirstCamp ? "Yes" : "No"} />
              <DataRow label="Photo consent" value={registrant.consentPhoto ? "Yes" : "No"} />
              <DataRow label="Transport" value={registrant.transportNeeded ? "Needs shuttle" : "Own transport"} />
            </div>
          </Panel>

          <Panel className="p-5">
            <Eyebrow>Care and emergency</Eyebrow>
            <div className="mt-3">
              <DataRow label="Contact" value={registrant.emergencyName} />
              <DataRow label="Phone" value={registrant.emergencyPhone} />
              <DataRow label="Relationship" value={registrant.emergencyRelation ?? ", "} />
            </div>
            {registrant.medicalNotes ? (
              <div className="mt-4 border border-danger/25 bg-danger-soft p-3">
                <p className="eyebrow text-danger">Medical</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{registrant.medicalNotes}</p>
              </div>
            ) : null}
            {registrant.allergies ? (
              <div className="mt-3 border border-warn/25 bg-warn-soft p-3">
                <p className="eyebrow text-warn">Allergies</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{registrant.allergies}</p>
              </div>
            ) : null}
          </Panel>

          {/* ── room ──────────────────────────────────────────────────── */}
          {ops ? (
            <Panel className="p-5">
              <Eyebrow>Accommodation</Eyebrow>

              {registrant.roomAssignment ? (
                <>
                  <p className="display mt-3 text-3xl">
                    {registrant.roomAssignment.room.block} {registrant.roomAssignment.room.name}
                  </p>
                  <p className="mt-1 text-xs text-ink-45">
                    Bed {registrant.roomAssignment.bedLabel ?? ", "} ·{" "}
                    {registrant.roomAssignment.method === "AUTO" ? "auto-assigned" : "placed by hand"}{" "}
                    · {dateTimeLabel.format(registrant.roomAssignment.assignedAt)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionForm action={resendRoomEmail}>
                      <input type="hidden" name="registrantId" value={registrant.id} />
                      <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="…">
                        Email room details
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={removeFromRoom} confirm="Take this person out of their room?">
                      <input type="hidden" name="registrantId" value={registrant.id} />
                      <SubmitButton
                        size="sm"
                        variant="ghost"
                        withArrow={false}
                        pendingLabel="…"
                        className="text-danger"
                      >
                        Remove
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-45">
                  No room yet.
                </p>
              )}

              <div className="mt-5 space-y-4 border-t border-ink/12 pt-4">
                  <ActionForm action={assignRoom}>
                    <input type="hidden" name="registrantId" value={registrant.id} />
                    <Field label="Assign a room" htmlFor="roomId">
                      <Select id="roomId" name="roomId" defaultValue="">
                        <option value="" disabled>
                          Pick a room
                        </option>
                        {rooms.map((room) => (
                          <option
                            key={room.id}
                            value={room.id}
                            disabled={room._count.assignments >= room.capacity}
                          >
                            {room.block} {room.name}, {room._count.assignments}/{room.capacity} ·{" "}
                            {room.gender.toLowerCase()}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Bed label" htmlFor="bedLabel">
                      <Input id="bedLabel" name="bedLabel" placeholder="Next free bed" />
                    </Field>
                    <Checkbox name="notify" label="Email them the room details" defaultChecked />
                    <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="Assigning…">
                      Assign room
                    </SubmitButton>
                  </ActionForm>
              </div>
            </Panel>
          ) : null}

          {/* ── edit ──────────────────────────────────────────────────── */}
          {ops ? (
            <Panel className="p-5">
              <Eyebrow>Edit record</Eyebrow>
              <ActionForm action={updateRegistrant} className="mt-4">
                <input type="hidden" name="registrantId" value={registrant.id} />
                <Field label="Position" htmlFor="edit-position">
                  <Select id="edit-position" name="position" defaultValue={registrant.position}>
                    {POSITION_OPTIONS.map((position) => (
                      <option key={position} value={position}>
                        {POSITION_LABEL[position]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Department" htmlFor="edit-department">
                  <Input id="edit-department" name="department" defaultValue={registrant.department ?? ""} />
                </Field>
                <Field label="Branch" htmlFor="edit-branch">
                  <Input id="edit-branch" name="branch" defaultValue={registrant.branch ?? ""} />
                </Field>
                <Checkbox
                  name="wantsPersonalAccommodation"
                  label="Asked for personal accommodation"
                  defaultChecked={registrant.wantsPersonalAccommodation}
                />
                <Checkbox
                  name="transportNeeded"
                  label="Needs the shuttle"
                  defaultChecked={registrant.transportNeeded}
                />
                <Field label="Staff notes" htmlFor="edit-notes">
                  <Textarea id="edit-notes" name="notes" rows={3} defaultValue={registrant.notes ?? ""} />
                </Field>
                <SubmitButton size="sm" pendingLabel="Saving…">
                  Save changes
                </SubmitButton>
              </ActionForm>
            </Panel>
          ) : null}

          {finance ? (
            <Panel className="p-5">
              <Eyebrow>Change ticket type</Eyebrow>
              <p className="mt-1.5 text-xs text-ink-45">
                Repricing recalculates the balance immediately.
              </p>
              <ActionForm action={changeTicketTier} className="mt-4" confirm="Reprice this registration?">
                <input type="hidden" name="registrantId" value={registrant.id} />
                <Field label="Ticket" htmlFor="priceTierId">
                  <Select
                    id="priceTierId"
                    name="priceTierId"
                    defaultValue={registrant.priceTierId ?? ""}
                  >
                    {camp.priceTiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.label}, {formatKobo(tier.amountKobo)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="Repricing…">
                  Reprice
                </SubmitButton>
              </ActionForm>
            </Panel>
          ) : null}

          {ops ? (
            <Panel className="p-5">
              <Eyebrow>Registration status</Eyebrow>
              <ActionForm
                action={setRegistrationStatus}
                className="mt-4"
                confirm="Change this registration's status?"
              >
                <input type="hidden" name="registrantId" value={registrant.id} />
                <Field label="Set status" htmlFor="status">
                  <Select id="status" name="status" defaultValue="PENDING">
                    <option value="PENDING">Active (recalculate from payments)</option>
                    <option value="WAITLISTED">Waitlisted</option>
                    <option value="CANCELLED">Cancelled, release room, revoke ticket</option>
                  </Select>
                </Field>
                <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="Updating…">
                  Apply
                </SubmitButton>
              </ActionForm>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
