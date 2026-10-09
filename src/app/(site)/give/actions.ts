"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { appUrl } from "@/lib/camp";
import { db } from "@/lib/db";
import { newGiftReference, planFor } from "@/lib/giving";
import { amountProblem, isGivingCurrency, toMinor } from "@/lib/giving-rules";
import { initialiseTransaction } from "@/lib/paystack";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";

export type GiveState = { error?: string; errors?: Record<string, string> };

const giveSchema = z.object({
  kind: z.enum(["MONTHLY", "ONE_TIME"]),
  currency: z.string().refine(isGivingCurrency, "Choose a currency"),
  amount: z.coerce.number({ message: "Enter an amount" }),
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(160),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  country: z.string().trim().max(60).optional().or(z.literal("")),
  wallOptIn: z.literal("on").optional(),
});

/**
 * Starts a gift: a monthly Angel Partnership (a Paystack subscription to the
 * plan for that amount) or a one-time seed, then hands over to Paystack's
 * checkout. Nothing is confirmed here; the callback and webhook do that.
 */
export async function startGiving(_previous: GiveState, formData: FormData): Promise<GiveState> {
  const parsed = giveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { error: "A few details need another look.", errors };
  }
  const input = parsed.data;
  const currency = input.currency as "NGN" | "USD";
  const problem = amountProblem(input.amount, currency, input.kind);
  if (problem) return { error: problem, errors: { amount: problem } };

  const email = normalizeEmail(input.email);
  const limited = await checkLoginRateLimit(`give:${email}`, { max: 6, windowMs: 15 * 60 * 1000 });
  if (limited) return { error: limited };

  const amountMinor = toMinor(input.amount);
  const reference = newGiftReference();

  let authorizationUrl: string;
  try {
    let partnerId: string | null = null;
    let planCode: string | undefined;

    if (input.kind === "MONTHLY") {
      planCode = await planFor(currency, amountMinor);
      const partner = await db.partner.create({
        data: {
          name: input.name,
          email,
          phone: input.phone,
          country: input.country || null,
          currency,
          amountMinor,
          wallOptIn: input.wallOptIn === "on",
          paystackPlanCode: planCode,
        },
      });
      partnerId = partner.id;
    }

    await db.gift.create({
      data: {
        partnerId,
        reference,
        kind: input.kind,
        currency,
        amountMinor,
        name: input.name,
        email,
        phone: input.phone,
      },
    });

    ({ authorizationUrl } = await initialiseTransaction({
      email,
      amountKobo: amountMinor,
      currency,
      planCode,
      reference,
      callbackUrl: appUrl("/give/thank-you"),
      simulatePath: "/give/simulate",
      metadata: { kind: "gift", giftKind: input.kind, name: input.name },
    }));
  } catch (error) {
    await db.gift
      .updateMany({
        where: { reference, status: "PENDING" },
        data: {
          status: "FAILED",
          note: `Could not start checkout: ${error instanceof Error ? error.message : "unknown error"}`,
        },
      })
      .catch(() => {});
    const message = error instanceof Error ? error.message : "";
    return {
      error: /currency/i.test(message)
        ? "We can't take that currency online just yet. Please give in naira, or talk to the partnership team."
        : "We couldn't reach the payment provider. Nothing was charged, please try again.",
    };
  }

  redirect(authorizationUrl);
}
