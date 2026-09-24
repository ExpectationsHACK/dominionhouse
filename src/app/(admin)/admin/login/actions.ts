"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { createAdminSession, destroyAdminSession, getAdminSession } from "@/lib/session";
import { adminLoginSchema } from "@/lib/validation";

export type AdminLoginState = { error?: string };

// Cost-10 hash of an arbitrary string, compared against on every login that
// doesn't resolve to a real, active account. Without this, "no such admin"
// returns in microseconds while a real wrong-password check pays the ~50-100ms
// bcrypt cost, and that latency gap is enough to enumerate valid staff emails.
const DUMMY_HASH = "$2b$10$6DSVgibKB8.YTEV.XS6.HO7neWhO/r2wiwTolsRI0iVCihY/Dx8lC";

export async function adminSignIn(
  _previous: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Enter your email and password." };
  }

  const limited = await checkLoginRateLimit(parsed.data.email, { max: 8, windowMs: 15 * 60 * 1000 });
  if (limited) return { error: limited };

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });

  // One message for every failure mode, no probing for valid staff addresses.
  const genericFailure = { error: "That email and password don't match." };

  const matches = await bcrypt.compare(
    parsed.data.password,
    admin?.isActive ? admin.passwordHash : DUMMY_HASH,
  );
  if (!admin || !admin.isActive || !matches) return genericFailure;

  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  await createAdminSession({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  await audit({
    actor: { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role },
    action: "admin.sign-in",
    entity: "AdminUser",
    entityId: admin.id,
  });

  redirect("/admin");
}

export async function adminSignOut() {
  const session = await getAdminSession();
  if (session) {
    await audit({ actor: session, action: "admin.sign-out", entity: "AdminUser", entityId: session.adminId });
  }
  await destroyAdminSession();
  redirect("/admin/login");
}
