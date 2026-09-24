"use client";

import { useActionState } from "react";
import { lookupRegistration, type LookupState } from "./actions";
import { Field, FormError, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function LookupForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, formAction] = useActionState<LookupState, FormData>(lookupRegistration, {});

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="Email address"
        htmlFor="email"
        required
        hint="The address you registered with."
      >
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={defaultEmail}
        />
      </Field>

      <Field
        label="Phone number"
        htmlFor="phone"
        required
        hint="The number on your registration. 0803… or +234803… both work."
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="0803 123 4567"
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Signing you in…">
        Log in to my profile
      </SubmitButton>
    </form>
  );
}
