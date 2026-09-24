import "server-only";
import { db } from "@/lib/db";
import type { AdminSession } from "@/lib/session";

/** Every state change a human made gets a line here. */
export async function audit(args: {
  actor: AdminSession | { adminId?: null; name: string };
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      actorId: "adminId" in args.actor ? (args.actor.adminId ?? null) : null,
      actorLabel: args.actor.name,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId ?? null,
      meta: (args.meta as never) ?? undefined,
    },
  });
}
