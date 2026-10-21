import { BackToTop } from "@/components/site/back-to-top";
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
      <SiteHeader signedInFirstName={signedInFirstName} />
      {/* Clipped sideways here as well as on the body: phone browsers hand the
          body's clip to the viewport and still widen the page for a panel that
          slides in from the side. Clip keeps sticky headings working. */}
      <main id="main" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
