import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegisterForm } from "./register-form";
import Link from "next/link";
import { ArrowLeft, Eyebrow, Notice } from "@/components/ui";
import { registrationIsOpen, requireActiveCamp } from "@/lib/camp";
import { campDateRange } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Register for Fresh Fire Camp Meeting 2027",
  description:
    "Register for Fresh Fire Camp Meeting 2027. Four short steps, then pay in full or in instalments.",
};

/**
 * Revalidated on a short cycle so live counts, prices and dates stay honest.
 * Admin edits also call revalidatePath, so a change shows up immediately.
 */
export const revalidate = 60;

export default async function RegisterPage() {
  const camp = await requireActiveCamp();
  if (!camp) notFound();

  const open = registrationIsOpen(camp);

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
      <Link
        href="/camp"
        className="mb-8 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-45 transition-colors hover:text-ink"
      >
        <ArrowLeft /> Back to camp
      </Link>

      <header className="max-w-3xl">
        <Eyebrow>{campDateRange(camp.startsAt, camp.endsAt)} · {camp.venue}</Eyebrow>
        <h1 className="display mt-4 text-[clamp(2.75rem,9vw,7rem)]">Register</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-70">
          Four short steps. Your camp profile opens the moment you finish, and your ticket is
          issued automatically once your balance clears.
        </p>
      </header>

      <div className="mt-12">
        {open ? (
          <RegisterForm
            tiers={camp.priceTiers.map((tier) => ({
              id: tier.id,
              category: tier.category,
              label: tier.label,
              description: tier.description,
              amountKobo: tier.amountKobo,
            }))}
            installmentsEnabled={camp.installmentsEnabled}
            minFirstInstallmentKobo={camp.minFirstInstallmentKobo}
          />
        ) : (
          <Notice tone="warn" title="Registration is closed">
            Registration for {camp.name} isn&apos;t open right now. Write to
            dominionhs@gmail.com and the camp desk will tell you what&apos;s possible.
          </Notice>
        )}
      </div>
    </div>
  );
}
