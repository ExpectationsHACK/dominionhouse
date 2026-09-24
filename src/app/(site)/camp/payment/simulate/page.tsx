import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Eyebrow, Notice } from "@/components/ui";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/lib/db";
import { formatKobo } from "@/lib/money";
import { isMockPayments } from "@/lib/paystack";

export const metadata: Metadata = {
  title: "Simulated checkout",
  robots: { index: false, follow: false },
};

/**
 * Stands in for Paystack's hosted checkout while no live keys are configured,
 * so the whole registration → payment → ticket chain can be walked end to end
 * in development. Refuses to exist the moment real keys are present.
 */
export default async function SimulateCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  if (!isMockPayments) notFound();

  const { reference } = await searchParams;
  if (!reference) notFound();

  const payment = await db.payment.findUnique({
    where: { reference },
    include: { registrant: true },
  });

  if (!payment) notFound();

  async function approve() {
    "use server";
    redirect(`/camp/payment/callback?reference=${encodeURIComponent(reference!)}`);
  }

  async function decline() {
    "use server";
    await db.payment.update({ where: { reference: reference! }, data: { status: "FAILED" } });
    redirect(`/camp/payment/callback?reference=${encodeURIComponent(reference!)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <Notice tone="warn" title="Simulated checkout" className="mb-8">
        This screen only exists because no Paystack keys are set. Nothing is charged.
      </Notice>

      <div className="border border-ink/12 bg-paper">
        <div className="border-b border-ink/12 bg-ink px-6 py-5 text-white">
          <Eyebrow className="text-brass">Pay with Paystack</Eyebrow>
          <p className="mt-2 text-sm text-white/60">{payment.registrant.email}</p>
          <p className="display mt-3 text-4xl">{formatKobo(payment.amountKobo)}</p>
        </div>

        <div className="space-y-3 p-6">
          <p className="font-mono text-xs text-ink-45">{payment.reference}</p>
          <form action={approve}>
            <SubmitButton className="w-full" pendingLabel="Processing…">
              Approve payment
            </SubmitButton>
          </form>
          <form action={decline}>
            <SubmitButton
              className="w-full"
              variant="outline"
              withArrow={false}
              pendingLabel="Cancelling…"
            >
              Simulate a failure
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
