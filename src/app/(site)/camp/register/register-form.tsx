"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
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
import { amountDueKobo } from "@/lib/pricing";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { CAMPUS_REGIONS, LIGHTHOUSES_OR_MINISTRIES } from "@/lib/church";
import { cn } from "@/lib/utils";
import { fieldErrors, identityStep, logisticsStep } from "@/lib/validation";
import { KeepValuesForm } from "@/components/ui/keep-values-form";

/** Which step a schema field lives on, so a server-side error (or an error
 * caught before ever reaching the server) always lands the wizard on the
 * step that actually shows it, instead of leaving a banner with no visible
 * detail on whatever step the person happens to be looking at. */
const FIELD_STEP: Record<string, number> = {
  registeringAs: 1, firstName: 1, lastName: 1, email: 1, phone: 1, gender: 1, childAgeYears: 1,
  position: 2, lighthouse: 2, region: 2, branch: 2, city: 2, state: 2,
  ageGroup: 2, maritalStatus: 2, howHeard: 2, isFirstCamp: 2,
  wantsPersonalAccommodation: 3, transportNeeded: 3, emergencyName: 3, emergencyPhone: 3,
  emergencyRelation: 3, medicalNotes: 3, allergies: 3,
  bringingChildren: 3, childrenUnder5: 3, children5to11: 3,
  paymentPlan: 4, installmentChoice: 4, customFirstAmountNaira: 4, agreeTerms: 4, consentPhoto: 4,
};

const AGE_GROUPS = [
  { value: "AGE_18_25", label: "18–25" },
  { value: "AGE_26_35", label: "26–35" },
  { value: "AGE_36_50", label: "36–50" },
  { value: "AGE_51_70", label: "51–70" },
] as const;

const HOW_HEARD = [
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "MEMBER_OR_PARTNER", label: "I am a member/partner" },
  { value: "THROUGH_A_FRIEND", label: "Through a friend" },
  { value: "THROUGH_EMAIL", label: "Through email" },
  { value: "THROUGH_SMS", label: "Through SMS" },
] as const;

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
  1: ["registeringAs", "firstName", "lastName", "email", "phone", "gender", "childAgeYears"],
  2: ["position", "lighthouse", "region", "ageGroup", "maritalStatus", "howHeard"],
  3: ["emergencyName", "emergencyPhone"],
  4: ["paymentChoice", "installmentChoice", "agreeTerms"],
};

const SPLITS = [2, 3, 4, 5] as const;

const REGISTERING_AS = [
  { value: "ADULT", label: "An adult", description: "Done with university, or 20 and above." },
  { value: "STUDENT", label: "A campus student", description: "In a tertiary institution, or a recent graduate." },
  { value: "TEEN", label: "A teenager", description: "12–17." },
  { value: "CHILD", label: "A child", description: "11 and under, free under 5. You register on their behalf." },
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
  // What they picked on the last step. "LATER" is not a plan of its own: it is stored
  // as pay-in-full (they choose properly on the payment page) and only changes
  // where they land after registering.
  const [paymentChoice, setPaymentChoice] = useState<"FULL" | "INSTALLMENT" | "LATER">("FULL");
  const paymentPlan = paymentChoice === "INSTALLMENT" ? "INSTALLMENT" : "FULL";
  const [installmentChoice, setInstallmentChoice] = useState<"2" | "3" | "4" | "5" | "CUSTOM">("2");
  const [lighthouse, setLighthouse] = useState("");
  const [childAgeYears, setChildAgeYears] = useState("");
  const [bringingChildren, setBringingChildren] = useState(false);
  // Strings, not numbers, so the field can be emptied to type a real value
  // instead of snapping back to a "0" that has to be selected and overtyped.
  const [childrenUnder5, setChildrenUnder5] = useState("0");
  const [children5to11, setChildren5to11] = useState("0");
  const childCountUnder5 = Number(childrenUnder5) || 0;
  const childCount5to11 = Number(children5to11) || 0;
  const bringingAnyChildren =
    registeringAs === "ADULT" && bringingChildren && childCountUnder5 + childCount5to11 > 0;
  const totalTicketCount = 1 + (bringingAnyChildren ? childCountUnder5 + childCount5to11 : 0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // A server-side rejection (or a check caught before ever submitting) always
  // has its field on some step; jump there so the error is actually visible
  // instead of leaving a banner with no visible detail on whatever step the
  // person happens to be looking at.
  useEffect(() => {
    const keys = Object.keys(state.errors ?? {});
    if (keys.length === 0) return;
    const earliest = Math.min(...keys.map((key) => FIELD_STEP[key] ?? 4));
    setStep((current) => Math.min(current, earliest));
  }, [state.errors]);

  // The card answers "what does my ticket cost?" the moment they pick; the
  // server looks the real price up from the chosen category again.
  const tier = useMemo(
    () => tiers.find((candidate) => candidate.category === registeringAs) ?? null,
    [registeringAs, tiers],
  );
  const childTier = useMemo(() => tiers.find((candidate) => candidate.category === "CHILD") ?? null, [tiers]);

  // What they'll actually be charged, a Guest lighthouse, a free under-5 child
  // ticket, and a surcharge for 5–11-year-olds tagging along all change this
  // from the sticker price, the server works out the same number again.
  const effectiveAmountKobo = useMemo(() => {
    if (!tier) return 0;
    return amountDueKobo({
      category: registeringAs,
      tierAmountKobo: tier.amountKobo,
      lighthouse,
      childAgeYears: registeringAs === "CHILD" ? (childAgeYears === "" ? null : Number(childAgeYears)) : null,
      bringingChildren: registeringAs === "ADULT" && bringingChildren,
      children5to11: childCount5to11,
      childFeeKobo: childTier?.amountKobo ?? 1_500_000,
    });
  }, [tier, registeringAs, lighthouse, childAgeYears, bringingChildren, childCount5to11, childTier]);
  const isFree = tier !== null && effectiveAmountKobo === 0;

  /**
   * A required-but-empty field is caught by checkValidity() below, but a
   * field with something typed into it that still isn't valid, a phone
   * number in the wrong shape being the real case this exists for, isn't:
   * the browser sees a non-empty <input type="tel">, calls that valid, and
   * only the server's stricter regex catches it, three steps later where
   * the field itself is off-screen. Running the real schema here closes
   * that gap before it's ever possible to advance past it.
   */
  function validateStep(keys: string[], schema: { safeParse: (data: unknown) => { success: boolean; error?: import("zod").ZodError } }) {
    const form = document.getElementById("register-form") as HTMLFormElement | null;
    if (!form) return true;
    const data = Object.fromEntries(new FormData(form));
    const subset = Object.fromEntries(keys.map((key) => [key, data[key]]));
    const result = schema.safeParse(subset);
    if (!result.success) {
      setLocalErrors((current) => ({ ...current, ...fieldErrors(result.error!) }));
      return false;
    }
    setLocalErrors((current) => {
      const next = { ...current };
      for (const key of keys) delete next[key];
      return next;
    });
    return true;
  }

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

    if (
      step === 1 &&
      !validateStep(["registeringAs", "firstName", "lastName", "email", "phone", "gender"], identityStep)
    ) {
      return;
    }
    if (
      step === 3 &&
      !validateStep(
        [
          "wantsPersonalAccommodation",
          "transportNeeded",
          "emergencyName",
          "emergencyPhone",
          "emergencyRelation",
          "medicalNotes",
          "allergies",
          "bringingChildren",
          "childrenUnder5",
          "children5to11",
        ],
        logisticsStep,
      )
    ) {
      return;
    }

    setStep((current) => Math.min(4, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** A pre-submit local catch and a post-submit server error both surface the
   * same way, whichever one exists for this field. */
  function errorFor(name: string) {
    return localErrors[name] ?? state.errors?.[name];
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

        <KeepValuesForm id="register-form" action={formAction} className="space-y-8">
          {/* ── step 1 ─────────────────────────────────────────────────── */}
          <fieldset className={cn("space-y-6 border-0 p-0", step !== 1 && "hidden")}>
            <legend className="sr-only">About you</legend>

            <Field
              label="Who is this registration for?"
              required
              error={errorFor("registeringAs")}
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
              <Field label="First name" htmlFor="firstName" required error={errorFor("firstName")}>
                <Input id="firstName" name="firstName" required autoComplete="given-name" minLength={2} />
              </Field>
              <Field label="Last name" htmlFor="lastName" required error={errorFor("lastName")}>
                <Input id="lastName" name="lastName" required autoComplete="family-name" minLength={2} />
              </Field>
            </div>

            <Field
              label="Email address"
              htmlFor="email"
              required
              error={errorFor("email")}
              hint="This is your camp login and where your ticket is sent. Use one you actually check."
            >
              <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" />
            </Field>

            <Field label="Phone number" htmlFor="phone" required error={errorFor("phone")}>
              <Input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="0803 123 4567" />
            </Field>

            <Field label="Gender" required error={errorFor("gender")} hint="Used for room allocation.">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <RadioCard name="gender" value="MALE" label="Male" required />
                <RadioCard name="gender" value="FEMALE" label="Female" required />
              </div>
            </Field>

            {registeringAs === "CHILD" ? (
              <Field
                label="Child's age"
                htmlFor="childAgeYears"
                required
                error={state.errors?.childAgeYears}
                hint="Under 5 comes free. 5 to 11 pays the child fee."
              >
                <Input
                  id="childAgeYears"
                  name="childAgeYears"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={11}
                  required
                  value={childAgeYears}
                  onChange={(event) => setChildAgeYears(event.target.value)}
                />
              </Field>
            ) : null}

            {tier ? (
              <div className="border border-brass/40 bg-brass-soft px-4 py-3.5">
                <p className="eyebrow text-ink-45">Your ticket</p>
                <p className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="display text-2xl">{tier.label}</span>
                  <span className="font-mono text-lg font-semibold">
                    {isFree ? "Free" : formatKobo(effectiveAmountKobo)}
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
                <Select
                  id="lighthouse"
                  name="lighthouse"
                  required
                  defaultValue=""
                  onChange={(event) => setLighthouse(event.target.value)}
                >
                  <option value="" disabled>
                    Choose a Lighthouse or Ministry
                  </option>
                  {LIGHTHOUSES_OR_MINISTRIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                {lighthouse === "Guest" && registeringAs !== "CHILD" ? (
                  <p className="mt-1.5 text-xs font-medium text-meridian">
                    Guests come free, there's nothing to pay.
                  </p>
                ) : null}
              </Field>
            )}

            {registeringAs === "ADULT" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Age group" htmlFor="ageGroup" required error={state.errors?.ageGroup}>
                  <Select id="ageGroup" name="ageGroup" required defaultValue="">
                    <option value="" disabled>
                      Choose your age group
                    </option>
                    {AGE_GROUPS.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Marital status" required error={state.errors?.maritalStatus}>
                  <div className="grid grid-cols-2 gap-2.5">
                    <RadioCard name="maritalStatus" value="SINGLE" label="Single" required />
                    <RadioCard name="maritalStatus" value="MARRIED" label="Married" required />
                  </div>
                </Field>
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="City" htmlFor="city" error={state.errors?.city}>
                <Input id="city" name="city" autoComplete="address-level2" placeholder="Lagos" />
              </Field>
              <Field label="State" htmlFor="state" error={state.errors?.state}>
                <Input id="state" name="state" autoComplete="address-level1" placeholder="Lagos" />
              </Field>
            </div>

            <Field
              label="How did you hear about the camp meeting?"
              htmlFor="howHeard"
              required
              error={state.errors?.howHeard}
            >
              <Select id="howHeard" name="howHeard" required defaultValue="">
                <option value="" disabled>
                  Choose one
                </option>
                {HOW_HEARD.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

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

            {registeringAs === "ADULT" ? (
              <div className="rule pt-6">
                <Eyebrow>Bringing children</Eyebrow>
                <div className="mt-4">
                  <Checkbox
                    name="bringingChildren"
                    label="I'm coming with children"
                    description="Whether you're a parent or a couple bringing a child, or minding a child or teenager under 12. They're not separate registrants, just tell us how many."
                    checked={bringingChildren}
                    onChange={(event) => setBringingChildren(event.target.checked)}
                  />
                </div>
                {bringingChildren ? (
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <Field
                      label="How many under 5? (free)"
                      htmlFor="childrenUnder5"
                    >
                      <Input
                        id="childrenUnder5"
                        name="childrenUnder5"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={childrenUnder5}
                        onChange={(event) => setChildrenUnder5(event.target.value)}
                        onBlur={() => setChildrenUnder5((current) => (current === "" ? "0" : current))}
                      />
                    </Field>
                    <Field
                      label={`How many 5 to 11? (${childTier ? formatKobo(childTier.amountKobo) : "₦15,000"} each)`}
                      htmlFor="children5to11"
                    >
                      <Input
                        id="children5to11"
                        name="children5to11"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={children5to11}
                        onChange={(event) => setChildren5to11(event.target.value)}
                        onBlur={() => setChildren5to11((current) => (current === "" ? "0" : current))}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rule pt-6">
              <Eyebrow>In case of emergency</Eyebrow>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Contact name"
                  htmlFor="emergencyName"
                  required
                  error={errorFor("emergencyName")}
                >
                  <Input id="emergencyName" name="emergencyName" required minLength={2} />
                </Field>
                <Field
                  label="Contact phone"
                  htmlFor="emergencyPhone"
                  required
                  error={errorFor("emergencyPhone")}
                >
                  <Input id="emergencyPhone" name="emergencyPhone" type="tel" required />
                </Field>
              </div>
              <Field
                label="Relationship"
                htmlFor="emergencyRelation"
                className="mt-5"
                error={errorFor("emergencyRelation")}
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
                  error={errorFor("medicalNotes")}
                  hint="Conditions and medication. Seen only by the camp medical team."
                >
                  <Textarea id="medicalNotes" name="medicalNotes" rows={3} />
                </Field>
                <Field
                  label="Do you have any allergies?"
                  htmlFor="allergies"
                  error={errorFor("allergies")}
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

            {isFree ? (
              <div className="border border-meridian/40 bg-brass-soft px-4 py-3.5">
                <p className="eyebrow text-ink-45">Nothing to pay</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-70">
                  {lighthouse === "Guest"
                    ? "Guests come to camp free."
                    : "This child's ticket is free under 5."}{" "}
                  Your ticket is issued the moment you register.
                </p>
              </div>
            ) : (
              <Field
                label="How would you like to pay?"
                required
                error={state.errors?.paymentPlan}
                hint="You can change your mind at the payment page, this just tells us your plan."
              >
                <div className="grid gap-2.5">
                  <RadioCard
                    name="paymentChoice"
                    value="FULL"
                    label="Pay in full now"
                    description="One payment, ticket issued straight away."
                    meta={formatKobo(effectiveAmountKobo)}
                    required
                    checked={paymentChoice === "FULL"}
                    onChange={() => setPaymentChoice("FULL")}
                  />
                  {installmentsEnabled ? (
                    <RadioCard
                      name="paymentChoice"
                      value="INSTALLMENT"
                      label="Pay in instalments"
                      description={`Spread it out. Your ticket is issued when the balance clears, minimum ${formatKobo(effectiveMinimum)} to start.`}
                      meta={holdAmount ? `from ${formatKobo(holdAmount)}` : undefined}
                      checked={paymentChoice === "INSTALLMENT"}
                      onChange={() => setPaymentChoice("INSTALLMENT")}
                    />
                  ) : null}
                  <RadioCard
                    name="paymentChoice"
                    value="LATER"
                    label="Pay later"
                    description="Register now and pay whenever you're ready from your camp profile. Your ticket is issued once your balance is cleared."
                    checked={paymentChoice === "LATER"}
                    onChange={() => setPaymentChoice("LATER")}
                  />
                </div>
              </Field>
            )}

            {/* The server reads the plan and the pay-later flag from these. */}
            <input type="hidden" name="paymentPlan" value={paymentPlan} />
            {!isFree && paymentChoice === "LATER" ? <input type="hidden" name="payLater" value="1" /> : null}

            {!isFree && paymentPlan === "INSTALLMENT" && installmentsEnabled ? (
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

                {bringingAnyChildren ? (
                  <>
                    <p className="mt-3 text-xs uppercase tracking-[0.1em] text-white/50">
                      {totalTicketCount} tickets: you and {childCountUnder5 + childCount5to11}{" "}
                      {childCountUnder5 + childCount5to11 === 1 ? "child" : "children"}
                    </p>
                    <dl className="mt-3 space-y-2 border-t border-white/15 pt-3 text-sm">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt>{tier.label} ticket</dt>
                        <dd className="font-mono">{formatKobo(tier.amountKobo)}</dd>
                      </div>
                      {childCount5to11 > 0 ? (
                        <div className="flex items-baseline justify-between gap-4">
                          <dt>
                            {childCount5to11} × child ticket (5–11)
                          </dt>
                          <dd className="font-mono">
                            {formatKobo(childCount5to11 * (childTier?.amountKobo ?? 1_500_000))}
                          </dd>
                        </div>
                      ) : null}
                      {childCountUnder5 > 0 ? (
                        <div className="flex items-baseline justify-between gap-4 text-white/60">
                          <dt>{childCountUnder5} × child ticket (under 5)</dt>
                          <dd>Free</dd>
                        </div>
                      ) : null}
                    </dl>
                  </>
                ) : null}

                <p className="mt-3 flex items-baseline justify-between gap-4 border-t border-white/15 pt-3">
                  <span className="display text-3xl">
                    {bringingAnyChildren ? "Total" : `${tier.label} ticket`}
                  </span>
                  <span className="display text-3xl">
                    {isFree ? "Free" : formatKobo(effectiveAmountKobo)}
                  </span>
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/55">
                  {isFree
                    ? "Nothing to pay. Your ticket is issued the moment you register, straight to your camp profile."
                    : paymentChoice === "LATER"
                      ? "Nothing is charged. You'll go straight to your camp profile, where you can pay any time."
                      : "Nothing is charged yet. You'll go to the payment page next, and your camp profile opens as soon as you register."}
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
              <SubmitButton className="ml-auto" pendingLabel="Registering…">
                {isFree ? "Register" : paymentChoice === "LATER" ? "Register now" : "Register and pay"}
              </SubmitButton>
            )}
          </div>

          {/* Without JavaScript the stepper never advances, so expose everything. */}
          <noscript>
            <p className="border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
              JavaScript is off, so the step buttons won&apos;t work. Turn it on, or call the camp desk
              on 0803 000 0000 and we&apos;ll register you over the phone.
            </p>
          </noscript>
        </KeepValuesForm>
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
