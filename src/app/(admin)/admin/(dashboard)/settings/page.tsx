import type { Metadata } from "next";
import { saveCampDetails, savePricing } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { DataRow, Eyebrow, Notice, Panel, PanelHeader } from "@/components/ui";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { toDateInput } from "@/lib/dates";
import { emailMode } from "@/lib/email/send";
import { toNaira } from "@/lib/money";
import { paystackMode } from "@/lib/paystack";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  await requireAdmin(["SUPER_ADMIN", "ADMIN"]);
  const camp = await requireActiveCamp();

  const price = (category: string) =>
    toNaira(camp.priceTiers.find((tier) => tier.category === category)?.amountKobo ?? 0);

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>How the camp behaves</Eyebrow>
        <h1 className="display mt-2 text-5xl">Settings</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Ticket prices"
            description="Applies to new registrations. Existing registrants keep their agreed amount."
          />
          <div className="p-5">
            <ActionForm action={savePricing}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Adult (₦)" htmlFor="adult" required>
                  <Input id="adult" name="adult" type="number" min={0} step={500} defaultValue={price("ADULT")} required />
                </Field>
                <Field label="Student (₦)" htmlFor="student" required>
                  <Input id="student" name="student" type="number" min={0} step={500} defaultValue={price("STUDENT")} required />
                </Field>
                <Field label="Teenager (₦)" htmlFor="teen" required>
                  <Input id="teen" name="teen" type="number" min={0} step={500} defaultValue={price("TEEN")} required />
                </Field>
                <Field label="Child (₦)" htmlFor="child" required>
                  <Input id="child" name="child" type="number" min={0} step={500} defaultValue={price("CHILD")} required />
                </Field>
              </div>

              <div className="border-t border-ink/12 pt-4">
                <Eyebrow>Payment policy</Eyebrow>
                <div className="mt-3 space-y-2.5">
                  <Checkbox
                    name="installmentsEnabled"
                    label="Allow instalment payments"
                    defaultChecked={camp.installmentsEnabled}
                    description="People can pay part now and top up later."
                  />
                  <Field
                    label="Minimum first instalment (₦)"
                    htmlFor="minFirstInstallmentNaira"
                    hint="A flat amount that holds a place, whatever the ticket costs."
                  >
                    <Input
                      id="minFirstInstallmentNaira"
                      name="minFirstInstallmentNaira"
                      type="number"
                      min={0}
                      step={1000}
                      defaultValue={toNaira(camp.minFirstInstallmentKobo)}
                    />
                  </Field>
                </div>
              </div>

              <div className="border-t border-ink/12 pt-4">
                <Eyebrow>Accommodation policy</Eyebrow>
                <div className="mt-3 space-y-2.5">
                  <Checkbox
                    name="requireFullPayForRoom"
                    label="Only give rooms to people who are paid in full"
                    defaultChecked={camp.requireFullPayForRoom}
                    description="Rooms are always assigned by hand from /admin/rooms, this only gates who's eligible."
                  />
                </div>
              </div>

              <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
            </ActionForm>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Camp details" description="What the public camp page says." />
            <div className="p-5">
              <ActionForm action={saveCampDetails}>
                <Field label="Camp name" htmlFor="name" required>
                  <Input id="name" name="name" defaultValue={camp.name} required />
                </Field>
                <Field label="Theme" htmlFor="theme">
                  <Input id="theme" name="theme" defaultValue={camp.theme ?? ""} />
                </Field>
                <Field label="Tagline" htmlFor="tagline">
                  <Input id="tagline" name="tagline" defaultValue={camp.tagline ?? ""} />
                </Field>
                <Field label="Description" htmlFor="description">
                  <Textarea id="description" name="description" rows={4} defaultValue={camp.description ?? ""} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Venue" htmlFor="venue" required>
                    <Input id="venue" name="venue" defaultValue={camp.venue} required />
                  </Field>
                  <Field label="Capacity" htmlFor="capacity">
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min={1}
                      defaultValue={camp.capacity ?? ""}
                    />
                  </Field>
                </div>
                <Field label="Venue address" htmlFor="venueAddress">
                  <Input id="venueAddress" name="venueAddress" defaultValue={camp.venueAddress ?? ""} />
                </Field>
                <Field
                  label="Registration closes"
                  htmlFor="registrationClosesAt"
                  hint="After this date the register button shows a closed message."
                >
                  <Input
                    id="registrationClosesAt"
                    name="registrationClosesAt"
                    type="date"
                    defaultValue={
                      camp.registrationClosesAt ? toDateInput(camp.registrationClosesAt) : ""
                    }
                  />
                </Field>
                <SubmitButton pendingLabel="Saving…">Save camp details</SubmitButton>
              </ActionForm>
            </div>
          </Panel>

          <Panel className="p-5">
            <Eyebrow>Integrations</Eyebrow>
            <div className="mt-3">
              <DataRow
                label="Payments"
                value={
                  paystackMode === "live" ? "Paystack, live keys" : "Simulated (no keys set)"
                }
              />
              <DataRow
                label="Email"
                value={emailMode === "live" ? "Resend, delivering" : "Logged only (no key set)"}
              />
              <DataRow label="Currency" value={camp.currency} />
            </div>
            {paystackMode === "mock" || emailMode === "console" ? (
              <Notice tone="warn" className="mt-4">
                Set <code className="font-mono text-xs">PAYSTACK_SECRET_KEY</code> and{" "}
                <code className="font-mono text-xs">RESEND_API_KEY</code> in the environment, then
                restart, to take real payments and deliver real email. Point the Paystack webhook at{" "}
                <code className="font-mono text-xs">/api/webhooks/paystack</code>.
              </Notice>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
