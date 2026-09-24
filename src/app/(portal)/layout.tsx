import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { db } from "@/lib/db";
import { getPortalSession } from "@/lib/session";

export default async function PortalShell({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession();
  const signedInFirstName = session
    ? (
        await db.registrant.findUnique({
          where: { id: session.registrantId },
          select: { firstName: true },
        })
      )?.firstName
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-bone">
      <SiteHeader signedInFirstName={signedInFirstName} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-ink/12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-45">
            Need a hand? dominionhs@gmail.com
          </p>
          <Link href="/camp" className="text-[12px] font-semibold uppercase tracking-[0.1em]">
            Back to the camp page
          </Link>
        </div>
      </footer>
    </div>
  );
}
