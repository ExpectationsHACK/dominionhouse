import type { Metadata } from "next";
import { Arrow, ButtonLink, DataRow, Eyebrow, Notice, Panel } from "@/components/ui";
import { db } from "@/lib/db";
import { failGift, settleGift } from "@/lib/giving";
import { formatMoney } from "@/lib/giving-rules";
import { isMockPayments, verifyTransaction } from "@/lib/paystack";
import { classifyGatewayOutcome } from "@/lib/payment-outcome";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where Paystack sends a giver back. It confirms the payment with Paystack
 * before saying thank you; the webhook confirms it too, so a closed tab loses
 * nothing.
 */
export default async function GiveThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;
  const gift = reference ? await db.gift.findUnique({ where: { reference } }) : null;

  if (!reference || !gift) {
    return (
      <Shell>
        <Notice tone="danger" title="We couldn't find that gift">
          If money left your account, email dominionhs@gmail.com with your Paystack receipt and
          we&apos;ll sort it out.
        </Notice>
      </Shell>
    );
  }

  let problem: string | null = null;
  let processing = false;

  if (gift.status !== "SUCCESS" && !(isMockPayments && gift.status === "FAILED")) {
    try {
      const verified = await verifyTransaction(reference);
      const outcome = classifyGatewayOutcome({
        status: verified.status,
        gatewayResponse: verified.gatewayResponse,
      });
      if (outcome.kind === "success") {
        await settleGift({
          reference,
          paidAt: verified.paidAt,
          channel: verified.channel,
          amountMinor: verified.amountKobo,
          raw: verified.raw,
        });
      } else if (outcome.kind === "recorded") {
        await failGift(reference, outcome.note, verified.raw);
        problem = outcome.note;
      } else {
        processing = true;
      }
    } catch (error) {
      problem =
        error instanceof Error ? error.message : "We couldn't confirm this payment just yet.";
    }
  } else if (gift.status === "FAILED") {
    problem = gift.note ?? "The payment wasn't completed.";
  }

  const fresh = await db.gift.findUniqueOrThrow({ where: { reference } });
  const monthly = fresh.kind === "MONTHLY";

  if (fresh.status === "SUCCESS") {
    return (
      <Shell>
        <Eyebrow className="text-success">{monthly ? "Covenant begun" : "Seed received"}</Eyebrow>
        <h1 className="display mt-3 text-[clamp(2.5rem,8vw,6rem)]">
          {monthly ? "Welcome, Angel Partner" : "Thank you"}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-70">
          {monthly
            ? `Your ${formatMoney(fresh.amountMinor, fresh.currency)} monthly partnership for Legacy Place is active. It renews each month on this date, with a receipt to ${fresh.email} every time.`
            : `Your ${formatMoney(fresh.amountMinor, fresh.currency)} seed for Legacy Place is received. A receipt is on its way to ${fresh.email}.`}
        </p>
        <Panel className="mt-10 p-6">
          <DataRow label="Amount" value={formatMoney(fresh.amountMinor, fresh.currency)} />
          <DataRow label="Type" value={monthly ? "Monthly partnership" : "One-time seed"} />
          <DataRow label="Reference" value={<span className="font-mono">{fresh.reference}</span>} />
        </Panel>
        <div className="mt-8">
          <ButtonLink href="/give" size="lg">
            Back to Legacy Place <Arrow />
          </ButtonLink>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Eyebrow className={processing ? undefined : "text-danger"}>
        {processing ? "Still processing" : "Not completed"}
      </Eyebrow>
      <h1 className="display mt-3 text-[clamp(2.5rem,8vw,6rem)]">
        {processing ? "Almost there" : "That didn’t go through"}
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-70">
        {processing
          ? "Your bank is still confirming this payment. If it succeeds, we'll email your receipt; there's no need to pay again."
          : `${problem ?? "The payment wasn't completed."} Nothing was taken. You can try again whenever you're ready.`}
      </p>
      <div className="mt-8">
        <ButtonLink href="/give#partner" size="lg">
          {processing ? "Back to Legacy Place" : "Try again"} <Arrow />
        </ButtonLink>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">{children}</div>;
}
