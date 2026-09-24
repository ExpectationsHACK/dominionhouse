"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { registerForCamp, type RegisterState } from "./actions";
import { Arrow, ArrowLeft, Button, Eyebrow } from "@/components/ui";
import {
  Checkbox,
  Field,
  FormError,
  Input,
  RadioCard,
  Select,
  Textarea,
} from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { effectiveMinimumKobo, formatKobo, perInstallmentKobo } from "@/lib/money";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { CAMPUS_REGIONS, LIGHTHOUSES_OR_MINISTRIES } from "@/lib/church";
import { cn } from "@/lib/utils";

type Tier = {
  id: string;
  category: "ADULT" | "STUDENT" | "TEEN" | "CHILD";
  label: string;
  description: string | null;
  amountKobo: number;
};

const STEPS = [
  { id: 1, name: "You", blurb: "Who's coming" },
  { id: 2, name: "Church", blurb: "Where you serve" },
  { id: 3, name: "Camp", blurb: "Room, travel and care" },
  { id: 4, name: "Confirm", blurb: "Ticket and terms" },
] as const;

/** Fields the browser must find valid before a step will advance. */
const STEP_FIELDS: Record<number, string[]> = {
  1: ["registeringAs", "firstName", "lastName", "email", "phone", "gender"],
  2: ["position", "lighthouse", "region"],
  3: ["emergencyName", "emergencyPhone"],
  4: ["paymentPlan", "installmentChoice", "agreeTerms"],
};

const SPLITS = [2, 3, 4, 5] as const;

const REGISTERING_AS = [
  { value: "ADULT", label: "An adult", description: "Done with university, or 20 and above." },
  { value: "STUDENT", label: "A campus student", description: "In a tertiary institution, or on NYSC." },
  { value: "TEEN", label: "A teenager", description: "13–17." },
  { value: "CHILD", label: "A child", description: "12 and under. You register on their behalf." },
] as const;

const initialState: RegisterState = { ok: false };

export function RegisterForm({
  tiers,
  installmentsEnabled,
  minFirstInstallmentKobo,
}: {
  tiers: Tier[];
  installmentsEnabled: boolean;
  minFirstInstallmentKobo: number;
}) {
  const [state, formAction] = useActionState(registerForCamp, initialState);
  const [step, setStep] = useState(1);
  const [registeringAs, setRegisteringAs] = useState<"ADULT" | "STUDENT" | "TEEN" | "CHILD">("ADULT");
  const [paymentPlan, setPaymentPlan] = useState<"FULL" | "INSTALLMENT">("FULL");
  const [installmentChoice, setInstallmentChoice] = useState<"2" | "3" | "4" | "5" | "CUSTOM">("2");

  // The card answers "what does my ticket cost?" the moment they pick; the
  // server looks the real price up from the chosen category again.
  const tier = useMemo(
    () => tiers.find((candidate) => candidate.category === registeringAs) ?? null,
    [registeringAs, tiers],
  );

  function goNext() {
    const form = document.getElementById("register-form") as HTMLFormElement | null;
    if (!form) return;

    for (const name of STEP_FIELDS[step] ?? []) {
      const control = form.elements.namedItem(name);
      const element =
        control instanceof RadioNodeList
          ? (control[0] as HTMLInputElement | undefined)
          : (control as HTMLInputElement | null);
      if (element && !element.checkValidity()) {
        element.reportValidity();
        return;
      }
    }

    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // The floor is per-ticket, so the cheaper tiers can still split five ways.
  const effectiveMinimum = tier
    ? effectiveMinimumKobo(minFirstInstallmentKobo, tier.amountKobo)
    : minFirstInstallmentKobo;
  const holdAmount = tier ? Math.min(effectiveMinimum, tier.amountKobo) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
      <div>
        {/* stepper */}
        <ol className="mb-10 grid grid-cols-4 gap-px bg-ink/12" aria-label="Registration steps">
          {STEPS.map((item) => {
            const done = item.id < step;
            const current = item.id === step;
            return (
              <li
                key={item.id}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "bg-bone px-3 py-3.5 transition-colors",
                  current && "bg-ink text-white",
                  done && "bg-meridian-soft",
                )}
              >
                <p
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-[0.16em]",
                    current ? "text-brass" : "text-ink-45",
                  )}
                >
                  {done ? "Done" : `Step ${item.id}`}
                </p>
                <p className="mt-1 text-sm font-semibold">{item.name}</p>
                <p
                  className={cn(
                    "mt-0.5 hidden text-[11px] sm:block",
                    current ? "text-white/55" : "text-ink-45",
                  )}
                >
                  {item.blurb}
                </p>
              </li>
            );
          })}
        </ol>

        {state.error ? (
          <div className="mb-6">
            <FormError message={state.error} />
            {state.duplicateEmail ? (
              <p className="mt-2 text-sm text-ink-70">
                Head to{" "}
                <Link
                  href={`/camp/payment?email=${encodeURIComponent(state.duplicateEmail)}`}
                  className="font-semibold underline underline-offset-4"
                >
                  the payment page
                </Link>{" "}
                to pay a balance, or{" "}
                <Link href="/portal/login" className="font-semibold underline underline-offset-4">
                  sign in to your camp profile
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        <form id="register-form" action={formAction} className="space-y-8">
          {/* ── step 1 ─────────────────────────────────────────────────── */}
          <fieldset className={cn("space-y-6 border-0 p-0", step !== 1 && "hidden")}>
            <legend className="sr-only">About you</legend>

            <Field
              label="Who is this registration for?"
              required
              error={state.errors?.registeringAs}
              hint="This sets the ticket price and what we ask for next. Enter the camper's own details below."
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                {REGISTERING_AS.map((option) => (
                  <RadioCard
                    key={option.value}
                    name="registeringAs"
                    value={option.value}
                    label={option.label}
                    description={option.description}
                    required
                    checked={registeringAs === option.value}
                    onChange={() => setRegisteringAs(option.value)}
                  />
                ))}
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First name" htmlFor="firstName" required error={state.errors?.firstName}>
                <Input id="firstName" name="firstName" required autoComplete="given-name" minLength={2} />
              </Field>
              <Field label="Last name" htmlFor="lastName" required error={state.errors?.lastName}>
                <Input id="lastName" name="lastName" required autoComplete="family-name" minLength={2} />
              </Field>
            </div>

            <Field
              label="Email address"
              htmlFor="email"
              required
              error={state.errors?.email}
              hint="This is your camp login and where your ticket is sent. Use one you actually check."
            >
              <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" />
            </Field>

            <Field label="Phone number" htmlFor="phone" required error={state.errors?.phone}>
              <Input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="0803 123 4567" />
            </Field>

            <Field label="Gender" required error={state.errors?.gender} hint="Used for room allocation.">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <RadioCard name="gender" value="MALE" label="Male" required />
                <RadioCard name="gender" value="FEMALE" label="Female" required />
              </div>
            </Field>

            {tier ? (
              <div className="border border-brass/40 bg-brass-soft px-4 py-3.5">
                <p className="eyebrow text-ink-45">Your ticket</p>
                <p className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="display text-2xl">{tier.label}</span>
                  <span className="font-mono text-lg font-semibold">
                    {formatKobo(tier.amountKobo)}
                  </span>
                </p>
                {tier.description ? (
                  <p className="mt-1 text-xs text-ink-70">{tier.description}</p>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          {/* ── step 2 ─────────────────────────────────────────────────── */}
          <fieldset className={cn("space-y-6 border-0 p-0", step !== 2 && "hidden")}>
            <legend className="sr-only">Your place in the church</legend>

            <Field
              label="Your position"
              htmlFor="position"
              required
              error={state.errors?.position}
              hint="This shapes your breakout track and where you're roomed."
            >
              <Select id="position" name="position" required defaultValue="">
                <option value="" disabled>
                  Choose your position
                </option>
                {POSITION_OPTIONS.map((position) => (
                  <option key={position} value={position}>
                    {POSITION_LABEL[position]}
                  </option>
                ))}
              </Select>
            </Field>

            {registeringAs === "STUDENT" ? (
              <Field
                label="Your region"
                htmlFor="region"
                required
                error={state.errors?.region}
                hint="The campus-fellowship region you belong to."
              >
                <Select id="region" name="region" required defaultValue="">
                  <option value="" disabled>
                    Choose a region
                  </option>
                  {CAMPUS_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field
                label="Lighthouse or Ministry"
                htmlFor="lighthouse"
                required
                error={state.errors?.lighthouse}
                hint={
                  registeringAs === "CHILD"
                    ? "The Lighthouse or Ministry the child's family belongs to."
                    : "The Lighthouse or Ministry you belong to."
                }
              >
                <Select id="lighthouse" name="lighthouse" required defaultValue="">
                  <option value="" disabled>
                    Choose a Lighthouse or Ministry
                  </option>
                  {LIGHTHOUSES_OR_MINISTRIES.map((lighthouse) => (
                    <option key={lighthouse} value={lighthouse}>
                      {lighthouse}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City" htmlFor="city" error={state.errors?.city}>
                <Input id="city" name="city" autoComplete="address-level2" placeholder="Lagos" />
              </Field>
              <Field label="State" htmlFor="state" error={state.errors?.state}>
                <Input id="state" name="state" autoComplete="address-level1" placeholder="Lagos" />
              </Field>
            </div>

            <Checkbox
              name="isFirstCamp"
              label="This is my first Dominion House camp"
            />
          </fieldset>

          {/* ── step 3 ─────────────────────────────────────────────────── */}
          <fieldset className={cn("space-y-6 border-0 p-0", step !== 3 && "hidden")}>
            <legend className="sr-only">Camp logistics</legend>

            <div className="space-y-2.5">
              <Checkbox
                name="wantsPersonalAccommodation"
                label="I need personal accommodation at the campground"
                description="Every paid registrant gets a bed. Tick this only if you need a personal room rather than a shared one, the camp desk will confirm what's available."
              />
              <Checkbox
                name="transportNeeded"
                label="I need transport to camp"
                description="The logistics team will confirm pick-up points nearer the time."
              />
            </div>

            <div className="rule pt-6">
              <Eyebrow>In case of emergency</Eyebrow>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Contact name"
                  htmlFor="emergencyName"
                  required
                  error={state.errors?.emergencyName}
                >
                  <Input id="emergencyName" name="emergencyName" required minLength={2} />
                </Field>
                <Field
                  label="Contact phone"
                  htmlFor="emergencyPhone"
                  required
                  error={state.errors?.emergencyPhone}
                >
                  <Input id="emergencyPhone" name="emergencyPhone" type="tel" required />
                </Field>
              </div>
              <Field
                label="Relationship"
                htmlFor="emergencyRelation"
                className="mt-5"
                error={state.errors?.emergencyRelation}
              >
                <Input id="emergencyRelation" name="emergencyRelation" placeholder="Spouse, parent, sibling…" />
              </Field>
            </div>

            <div className="rule pt-6">
              <Eyebrow>So we can look after you</Eyebrow>
              <div className="mt-4 space-y-5">
                <Field
                  label="Medical notes"
                  htmlFor="medicalNotes"
                  error={state.errors?.medicalNotes}
                  hint="Conditions and medication. Seen only by the camp medical team."
                >
                  <Textarea id="medicalNotes" name="medicalNotes" rows={3} />
                </Field>
                <Field
                  label="Do you have any allergies?"
                  htmlFor="allergies"
                  error={state.errors?.allergies}
                  hint="Food or otherwise. Leave blank if none."
                >
                  <Textarea id="allergies" name="allergies" rows={2} />
                </Field>
              </div>
            </div>
          </fieldset>

          {/* ── step 4 ─────────────────────────────────────────────────── */}
          <fieldset className={cn("space-y-6 border-0 p-0", step !== 4 && "hidden")}>
            <legend className="sr-only">Ticket and terms</legend>

            <Field
              label="How would you like to pay?"
              required
              error={state.errors?.paymentPlan}
              hint="You can change your mind at the payment page, this just tells us your plan."
            >
              <div className="grid gap-2.5">
                <RadioCard
                  name="paymentPlan"
                  value="FULL"
                  label="Pay in full now"
                  description="One payment, ticket issued straight away."
                  meta={tier ? formatKobo(tier.amountKobo) : undefined}
                  required
                  checked={paymentPlan === "FULL"}
                  onChange={() => setPaymentPlan("FULL")}
                />
                {installmentsEnabled ? (
                  <RadioCard
                    name="paymentPlan"
                    value="INSTALLMENT"
                    label="Pay in instalments"
                    description={`Spread it out. Your ticket is issued when the balance clears, minimum ${formatKobo(effectiveMinimum)} to start.`}
                    meta={holdAmount ? `from ${formatKobo(holdAmount)}` : undefined}
                    checked={paymentPlan === "INSTALLMENT"}
                    onChange={() => setPaymentPlan("INSTALLMENT")}
                  />
                ) : null}
              </div>
            </Field>

            {paymentPlan === "INSTALLMENT" && installmentsEnabled ? (
              <Field
                label="How would you like to split it?"
                required
                error={state.errors?.installmentChoice}
                hint="A guide, not a contract, you can pay more or less at any point."
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {SPLITS.map((count) => {
                    const per = tier ? perInstallmentKobo(tier.amountKobo, count) : null;
                    const belowMinimum = per !== null && per < effectiveMinimum;
                    return (
                      <RadioCard
                        key={count}
                        name="installmentChoice"
                        value={String(count)}
                        label={`${count} instalments`}
                        description={
                          belowMinimum
                            ? `Below the ${formatKobo(effectiveMinimum)} minimum per payment.`
                            : "Split evenly."
                        }
                        meta={per ? `${formatKobo(per)} each` : undefined}
                        disabled={belowMinimum}
                        checked={installmentChoice === String(count)}
                        onChange={() => setInstallmentChoice(String(count) as typeof installmentChoice)}
                        className={belowMinimum ? "opacity-45" : undefined}
                      />
                    );
                  })}
                  <RadioCard
                    name="installmentChoice"
                    value="CUSTOM"
                    label="Choose my first amount"
                    description="Pay what you can now, clear the rest whenever you like."
                    className="sm:col-span-2"
                    checked={installmentChoice === "CUSTOM"}
                    onChange={() => setInstallmentChoice("CUSTOM")}
                  />
                </div>

                {installmentChoice === "CUSTOM" ? (
                  <div className="mt-4">
                    <label htmlFor="customFirstAmountNaira" className="eyebrow text-ink-70">
                      Your first instalment
                    </label>
                    <div className="mt-1.5 flex items-stretch border border-ink/20 bg-paper focus-within:border-meridian">
                      <span className="flex items-center border-r border-ink/15 px-4 font-mono text-lg">
                        ₦
                      </span>
                      <Input
                        id="customFirstAmountNaira"
                        name="customFirstAmountNaira"
                        type="number"
                        inputMode="numeric"
                        min={Math.ceil(effectiveMinimum / 100)}
                        max={tier ? Math.floor(tier.amountKobo / 100) : undefined}
                        step={1000}
                        defaultValue={Math.ceil(effectiveMinimum / 100)}
                        className="border-0 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-45">
                      Between {formatKobo(effectiveMinimum)}
                      {tier ? ` and ${formatKobo(tier.amountKobo)}` : ""}.
                    </p>
                  </div>
                ) : null}
              </Field>
            ) : null}

            <div className="space-y-2.5">
              <Checkbox
                name="consentPhoto"
                defaultChecked
                label="I'm happy to appear in camp photos and video"
                description="Untick and the media team will keep you out of shot."
              />
              <Checkbox
                name="agreeTerms"
                required
                label="I accept the camp guidelines"
                description="Stay for the whole programme, respect the campground and its neighbours, and follow the safeguarding rules for children and teenagers."
              />
            </div>

            {tier ? (
              <div className="border border-ink bg-ink px-5 py-5 text-white">
                <p className="eyebrow text-brass">Your total</p>
                <p className="mt-2 flex items-baseline justify-between gap-4">
                  <span className="display text-3xl">{tier.label} ticket</span>
                  <span className="display text-3xl">{formatKobo(tier.amountKobo)}</span>
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/55">
                  Nothing is charged yet. You&apos;ll go to the payment page next, and your camp profile
                  opens as soon as you register.
                </p>
              </div>
            ) : (
              <FormError message="Go back to step 1 and choose a ticket so we can price it." />
            )}
          </fieldset>

          {/* ── controls ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-ink/12 pt-6">
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={goBack}>
                <ArrowLeft /> Back
              </Button>
            ) : null}

            {step < 4 ? (
              <Button type="button" onClick={goNext} className="ml-auto">
                Continue <Arrow />
              </Button>
            ) : (
              <div className="ml-auto flex flex-wrap items-center gap-2.5">
                {/* Registers exactly the same way, then lands on the camp profile
                    instead of the payment page. */}
                <SubmitButton
                  name="payLater"
                  value="1"
                  variant="outline"
                  withArrow={false}
                  pendingLabel="Registering…"
                >
                  Pay later
                </SubmitButton>
                <SubmitButton pendingLabel="Registering…">Register and pay</SubmitButton>
              </div>
            )}
          </div>

          {/* Without JavaScript the stepper never advances, so expose everything. */}
          <noscript>
            <p className="border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
              JavaScript is off, so the step buttons won&apos;t work. Turn it on, or call the camp desk
              on 0803 000 0000 and we&apos;ll register you over the phone.
            </p>
          </noscript>
        </form>
      </div>

      {/* ── aside ────────────────────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-ink/12 bg-paper p-6">
          <Eyebrow>Ticket prices</Eyebrow>
          <ul className="mt-4 space-y-3">
            {tiers.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-baseline justify-between gap-3 border-b border-ink/10 pb-3 last:border-0 last:pb-0",
                  tier?.id === item.id && "font-semibold",
                )}
              >
                <span className="text-sm">{item.label}</span>
                <span className="font-mono text-sm">{formatKobo(item.amountKobo)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 border border-ink/12 bg-paper p-6">
          <Eyebrow>Already registered?</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed text-ink-70">
            One registration per email address. If you&apos;ve done this already, go straight to
            payment.
          </p>
          <Link
            href="/camp/payment"
            className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
          >
            Pay a balance <Arrow />
          </Link>
        </div>
      </aside>
    </div>
  );
}
