import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Eyebrow, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/giving-rules";
import { isMockPayments } from "@/lib/paystack";

export const metadata: Metadata = {
  title: "Simulated checkout",
  robots: { index: false, follow: false },
};

/**
 * Paystack's checkout, simulated, for walking the giving flow in development
 * without keys. Like the camp one, it doesn't exist once real keys are set.
 */
export default async function GiveSimulatePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  if (!isMockPayments) notFound();
  const { reference } = await searchParams;
  if (!reference) notFound();
  const gift = await db.gift.findUnique({ where: { reference } });
  if (!gift) notFound();

  async function approve() {
    "use server";
    redirect(`/give/thank-you?reference=${encodeURIComponent(reference!)}`);
  }

  async function decline() {
    "use server";
    await db.gift.update({
      where: { reference: reference! },
      data: { status: "FAILED", note: "Declined: simulated decline (test mode)." },
    });
    redirect(`/give/thank-you?reference=${encodeURIComponent(reference!)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <Notice tone="warn" title="Simulated checkout" className="mb-8">
        This screen only exists because no Paystack keys are set. Nothing is charged.
      </Notice>
      <div className="border border-ink/12 bg-paper">
        <div className="border-b border-ink/12 bg-ink px-6 py-5 text-white">
          <Eyebrow className="text-brass">
            {gift.kind === "MONTHLY" ? "Monthly subscription" : "One-time payment"}
          </Eyebrow>
          <p className="mt-2 text-sm text-white/60">{gift.email}</p>
          <p className="display mt-3 text-4xl">{formatMoney(gift.amountMinor, gift.currency)}</p>
        </div>
        <div className="flex flex-col gap-2.5 p-6">
          <form action={approve}>
            <SubmitButton className="w-full">Approve test payment</SubmitButton>
          </form>
          <form action={decline}>
            <SubmitButton variant="outline" className="w-full">
              Decline it
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
