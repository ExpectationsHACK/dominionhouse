import type { Metadata } from "next";
import { PortalLoginForm } from "./login-form";
import { HillContours } from "@/components/site/hill-contours";
import { Arrow, ButtonLink, Eyebrow, Notice } from "@/components/ui";
import { db } from "@/lib/db";
import { getPortalSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in to your camp profile",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await getPortalSession();
  const { email } = await searchParams;

  // A session on this device doesn't force it, since a shared device may need
  // to sign into someone else's profile. Offer both instead of picking one.
  const signedIn = session
    ? await db.registrant.findUnique({
        where: { id: session.registrantId },
        select: { firstName: true, lastName: true, email: true },
      })
    : null;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16">
      <div className="relative overflow-hidden bg-ink px-7 py-12 text-white sm:px-10 sm:py-16">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative">
          <Eyebrow className="text-brass">Your camp profile</Eyebrow>
          <h1 className="display mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
            Everything about
            <br />
            your camp
          </h1>
          <ul className="mt-10 space-y-4 text-white/70">
            {[
              "Your ticket, with the QR code for the gate",
              "What you've paid and what's left",
              "Your room, your block and who you're sharing with",
              "The full camp programme",
              "Announcements from the camp desk",
            ].map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-brass" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:pt-6">
        {signedIn ? (
          <>
            <Notice tone="success" title="You're already signed in" className="mb-8">
              <p className="mt-1">
                This device is signed in as{" "}
                <span className="font-semibold">
                  {signedIn.firstName} {signedIn.lastName}
                </span>{" "}
                ({signedIn.email}).
              </p>
            </Notice>
            <ButtonLink href="/portal" size="lg">
              Continue to my camp profile <Arrow />
            </ButtonLink>

            <div className="mt-10 border-t border-ink/12 pt-8">
              <Eyebrow>Not {signedIn.firstName}?</Eyebrow>
              <h2 className="display mt-3 text-3xl">Sign in to a different profile</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-45">
                Signing in below replaces this device&apos;s saved profile with the one you enter.
              </p>
              <div className="mt-6">
                <PortalLoginForm prefillEmail="" />
              </div>
            </div>
          </>
        ) : (
          <>
            <Eyebrow>Sign in</Eyebrow>
            <h2 className="display mt-3 text-4xl">No password needed</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-45">
              Sign in with the email and phone number you registered with.
            </p>
            <div className="mt-8">
              <PortalLoginForm prefillEmail={email ?? ""} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
