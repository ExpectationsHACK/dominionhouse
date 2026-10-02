import { ScrollProgress } from "@/components/site/scroll-progress";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { db } from "@/lib/db";
import { getPortalSession } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getPortalSession();
  // Sign-ins carry the first name; only a sign-in from before that needs the
  // database, and it picks the name up at its next sign-in.
  const signedInFirstName = session
    ? (session.firstName ??
      (
        await db.registrant.findUnique({
          where: { id: session.registrantId },
          select: { firstName: true },
        })
      )?.firstName)
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <SiteHeader signedInFirstName={signedInFirstName} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
