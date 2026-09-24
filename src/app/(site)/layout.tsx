import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { db } from "@/lib/db";
import { getPortalSession } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedInFirstName={signedInFirstName} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
