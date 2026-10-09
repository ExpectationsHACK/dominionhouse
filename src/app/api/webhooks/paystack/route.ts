import { NextResponse } from "next/server";
import { failGift, onSubscriptionCreated, onSubscriptionEnded, recordRenewal, settleGift } from "@/lib/giving";
import { isGiftReference } from "@/lib/giving-rules";
import { classifyGatewayOutcome } from "@/lib/payment-outcome";
import { getTotals, recordUnsuccessfulPayment, settlePayment, statusFor } from "@/lib/registration";
import { verifyWebhookSignature } from "@/lib/paystack";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Paystack webhook.
 *
 * The browser callback is best-effort, people close the tab. This is the
 * reliable path, and it is the reason a ticket still gets issued when nobody is
 * watching. Everything here converges on settlePayment(), which is idempotent,
 * so a retried delivery is harmless.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const data = event.data ?? {};
  const reference = typeof data.reference === "string" ? data.reference : null;

  // Angel Partner subscriptions carry no reference of ours.
  try {
    switch (event.event) {
      case "subscription.create":
        await onSubscriptionCreated(data);
        return NextResponse.json({ received: true });
      case "subscription.disable":
      case "subscription.not_renew":
        await onSubscriptionEnded(data);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("[paystack:webhook]", event.event, error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  if (!reference) {
    // Nothing to reconcile, acknowledge so Paystack stops retrying.
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.event) {
      case "charge.success": {
        if (isGiftReference(reference)) {
          await settleGift({
            reference,
            paidAt: typeof data.paid_at === "string" ? new Date(data.paid_at) : new Date(),
            channel: typeof data.channel === "string" ? data.channel : null,
            amountMinor: typeof data.amount === "number" ? data.amount : undefined,
            raw: data,
          });
          break;
        }
        const camp = await settlePayment({
          reference,
          paidAt: typeof data.paid_at === "string" ? new Date(data.paid_at) : new Date(),
          channel: typeof data.channel === "string" ? data.channel : null,
          gatewayRaw: data,
          verifiedAmountKobo: typeof data.amount === "number" ? data.amount : undefined,
        });
        // Not a camp payment either: a partnership renewal, which Paystack
        // charges under its own reference.
        if (!camp.ok && camp.reason === "unknown-reference") await recordRenewal(data);
        break;
      }

      case "charge.failed": {
        if (isGiftReference(reference)) {
          await failGift(
            reference,
            typeof data.gateway_response === "string" ? data.gateway_response : "Payment failed.",
            data,
          );
          break;
        }
        const outcome = classifyGatewayOutcome({
          status: "failed",
          gatewayResponse: typeof data.gateway_response === "string" ? data.gateway_response : null,
        });
        if (outcome.kind === "recorded") {
          await recordUnsuccessfulPayment({
            reference,
            status: outcome.status,
            note: outcome.note,
            gatewayRaw: data,
          });
        }
        break;
      }

      case "refund.processed":
      case "charge.reversed": {
        const changed = await recordUnsuccessfulPayment({
          reference,
          status: "REVERSED",
          note: "Payment was reversed by the provider.",
          gatewayRaw: data,
        });
        if (changed) {
          // Money left the account, so the balance and status must follow.
          const payment = await db.payment.findUnique({
            where: { reference },
            include: { registrant: true },
          });
          if (payment) {
            const totals = await getTotals(payment.registrantId);
            await db.registrant.update({
              where: { id: payment.registrantId },
              data: { status: statusFor(totals, payment.registrant.status) },
            });
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("[paystack:webhook]", event.event, reference, error);
    // 500 tells Paystack to retry, which is what we want for a transient fault.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
