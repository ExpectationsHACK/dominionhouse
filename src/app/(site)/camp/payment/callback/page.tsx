import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, ArrowLeft, ButtonLink, DataRow, Eyebrow, Notice, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { formatKobo } from "@/lib/money";
import { verifyTransaction } from "@/lib/paystack";
import { settlePayment } from "@/lib/registration";

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

  if (payment.status !== "SUCCESS") {
    try {
      const verified = await verifyTransaction(reference);

      if (verified.status === "success") {
        await settlePayment({
          reference,
          paidAt: verified.paidAt,
          channel: verified.channel,
          gatewayRaw: verified.raw,
          verifiedAmountKobo: verified.amountKobo,
        });
      } else {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", gatewayRaw: verified.raw as never },
        });
        failure = "The payment didn't go through.";
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
          <Eyebrow className="text-danger">Payment not completed</Eyebrow>
          <h1 className="display mt-3 text-[clamp(2.5rem,8vw,6rem)]">That didn&apos;t go through</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-70">
            {failure ?? "The payment wasn't completed."} Nothing has been charged, and your place is
            still held. You can try again whenever you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <ButtonLink
              href={`/camp/payment?email=${encodeURIComponent(registrant.email)}`}
              size="lg"
            >
              Try again <Arrow />
            </ButtonLink>
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
      <Link
        href="/camp"
        className="mb-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-45 transition-colors hover:text-ink"
      >
        <ArrowLeft /> Back to camp
      </Link>
      {children}
    </div>
  );
}
