"use client";

import { useActionState, useState } from "react";
import { startPayment, type PayState } from "./actions";
import { ButtonLink } from "@/components/ui";
import { FormError, Input, RadioCard } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatKobo, toNaira } from "@/lib/money";

export function PayForm({
  registrantId,
  balanceKobo,
  minimumKobo,
  suggestedKobo,
  planCount,
  installmentsEnabled,
}: {
  registrantId: string;
  balanceKobo: number;
  minimumKobo: number;
  suggestedKobo: number;
  planCount: number | null;
  installmentsEnabled: boolean;
}) {
  const [state, formAction] = useActionState<PayState, FormData>(startPayment, {});
  // Someone on a plan is usually here to pay their next instalment, so open on
  // that rather than making them re-choose every time.
  const partial = suggestedKobo > 0 && suggestedKobo < balanceKobo;
  const [mode, setMode] = useState<"FULL" | "PART">(partial ? "PART" : "FULL");

  const minimumNaira = Math.ceil(toNaira(minimumKobo));
  const balanceNaira = Math.floor(toNaira(balanceKobo));

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="registrantId" value={registrantId} />
      <FormError message={state.error} />

      <div className="grid gap-2.5">
        <RadioCard
          name="mode"
          value="FULL"
          label="Clear the balance"
          description="One payment and you're done. Your ticket is emailed straight away."
          meta={formatKobo(balanceKobo)}
          checked={mode === "FULL"}
          onChange={() => setMode("FULL")}
        />
        {installmentsEnabled && balanceKobo > minimumKobo ? (
          <RadioCard
            name="mode"
            value="PART"
            label="Pay part of it"
            description={
              planCount
                ? `Your plan is ${planCount} instalments of ${formatKobo(suggestedKobo)}. Anything from ${formatKobo(minimumKobo)} is accepted.`
                : `Anything from ${formatKobo(minimumKobo)}. Come back and top up any time.`
            }
            checked={mode === "PART"}
            onChange={() => setMode("PART")}
          />
        ) : null}
      </div>

      {mode === "PART" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amountNaira" className="eyebrow text-ink-70">
            Amount to pay now
          </label>
          <div className="flex items-stretch border border-ink/20 bg-paper focus-within:border-meridian">
            <span className="flex items-center border-r border-ink/15 px-4 font-mono text-lg">
              ₦
            </span>
            <Input
              id="amountNaira"
              name="amountNaira"
              type="number"
              inputMode="numeric"
              min={minimumNaira}
              max={balanceNaira}
              step={100}
              defaultValue={Math.max(minimumNaira, Math.floor(toNaira(suggestedKobo)))}
              required
              className="border-0 focus:outline-none"
            />
          </div>
          <p className="text-xs text-ink-45">
            Between {formatKobo(minimumKobo)} and {formatKobo(balanceKobo)}.
          </p>
        </div>
      ) : null}

      <SubmitButton pendingLabel="Opening checkout…" className="w-full" size="lg">
        Continue to payment
      </SubmitButton>

      <ButtonLink href="/portal" variant="outline" size="lg" className="w-full">
        Pay later
      </ButtonLink>

      <p className="text-center text-xs text-ink-45">
        Card, bank transfer or USSD. You&apos;ll come straight back here when it&apos;s done.
      </p>
    </form>
  );
}
