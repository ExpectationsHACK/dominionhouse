import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession, getPortalSession, type AdminSession } from "@/lib/session";
import type { AdminRole } from "@/generated/prisma/enums";

/** Roles that may touch money. */
export const FINANCE_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "FINANCE"];
/** Roles that may edit registrants and rooms. */
export const OPS_ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "REGISTRATION", "LOGISTICS"];
/** Roles that may scan tickets at the gate. */
export const GATE_ROLES: AdminRole[] = [...OPS_ROLES, "USHER"];

export async function requireAdmin(allowed?: AdminRole[]): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await db.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin || !admin.isActive) redirect("/admin/login");

  if (allowed && !allowed.includes(admin.role)) redirect("/admin?denied=1");

  return { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role };
}

export function can(role: AdminRole, allowed: AdminRole[]) {
  return allowed.includes(role);
}

export async function requireRegistrant() {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");

  const registrant = await db.registrant.findUnique({
    where: { id: session.registrantId },
    include: {
      camp: true,
      priceTier: true,
      payments: { orderBy: { createdAt: "desc" } },
      ticket: true,
      roomAssignment: { include: { room: true } },
    },
  });

  if (!registrant) redirect("/portal/login");
  return registrant;
}
