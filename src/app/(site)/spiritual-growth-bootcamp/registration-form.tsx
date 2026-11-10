"use client";

import { useActionState } from "react";
import { Eyebrow } from "@/components/ui";
import { Field, FormError, Input, Select } from "@/components/ui/form";
import { KeepValuesForm } from "@/components/ui/keep-values-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerForSgb, type SgbRegistrationState } from "./actions";

const initialState: SgbRegistrationState = {};

export function SgbRegistrationForm() {
  const [state, formAction] = useActionState(registerForSgb, initialState);

  if (state.ok) {
    return (
      <div className="border border-success/30 bg-success-soft p-7">
        <Eyebrow className="text-success">We&apos;ve got it</Eyebrow>
        <p className="display mt-3 text-4xl text-ink">You&apos;re registered</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-70">
          You&apos;re registered. We&apos;ll send your confirmation and access information shortly.
        </p>
      </div>
    );
  }

  return (
    <KeepValuesForm action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required error={state.errors?.firstName}>
          <Input
            id="firstName"
            name="firstName"
            required
            minLength={2}
            maxLength={60}
            autoComplete="given-name"
          />
        </Field>
        <Field label="Last name" htmlFor="lastName" required error={state.errors?.lastName}>
          <Input
            id="lastName"
            name="lastName"
            required
            minLength={2}
            maxLength={60}
            autoComplete="family-name"
          />
        </Field>
      </div>

      <Field label="Phone number" htmlFor="phone" required error={state.errors?.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          minLength={7}
          maxLength={30}
          pattern="[+0-9() -]{7,30}"
          title="Enter a valid phone number"
          autoComplete="tel"
        />
      </Field>

      <Field label="Gender" htmlFor="gender" required error={state.errors?.gender}>
        <Select id="gender" name="gender" required defaultValue="">
          <option value="" disabled>
            Choose your gender
          </option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </Select>
      </Field>

      <Field label="Age" htmlFor="age" required error={state.errors?.age}>
        <Input id="age" name="age" type="number" required min={10} max={100} step={1} inputMode="numeric" />
      </Field>

      <Field label="Location" htmlFor="location" required error={state.errors?.location}>
        <Input
          id="location"
          name="location"
          required
          minLength={2}
          maxLength={120}
          placeholder="City, Country"
          autoComplete="address-level2"
        />
      </Field>

      <div
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <SubmitButton className="w-full" pendingLabel="Registering…">
        Register Now
      </SubmitButton>
      <p className="text-xs text-ink-45">Your details are only used for the Bootcamp.</p>
    </KeepValuesForm>
  );
}
