"use client";

import { useActionState } from "react";
import { completeProfile, type CompleteProfileState } from "./profile-actions";
import { Eyebrow, Panel } from "@/components/ui";
import { Field, FormError, Input, RadioCard } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Shown at the top of the camp profile to someone whose registration came
 * from an outside list (the LARK form), which didn't ask for these. Rooms are
 * allocated by gender, and the camp needs someone to call in an emergency.
 */
export function CompleteProfile({
  firstName,
  needsGender,
  needsEmergency,
}: {
  firstName: string;
  needsGender: boolean;
  needsEmergency: boolean;
}) {
  const [state, formAction] = useActionState<CompleteProfileState, FormData>(completeProfile, {});
  const errorFor = (field: string) => state.errors?.[field];

  return (
    <Panel className="border-brass p-6 sm:p-8">
      <Eyebrow className="text-brass">One last thing</Eyebrow>
      <h2 className="display mt-3 text-3xl sm:text-4xl">Welcome, {firstName}. Finish your profile</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-70">
        Your registration came in from the camp form, so your profile is already set up. The form
        didn&apos;t ask {needsGender && needsEmergency ? "two things" : "one thing"} we need before
        camp: {needsGender ? "your gender, for room allocation" : null}
        {needsGender && needsEmergency ? ", and " : null}
        {needsEmergency ? "someone to call in an emergency" : null}.
      </p>

      <form action={formAction} className="mt-6 space-y-5">
        <FormError message={state.error} />

        {needsGender ? (
          <Field label="Gender" required error={errorFor("gender")} hint="Used for room allocation.">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <RadioCard name="gender" value="MALE" label="Male" required />
              <RadioCard name="gender" value="FEMALE" label="Female" required />
            </div>
          </Field>
        ) : null}

        {needsEmergency ? (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Emergency contact" htmlFor="emergencyName" required error={errorFor("emergencyName")}>
              <Input id="emergencyName" name="emergencyName" required minLength={2} autoComplete="off" />
            </Field>
            <Field label="Their phone" htmlFor="emergencyPhone" required error={errorFor("emergencyPhone")}>
              <Input id="emergencyPhone" name="emergencyPhone" type="tel" required placeholder="0803 123 4567" />
            </Field>
            <Field label="Relationship" htmlFor="emergencyRelation" hint="Parent, spouse, friend…">
              <Input id="emergencyRelation" name="emergencyRelation" />
            </Field>
          </div>
        ) : null}

        <SubmitButton pendingLabel="Saving…">Save my details</SubmitButton>
      </form>
    </Panel>
  );
}
