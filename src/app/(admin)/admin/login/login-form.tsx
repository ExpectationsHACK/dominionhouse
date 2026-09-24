"use client";

import { useActionState } from "react";
import { adminSignIn, type AdminLoginState } from "./actions";
import { Field, FormError, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function AdminLoginForm() {
  const [state, formAction] = useActionState<AdminLoginState, FormData>(adminSignIn, {});

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" required autoComplete="username" autoFocus />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
