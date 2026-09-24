"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveCamp } from "@/lib/camp";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { createPortalSession, destroyPortalSession } from "@/lib/session";
import { phonesMatch } from "@/lib/utils";
import { portalLoginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

/**
 * Camp profile sign-in.
 *
 * The email and phone captured at registration are the credentials, so there is
 * nothing extra to set up and nothing to wait for in an inbox. Both must match
 * the same registration.
 */
export async function portalSignIn(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = portalLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const { email, phone } = parsed.data;

  const limited = await checkLoginRateLimit(email, { max: 8, windowMs: 15 * 60 * 1000 });
  if (limited) return { error: limited };

  const camp = await requireActiveCamp();

  const registrant = await db.registrant.findUnique({
    where: { campId_email: { campId: camp.id, email } },
  });

  // One message whether the email is unknown or the phone is wrong, so this
  // can't be used to find out who is registered.
  const noMatch = {
    error: "That email and phone number don't match a registration. Check both, or register first.",
  };

  if (!registrant) return noMatch;
  if (!phonesMatch(registrant.phone, phone)) return noMatch;
  if (registrant.status === "CANCELLED") {
    return { error: "This registration has been cancelled. Please contact the camp desk." };
  }

  await createPortalSession({ registrantId: registrant.id, email: registrant.email });
  redirect("/portal");
}

export async function signOut() {
  await destroyPortalSession();
  redirect("/portal/login");
}
