import Link from "next/link";
import { PortalNav } from "@/components/camp/portal-nav";
import { signOut } from "../login/actions";
import { requireRegistrant } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { totalsFor } from "@/lib/registration";
import { formatKobo } from "@/lib/money";

export default async function SignedInPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const registrant = await requireRegistrant();
  const totals = totalsFor(registrant);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/12 pb-6">
        <div>
          <p className="eyebrow text-ink-45">{registrant.registrationCode}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">
            {registrant.firstName} {registrant.lastName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={totals.isSettled ? "success" : totals.paidKobo > 0 ? "brass" : "warn"}>
              {totals.isSettled
                ? "Paid in full"
                : `${formatKobo(totals.balanceKobo)} outstanding`}
            </Badge>
            {registrant.ticket ? (
              <Badge tone="brand">Ticket {registrant.ticket.code}</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/portal/login"
            className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-45 underline underline-offset-4 transition-colors hover:text-ink"
          >
            Switch profile
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-45 underline underline-offset-4 transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <PortalNav />

      <div className="mt-8">{children}</div>
    </div>
  );
}
