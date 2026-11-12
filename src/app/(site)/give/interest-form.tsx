"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { registerInterest, type InterestState } from "./interest-actions";
import { NextFieldHint, SuccessBurst } from "@/components/site/motion";
import { Field, FormError, Input, RadioCard, Select } from "@/components/ui/form";
import { KeepValuesForm } from "@/components/ui/keep-values-form";
import { SubmitButton } from "@/components/ui/submit-button";

const MONTHLY = [
  { value: "WILLING", label: "Yes, I am willing to commit monthly" },
  { value: "NEEDS_CLARITY", label: "I am interested but need more clarity first" },
] as const;

const GIVE_MORE = [
  { value: "YES", label: "Yes, I can give more consistently" },
  { value: "POSSIBLY", label: "Possibly, I'd like to discuss this" },
  { value: "NO", label: "No, ₦20,000/$20/£20 is my current capacity" },
] as const;

const LONG_TERM = [
  { value: "COMMITTED", label: "I understand and I'm willing to commit long term" },
  { value: "START_AND_GROW", label: "I'm willing to start and grow to it" },
  { value: "NEEDS_CLARITY", label: "I need more clarity before committing" },
] as const;

/** A multiple-choice question, its wording as a sentence (too long for a label). */
function Question({
  legend,
  error,
  hint,
  required,
  children,
}: {
  legend: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 text-[15px] font-semibold leading-snug">
        {legend}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </legend>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-45">{hint}</p>
      ) : null}
    </fieldset>
  );
}

/**
 * The Angel Partners interest form (the team's Google form, on the site). It
 * registers interest only: no payment, and the team follows up with the
 * next steps. `months` are the months someone can choose to start in.
 */
export function InterestForm({ months }: { months: { value: string; label: string }[] }) {
  const [state, formAction] = useActionState<InterestState, FormData>(registerInterest, {});
  const [giveMore, setGiveMore] = useState("");
  const errorFor = (name: string) => state.errors?.[name];

  // The thank-you is far shorter than the form it replaces, which would leave
  // the page sitting on the payment section below: bring it into view.
  const thanks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.ok) thanks.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [state.ok]);

  if (state.ok) {
    return (
      <div ref={thanks} className="border border-ink/12 bg-paper p-6 sm:p-8" role="status">
        <SuccessBurst className="mb-6" />
        <h3 className="display text-3xl">Thank you, {state.firstName}</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-70">
          Your interest is registered. We&apos;ll be in touch on WhatsApp and email with the next
          steps towards becoming an active Angel Partner.
        </p>
      </div>
    );
  }

  return (
    <KeepValuesForm action={formAction} className="space-y-6 border border-ink/12 bg-paper p-6 sm:p-8">
      <NextFieldHint />
      <FormError message={state.error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="interest-first" required error={errorFor("firstName")}>
          <Input id="interest-first" name="firstName" autoComplete="given-name" required />
        </Field>
        <Field label="Last name" htmlFor="interest-last" required error={errorFor("lastName")}>
          <Input id="interest-last" name="lastName" autoComplete="family-name" required />
        </Field>
      </div>

      <Field label="Birthday" htmlFor="interest-birthday" error={errorFor("birthday")}>
        <Input id="interest-birthday" name="birthday" type="date" autoComplete="bday" />
      </Field>

      <Field label="Email address" htmlFor="interest-email" required error={errorFor("email")}>
        <Input id="interest-email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field
        label="WhatsApp phone number"
        htmlFor="interest-whatsapp"
        required
        hint="Please add your country code, +234."
        error={errorFor("whatsapp")}
      >
        <Input id="interest-whatsapp" name="whatsapp" type="tel" autoComplete="tel" placeholder="+234" required />
      </Field>

      <Field label="Country of residence" htmlFor="interest-country" error={errorFor("country")}>
        <Input id="interest-country" name="country" autoComplete="country-name" defaultValue="Nigeria" />
      </Field>

      <Question
        legend="Are you willing to commit to ₦20,000/$20 monthly as an Angel Partner?"
        required
        error={errorFor("monthly")}
      >
        <div className="grid gap-2">
          {MONTHLY.map((option) => (
            <RadioCard key={option.value} name="monthly" value={option.value} label={option.label} required />
          ))}
        </div>
      </Question>

      <Question
        legend="If you have the capacity, would you be willing to give more than ₦20,000/$20/£20 monthly toward the H2:14 mandate?"
        required
        error={errorFor("giveMore")}
      >
        <div className="grid gap-2">
          {GIVE_MORE.map((option) => (
            <RadioCard
              key={option.value}
              name="giveMore"
              value={option.value}
              label={option.label}
              required
              onChange={() => setGiveMore(option.value)}
            />
          ))}
        </div>
      </Question>

      {giveMore && giveMore !== "NO" ? (
        <Field
          label="If yes, how much would you like to give? (In your currency)"
          htmlFor="interest-more"
          error={errorFor("moreAmount")}
        >
          <Input id="interest-more" name="moreAmount" placeholder="₦50,000" />
        </Field>
      ) : null}

      <Field
        label="When would you like to activate your Angel Partnership commitment?"
        htmlFor="interest-month"
        hint="Kindly choose the specific month."
        error={errorFor("startMonth")}
      >
        <Select id="interest-month" name="startMonth" defaultValue="">
          <option value="">Choose a month</option>
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </Select>
      </Field>

      <Question
        legend="This partnership is a long-term commitment toward the 1 Million Mandate (up to 2030). Which best describes you?"
        required
        error={errorFor("longTerm")}
      >
        <div className="grid gap-2">
          {LONG_TERM.map((option) => (
            <RadioCard key={option.value} name="longTerm" value={option.value} label={option.label} required />
          ))}
        </div>
      </Question>

      <SubmitButton className="w-full" size="lg" pendingLabel="Registering…">
        Register my interest
      </SubmitButton>
      <p className="text-center text-xs leading-relaxed text-ink-45">
        Submitting this form does not process payment.
      </p>
    </KeepValuesForm>
  );
}
