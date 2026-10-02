"use client";

import Link from "next/link";
import { ErrorScreen } from "@/components/error-screen";

/**
 * Money is involved, so the first thing to say is where it stands: a payment
 * that went through is confirmed by Paystack's webhook whether or not this
 * page loads, so nobody should pay twice.
 */
export default function PaymentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      className="min-h-[70svh]"
      eyebrow="Payment page"
      title="We hit a snag"
      message={
        <>
          <p>
            This page didn&apos;t load properly. If you&apos;d already paid, your money is safe:
            Paystack confirms every payment with us directly, and your balance and ticket update
            on their own within a few minutes. Please don&apos;t pay again.
          </p>
          <p className="mt-4 text-base">
            Check{" "}
            <Link href="/portal/payments" className="font-semibold underline underline-offset-4">
              your payment history
            </Link>{" "}
            in a few minutes, or email dominionhs@gmail.com with the reference below.
          </p>
        </>
      }
    />
  );
}
