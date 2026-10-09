"use client";

import { useActionState, useState } from "react";
import { startGiving, type GiveState } from "./actions";
import { Checkbox, Field, FormError, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  MONTHLY_MINIMUM_MAJOR,
  MONTHLY_PRESETS_MAJOR,
  ONE_TIME_MINIMUM_MAJOR,
  formatMoney,
  toMinor,
  type GivingCurrency,
} from "@/lib/giving-rules";
import { cn } from "@/lib/utils";
import { KeepValuesForm } from "@/components/ui/keep-values-form";

/** A pair of buttons that behave as one choice, sent as a hidden field. */
function Toggle<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 border border-ink/20">
      <input type="hidden" name={name} value={value} />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors",
            value === option.value ? "bg-ink text-white" : "bg-paper text-ink-70 hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function GiveForm() {
  const [state, formAction] = useActionState<GiveState, FormData>(startGiving, {});
  const [kind, setKind] = useState<"MONTHLY" | "ONE_TIME">("MONTHLY");
  const [currency, setCurrency] = useState<GivingCurrency>("NGN");
  const [amount, setAmount] = useState(String(MONTHLY_PRESETS_MAJOR.NGN[0]));
  const errorFor = (field: string) => state.errors?.[field];

  const minimum = kind === "MONTHLY" ? MONTHLY_MINIMUM_MAJOR[currency] : ONE_TIME_MINIMUM_MAJOR[currency];
  const symbol = currency === "NGN" ? "₦" : "$";

  function switchCurrency(next: GivingCurrency) {
    setCurrency(next);
    setAmount(String(MONTHLY_PRESETS_MAJOR[next][0]));
  }

  return (
    <KeepValuesForm action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Toggle
        name="kind"
        value={kind}
        onChange={setKind}
        options={[
          { value: "MONTHLY", label: "Monthly partner" },
          { value: "ONE_TIME", label: "One-time seed" },
        ]}
      />
      <Toggle
        name="currency"
        value={currency}
        onChange={switchCurrency}
        options={[
          { value: "NGN", label: "₦ Naira" },
          { value: "USD", label: "$ US dollar" },
        ]}
      />

      <Field
        label={kind === "MONTHLY" ? "Monthly amount" : "Amount"}
        htmlFor="amount"
        required
        error={errorFor("amount")}
        hint={`From ${formatMoney(toMinor(minimum), currency)}${kind === "MONTHLY" ? " a month" : ""}.`}
      >
        <div className="grid grid-cols-4 gap-2">
          {MONTHLY_PRESETS_MAJOR[currency].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={cn(
                "border px-2 py-2.5 font-mono text-[13px] transition-colors",
                Number(amount) === preset
                  ? "border-ink bg-ink text-white"
                  : "border-ink/20 bg-paper hover:border-ink",
              )}
            >
              {formatMoney(toMinor(preset), currency)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-stretch border border-ink/20 bg-paper focus-within:border-meridian">
          <span className="flex items-center border-r border-ink/15 px-4 font-mono text-lg">{symbol}</span>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min={minimum}
            step="any"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="border-0 focus:outline-none"
          />
        </div>
      </Field>

      <Field label="Full name" htmlFor="name" required error={errorFor("name")}>
        <Input id="name" name="name" autoComplete="name" required minLength={2} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email address" htmlFor="email" required error={errorFor("email")}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Phone number" htmlFor="phone" required error={errorFor("phone")}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" required />
        </Field>
      </div>
      <Field label="Country" htmlFor="country" error={errorFor("country")}>
        <Input id="country" name="country" autoComplete="country-name" defaultValue="Nigeria" />
      </Field>

      {kind === "MONTHLY" ? (
        <Checkbox name="wallOptIn" label="Put my name on the Founding 500 Wall" />
      ) : null}

      <SubmitButton className="w-full" size="lg" pendingLabel="Opening secure checkout…">
        {kind === "MONTHLY"
          ? `Start ${formatMoney(toMinor(Number(amount) || 0), currency)} monthly partnership`
          : `Give ${formatMoney(toMinor(Number(amount) || 0), currency)} seed`}
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-ink-45">
        Secured by Paystack.{" "}
        {kind === "MONTHLY"
          ? "Your card is charged today and on the same date each month. A covenant invitation: pause anytime."
          : "A single payment, nothing recurring."}
      </p>
    </KeepValuesForm>
  );
}
