import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, ArrowLeft, ButtonLink, DataRow, Eyebrow, Notice, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { formatKobo } from "@/lib/money";
import { isMockPayments, verifyTransaction } from "@/lib/paystack";
import { classifyGatewayOutcome } from "@/lib/payment-outcome";
import { recordUnsuccessfulPayment, settlePayment } from "@/lib/registration";

export const metadata: Metadata = {
  title: "Payment result",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ reference?: string; trxref?: string }>;

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  if (!reference) {
    return (
      <Shell>
        <Notice tone="danger" title="No payment reference">
          We didn&apos;t get a reference back from the payment page. If money left your account,
          email dominionhs@gmail.com and we&apos;ll sort it out.
        </Notice>
      </Shell>
    );
  }

  const payment = await db.payment.findUnique({
    where: { reference },
    include: { registrant: true },
  });

  if (!payment) {
    return (
      <Shell>
        <Notice tone="danger" title="We don't recognise that reference">
          <p className="mt-1 font-mono text-xs">{reference}</p>
        </Notice>
      </Shell>
    );
  }

  let failure: string | null = null;
  let processing: string | null = null;

  // Simulated checkout has nothing to re-check with: a recorded decline stays one.
  const mockAlreadyDecided = isMockPayments && payment.status !== "PENDING";
  if (mockAlreadyDecided && payment.status !== "SUCCESS") failure = payment.note;

  if (payment.status !== "SUCCESS" && !mockAlreadyDecided) {
    try {
      const verified = await verifyTransaction(reference);

      const outcome = classifyGatewayOutcome({
        status: verified.status,
        gatewayResponse: verified.gatewayResponse,
      });

      if (outcome.kind === "success") {
        await settlePayment({
          reference,
          paidAt: verified.paidAt,
          channel: verified.channel,
          gatewayRaw: verified.raw,
          verifiedAmountKobo: verified.amountKobo,
        });
      } else if (outcome.kind === "recorded") {
        // Kept on the payment history with the reason, so it shows up there.
        await recordUnsuccessfulPayment({
          reference,
          status: outcome.status,
          note: outcome.note,
          gatewayRaw: verified.raw,
        });
        failure = outcome.note;
      } else {
        processing = outcome.note;
      }
    } catch (error) {
      failure =
        error instanceof Error
          ? error.message
          : "We couldn't confirm this payment with the bank just yet.";
    }
  }

  const settled = await db.payment.findUniqueOrThrow({
    where: { reference },
    include: {
      registrant: {
        include: { payments: true, ticket: true },
      },
    },
  });

  const registrant = settled.registrant;
  const paidKobo = registrant.payments
    .filter((item) => item.status === "SUCCESS")
    .reduce((sum, item) => sum + item.amountKobo, 0);
  const balanceKobo = Math.max(0, registrant.amountDueKobo - paidKobo);
  const success = settled.status === "SUCCESS";

  return (
    <Shell>
      {success ? (
        <>
          <Eyebrow className="text-success">Payment received</Eyebrow>
          <h1 className="display mt-3 text-[clamp(2.5rem,8vw,6rem)]">
            {balanceKobo === 0 ? "You're paid in full" : "Thank you"}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-70">
            {balanceKobo === 0
              ? `Your ticket has been issued and emailed to ${registrant.email}. See you at camp meeting.`
              : `We've credited ${formatKobo(settled.amountKobo)} to your camp account. ${formatKobo(balanceKobo)} left to clear.`}
          </p>

          <Panel className="mt-10 p-6">
            <DataRow label="Reference" value={<span className="font-mono">{settled.reference}</span>} />
            <DataRow label="This payment" value={formatKobo(settled.amountKobo)} />
            <DataRow label="Total paid" value={formatKobo(paidKobo)} />
            <DataRow label="Camp fee" value={formatKobo(registrant.amountDueKobo)} />
            <DataRow
              label="Balance"
              value={balanceKobo === 0 ? <span className="text-success">Cleared</span> : formatKobo(balanceKobo)}
            />
            {registrant.ticket ? (
              <DataRow
                label="Ticket"
                value={<span className="font-mono">{registrant.ticket.code}</span>}
              />
            ) : null}
          </Panel>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <ButtonLink href="/portal" size="lg">
              Open my camp profile <Arrow />
            </ButtonLink>
            {balanceKobo > 0 ? (
              <ButtonLink
                href={`/camp/payment?email=${encodeURIComponent(registrant.email)}`}
                variant="outline"
                size="lg"
              >
                Pay the balance
              </ButtonLink>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <Eyebrow className={processing ? undefined : "text-danger"}>
            {processing ? "Payment processing" : "Payment not completed"}
          </Eyebrow>
          <h1 className="display mt-3 text-[clamp(2.5rem,8vw,6rem)]">
            {processing ? "Still processing" : "That didn’t go through"}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-70">
            {processing
              ? `${processing} Check your payment history in a few minutes. If it succeeds, your balance and ticket update on their own.`
              : `${failure ?? "The payment wasn't completed."} This attempt is saved in your payment history, and your place is still held. You can try again whenever you're ready.`}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {processing ? (
              <ButtonLink href="/portal/payments" size="lg">
                See my payment history <Arrow />
              </ButtonLink>
            ) : (
              <ButtonLink
                href={`/camp/payment?email=${encodeURIComponent(registrant.email)}`}
                size="lg"
              >
                Try again <Arrow />
              </ButtonLink>
            )}
            <Link
              href="mailto:dominionhs@gmail.com"
              className="inline-flex items-center px-2 text-sm font-semibold underline underline-offset-4"
            >
              Email the camp desk
            </Link>
          </div>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <ButtonLink href="/camp" size="sm" className="mb-8">
        <ArrowLeft /> Back to camp
      </ButtonLink>
      {children}
    </div>
  );
}
