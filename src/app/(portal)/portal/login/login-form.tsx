"use client";

import Link from "next/link";
import { useActionState } from "react";
import { portalSignIn, type LoginState } from "./actions";
import { Eyebrow } from "@/components/ui";
import { Field, FormError, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function PortalLoginForm({ prefillEmail = "" }: { prefillEmail?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(portalSignIn, {});

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
          defaultValue={prefillEmail}
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
        Open my camp profile
      </SubmitButton>

      <div className="border-t border-ink/12 pt-5">
        <Eyebrow>Not registered yet?</Eyebrow>
        <p className="mt-2 text-sm leading-relaxed text-ink-45">
          Your camp profile is created automatically when you register, and these same two details
          are your login. There is nothing extra to set up.
        </p>
        <Link
          href="/camp/register"
          className="mt-3 inline-block text-[12px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
        >
          Register for camp
        </Link>
      </div>
    </form>
  );
}
