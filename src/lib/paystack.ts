import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Paystack driver.
 *
 * With no PAYSTACK_SECRET_KEY set the module runs in MOCK mode: initialise
 * returns a local URL that simulates the hosted checkout, and verification
 * always succeeds. That keeps the whole registration → payment → ticket flow
 * exercisable end to end before live keys exist.
 */

const SECRET = process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
const BASE = "https://api.paystack.co";

export const paystackMode: "live" | "mock" = SECRET ? "live" : "mock";
export const isMockPayments = paystackMode === "mock";

/**
 * Mock mode makes the webhook accept any payload as a valid payment, which is
 * fine for a local walkthrough and dangerous for a live deployment that simply
 * forgot to set the key. Checked lazily, the first time mock behaviour would
 * actually run, rather than at module load — `next build` sets
 * NODE_ENV=production for the compile step itself, so throwing at import time
 * would fail every build, not just a misconfigured live deployment.
 */
function assertNotMockInProduction() {
  if (isMockPayments && process.env.NODE_ENV === "production") {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. Refusing to run in production, the webhook would accept unsigned payment confirmations.",
    );
  }
}

export type InitialiseArgs = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export type VerifiedTransaction = {
  status: "success" | "failed" | "abandoned" | "pending";
  amountKobo: number;
  reference: string;
  channel: string | null;
  paidAt: Date | null;
  raw: unknown;
};

export async function initialiseTransaction(args: InitialiseArgs): Promise<{ authorizationUrl: string }> {
  if (isMockPayments) {
    assertNotMockInProduction();
    const url = new URL(args.callbackUrl);
    url.searchParams.set("reference", args.reference);
    url.searchParams.set("mock", "1");
    return { authorizationUrl: `/camp/payment/simulate?reference=${encodeURIComponent(args.reference)}` };
  }

  const response = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountKobo,
      reference: args.reference,
      callback_url: args.callbackUrl,
      currency: "NGN",
      metadata: args.metadata ?? {},
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { authorization_url: string };
  };

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack could not start this transaction.");
  }

  return { authorizationUrl: payload.data.authorization_url };
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  if (isMockPayments) {
    assertNotMockInProduction();
    return {
      status: "success",
      amountKobo: -1, // caller falls back to the expected amount on the Payment row
      reference,
      channel: "mock",
      paidAt: new Date(),
      raw: { mock: true, reference },
    };
  }

  const response = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    status: boolean;
    message: string;
    data?: {
      status: string;
      amount: number;
      reference: string;
      channel?: string;
      paid_at?: string;
    };
  };

  if (!response.ok || !payload.status || !payload.data) {
    throw new Error(payload.message || "Paystack could not verify this transaction.");
  }

  const data = payload.data;
  return {
    status: data.status as VerifiedTransaction["status"],
    amountKobo: data.amount,
    reference: data.reference,
    channel: data.channel ?? null,
    paidAt: data.paid_at ? new Date(data.paid_at) : null,
    raw: data,
  };
}

/** Paystack signs webhook bodies with HMAC-SHA512 of the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (isMockPayments) {
    assertNotMockInProduction();
    return true;
  }
  if (!signature) return false;

  const expected = createHmac("sha512", SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
