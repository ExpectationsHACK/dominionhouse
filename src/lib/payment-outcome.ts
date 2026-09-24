import type { PaymentStatus } from "@/generated/prisma/enums";

/**
 * How a payment attempt ends, from what the gateway tells us.
 *
 * Every attempt is kept on the registrant's payment history, whatever the
 * result, so people (and the finance desk) can see what was tried and why it
 * didn't land. Only a SUCCESS counts toward the balance.
 */
export type GatewayOutcome =
  | { kind: "success" }
  /** Still in flight at the bank. Leave the row PENDING, don't call it failed. */
  | { kind: "processing"; note: string }
  | { kind: "recorded"; status: Extract<PaymentStatus, "FAILED" | "DECLINED" | "ABANDONED" | "REVERSED">; note: string };

export function classifyGatewayOutcome(args: {
  /** Paystack's transaction status: success, failed, abandoned, ongoing, … */
  status: string;
  /** Paystack's human reason, e.g. "Declined", "Insufficient Funds". */
  gatewayResponse?: string | null;
}): GatewayOutcome {
  const reason = args.gatewayResponse?.trim() || null;

  switch (args.status.toLowerCase()) {
    case "success":
      return { kind: "success" };

    case "abandoned":
      return {
        kind: "recorded",
        status: "ABANDONED",
        note: "Checkout was left before the payment was completed.",
      };

    case "reversed":
      return { kind: "recorded", status: "REVERSED", note: reason ?? "Payment was reversed." };

    case "failed": {
      // A bank or card refusal is a decline; anything else is a plain failure.
      if (reason && /declin|do not honou?r|insufficient|not permitted|restricted|blocked/i.test(reason)) {
        return { kind: "recorded", status: "DECLINED", note: `Declined: ${reason}` };
      }
      return {
        kind: "recorded",
        status: "FAILED",
        note: reason ? `Failed: ${reason}` : "The payment did not go through.",
      };
    }

    // ongoing, pending, queued, processing, and anything we don't recognise:
    // treating an unknown state as a failure could mark a real payment failed.
    default:
      return { kind: "processing", note: "The bank is still processing this payment." };
  }
}

/** Label and colour for a payment status, shared by the portal and admin. */
export const PAYMENT_STATUS: Record<
  PaymentStatus,
  { label: string; tone: "success" | "danger" | "warn" | "neutral" }
> = {
  SUCCESS: { label: "Successful", tone: "success" },
  PENDING: { label: "Pending", tone: "warn" },
  FAILED: { label: "Failed", tone: "danger" },
  DECLINED: { label: "Declined", tone: "danger" },
  ABANDONED: { label: "Not completed", tone: "danger" },
  REVERSED: { label: "Reversed", tone: "danger" },
};

/** Statuses a later, verified success is still allowed to settle. */
export const SETTLEABLE_STATUSES: PaymentStatus[] = ["PENDING", "FAILED", "DECLINED", "ABANDONED"];
