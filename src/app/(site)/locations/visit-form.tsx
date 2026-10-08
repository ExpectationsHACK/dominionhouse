"use client";

import { useActionState } from "react";
import { planAVisit, type VisitState } from "./actions";
import { Eyebrow } from "@/components/ui";
import { Checkbox, Field, FormError, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { CAMPUSES } from "@/lib/church";

export function VisitForm({ defaultCampus = "" }: { defaultCampus?: string }) {
  const [state, formAction] = useActionState<VisitState, FormData>(planAVisit, {});

  if (state.ok) {
    return (
      <div className="border border-success/30 bg-success-soft p-7">
        <Eyebrow className="text-success">We&apos;ve got it</Eyebrow>
        <p className="display mt-3 text-4xl text-ink">See you soon, {state.firstName}</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-70">
          Someone from the lighthouse you picked will be in touch. When you arrive, say your name at the
          welcome desk, they&apos;ll be expecting you.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required error={state.errors?.firstName}>
          <Input id="firstName" name="firstName" required autoComplete="given-name" />
        </Field>
        <Field label="Last name" htmlFor="lastName" required error={state.errors?.lastName}>
          <Input id="lastName" name="lastName" required autoComplete="family-name" />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" required error={state.errors?.email}>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </Field>

      <Field label="Phone" htmlFor="phone" error={state.errors?.phone}>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </Field>

      <Field
        label="Which lighthouse?"
        htmlFor="campus"
        required
        error={state.errors?.campus}
        hint="We'll pass your details to that lighthouse team, and nobody else."
      >
        <Select id="campus" name="campus" required defaultValue={defaultCampus}>
          <option value="" disabled>
            Choose a lighthouse
          </option>
          {CAMPUSES.map((campus) => (
            <option key={campus.slug} value={campus.name}>
              {campus.name}, {campus.country}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Which Sunday?"
        htmlFor="visitDate"
        error={state.errors?.visitDate}
        hint="Leave blank if you're not sure yet."
      >
        <Input id="visitDate" name="visitDate" type="date" />
      </Field>

      <Field label="How did you hear about us?" htmlFor="howHeard">
        <Select id="howHeard" name="howHeard" defaultValue="">
          <option value="">Prefer not to say</option>
          <option value="A friend">A friend invited me</option>
          <option value="Instagram">Instagram</option>
          <option value="YouTube">YouTube</option>
          <option value="Outreach">An outreach or evangelism team</option>
          <option value="Walked past">I walked past the building</option>
          <option value="Camp Meeting">Camp Meeting</option>
          <option value="Other">Somewhere else</option>
        </Select>
      </Field>

      <Field
        label="Anything you'd like prayer for?"
        htmlFor="prayerRequest"
        hint="Only the pastoral team reads this."
      >
        <Textarea id="prayerRequest" name="prayerRequest" rows={3} />
      </Field>

      <Checkbox
        name="wantsFollowUp"
        defaultChecked
        label="Someone can contact me before I visit"
        description="Untick and we'll simply look out for you at the door."
      />

      <SubmitButton className="w-full" pendingLabel="Sending…">
        Tell us you&apos;re coming
      </SubmitButton>
    </form>
  );
}
