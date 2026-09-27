import type { Metadata } from "next";
import Link from "next/link";
import { createRegistrantByAdmin } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { Eyebrow, Panel, PanelHeader } from "@/components/ui";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { CAMPUS_REGIONS, LIGHTHOUSES_OR_MINISTRIES } from "@/lib/church";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { CATEGORY_LABEL } from "@/lib/pricing";

export const metadata: Metadata = { title: "Add a registrant", robots: { index: false } };

const CATEGORIES = (["ADULT", "STUDENT", "TEEN", "CHILD"] as const).map((value) => ({
  value,
  label: CATEGORY_LABEL[value],
}));

export default async function NewRegistrantPage() {
  await requireAdmin(OPS_ROLES);

  return (
    <div className="max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Camp desk</Eyebrow>
          <h1 className="display mt-2 text-5xl">Add a registrant</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-45">
            For anyone without internet, paying cash, or handed to you on a lighthouse
            coordinator's paper list. This creates the same record the public form would.
          </p>
        </div>
        <Link
          href="/admin/registrants/import"
          className="border border-ink px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors hover:bg-ink hover:text-white"
        >
          Import a CSV instead
        </Link>
      </header>

      <Panel>
        <PanelHeader title="Who they are" />
        <div className="p-5">
          <ActionForm action={createRegistrantByAdmin} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ticket type" htmlFor="registeringAs" required>
                <Select id="registeringAs" name="registeringAs" defaultValue="ADULT" required>
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Gender" htmlFor="gender" required>
                <Select id="gender" name="gender" defaultValue="MALE" required>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </Select>
              </Field>
              <Field label="First name" htmlFor="firstName" required>
                <Input id="firstName" name="firstName" required />
              </Field>
              <Field label="Last name" htmlFor="lastName" required>
                <Input id="lastName" name="lastName" required />
              </Field>
              <Field label="Email" htmlFor="email" required hint="Used to sign in to their camp profile.">
                <Input id="email" name="email" type="email" required />
              </Field>
              <Field label="Phone" htmlFor="phone" required>
                <Input id="phone" name="phone" required placeholder="0803 123 4567" />
              </Field>
            </div>

            <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
              <Field label="Position" htmlFor="position" required>
                <Select id="position" name="position" defaultValue="DISCIPLE" required>
                  {POSITION_OPTIONS.map((position) => (
                    <option key={position} value={position}>
                      {POSITION_LABEL[position]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Branch" htmlFor="branch">
                <Input id="branch" name="branch" />
              </Field>
              <Field
                label="Lighthouse or Ministry"
                htmlFor="lighthouse"
                hint="Leave blank for a campus student, use region instead."
              >
                <Select id="lighthouse" name="lighthouse" defaultValue="">
                  <option value="">Not a Lighthouse or Ministry member</option>
                  {LIGHTHOUSES_OR_MINISTRIES.map((lighthouse) => (
                    <option key={lighthouse} value={lighthouse}>
                      {lighthouse}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Region" htmlFor="region" hint="Campus students only.">
                <Select id="region" name="region" defaultValue="">
                  <option value="">Not a campus student</option>
                  {CAMPUS_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="City" htmlFor="city">
                <Input id="city" name="city" />
              </Field>
              <Field label="State" htmlFor="state">
                <Input id="state" name="state" />
              </Field>
            </div>
            <Checkbox name="isFirstCamp" label="First time at a Dominion House camp" />

            <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-2">
              <Field label="Emergency contact name" htmlFor="emergencyName" required>
                <Input id="emergencyName" name="emergencyName" required />
              </Field>
              <Field label="Emergency contact phone" htmlFor="emergencyPhone" required>
                <Input id="emergencyPhone" name="emergencyPhone" required />
              </Field>
              <Field label="Relationship" htmlFor="emergencyRelation">
                <Input id="emergencyRelation" name="emergencyRelation" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Medical notes" htmlFor="medicalNotes">
                <Textarea id="medicalNotes" name="medicalNotes" rows={2} />
              </Field>
              <Field label="Allergies" htmlFor="allergies">
                <Textarea id="allergies" name="allergies" rows={2} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox name="wantsPersonalAccommodation" label="Wants a personal room" />
              <Checkbox name="transportNeeded" label="Needs transport" />
            </div>

            <div className="grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-3">
              <Field
                label="Amount already paid (₦)"
                htmlFor="amountPaidNaira"
                hint="Leave at 0 to register unpaid."
              >
                <Input id="amountPaidNaira" name="amountPaidNaira" type="number" min={0} defaultValue={0} />
              </Field>
              <Field label="Payment method" htmlFor="paymentMethod">
                <Select id="paymentMethod" name="paymentMethod" defaultValue="CASH">
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="POS">POS</option>
                  <option value="WAIVER">Waiver</option>
                </Select>
              </Field>
              <Field label="Reference" htmlFor="paymentReference" hint="Optional, one is generated otherwise.">
                <Input id="paymentReference" name="paymentReference" />
              </Field>
            </div>

            <Checkbox
              name="sendEmail"
              label="Email them a registration confirmation"
              description="A payment, once recorded, always emails a receipt and, if it settles the balance, the ticket."
              defaultChecked
            />

            <SubmitButton className="w-full" pendingLabel="Registering…">
              Register
            </SubmitButton>
          </ActionForm>
        </div>
      </Panel>
    </div>
  );
}
