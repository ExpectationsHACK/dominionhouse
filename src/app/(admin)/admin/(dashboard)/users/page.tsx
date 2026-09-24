import type { Metadata } from "next";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { ActionForm } from "@/components/admin/action-form";
import { TableEmpty, TableWrap, Td, Th, Tr } from "@/components/admin/table";
import { Badge, Eyebrow, Panel, PanelHeader } from "@/components/ui";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { dateTimeLabel } from "@/lib/dates";
import { adminUserSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Staff", robots: { index: false } };

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super admin, everything, including staff" },
  { value: "ADMIN", label: "Admin, everything except staff accounts" },
  { value: "FINANCE", label: "Finance, payments, refunds and bursaries" },
  { value: "REGISTRATION", label: "Registration, registrants, rooms, tickets" },
  { value: "LOGISTICS", label: "Logistics, rooms, schedule, check-in" },
  { value: "USHER", label: "Usher, check-in only" },
] as const;

async function createStaff(_previous: { ok?: string; error?: string }, formData: FormData) {
  "use server";
  const admin = await requireAdmin(["SUPER_ADMIN"]);

  const parsed = adminUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const existing = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: `${parsed.data.email} already has an account.` };

  await db.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  await audit({
    actor: admin,
    action: "staff.created",
    entity: "AdminUser",
    meta: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  return { ok: `${parsed.data.name} can now sign in.` };
}

async function updateStaff(_previous: { ok?: string; error?: string }, formData: FormData) {
  "use server";
  const admin = await requireAdmin(["SUPER_ADMIN"]);

  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  const isActive = formData.get("isActive") === "on";
  const password = String(formData.get("password") ?? "");

  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) return { error: "Account not found." };

  if (target.id === admin.adminId && !isActive) {
    return { error: "You can't deactivate your own account." };
  }
  if (password && password.length < 8) {
    return { error: "A new password needs at least 8 characters." };
  }

  await db.adminUser.update({
    where: { id },
    data: {
      role: role as never,
      isActive,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await audit({
    actor: admin,
    action: "staff.updated",
    entity: "AdminUser",
    entityId: id,
    meta: { role, isActive, passwordChanged: Boolean(password) },
  });

  revalidatePath("/admin/users");
  return { ok: password ? "Updated, and the password was reset." : "Updated." };
}

export default async function StaffPage() {
  const admin = await requireAdmin(["SUPER_ADMIN"]);

  const [staff, recentAudit] = await Promise.all([
    db.adminUser.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Who can get into the camp desk</Eyebrow>
        <h1 className="display mt-2 text-5xl">Staff</h1>
      </header>

      <TableWrap>
        <thead>
          <tr>
            <Th>Person</Th>
            <Th>Role</Th>
            <Th>Last signed in</Th>
            <Th>Manage</Th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 ? (
            <TableEmpty colSpan={4} message="No staff accounts." />
          ) : (
            staff.map((person) => (
              <Tr key={person.id}>
                <Td className="align-top">
                  <p className="font-semibold">
                    {person.name}
                    {person.id === admin.adminId ? (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-brass">
                        you
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-45">{person.email}</p>
                </Td>
                <Td className="align-top">
                  <Badge tone={person.isActive ? "brand" : "neutral"}>
                    {person.role.replace("_", " ").toLowerCase()}
                  </Badge>
                  {!person.isActive ? (
                    <p className="mt-1 text-xs text-danger">Deactivated</p>
                  ) : null}
                </Td>
                <Td className="align-top">
                  <span className="font-mono text-xs text-ink-45">
                    {person.lastLoginAt ? dateTimeLabel.format(person.lastLoginAt) : "never"}
                  </span>
                </Td>
                <Td className="align-top">
                  <ActionForm action={updateStaff} className="min-w-[240px]">
                    <input type="hidden" name="id" value={person.id} />
                    <Select name="role" defaultValue={person.role} className="py-2 text-sm">
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      name="password"
                      type="password"
                      placeholder="New password (optional)"
                      className="py-2 text-sm"
                      autoComplete="new-password"
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={person.isActive}
                        className="h-4 w-4 accent-[#0b0b0c]"
                      />
                      Active
                    </label>
                    <SubmitButton size="sm" withArrow={false} pendingLabel="…">
                      Save
                    </SubmitButton>
                  </ActionForm>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Panel>
          <PanelHeader title="Add a staff account" />
          <div className="p-5">
            <ActionForm action={createStaff}>
              <Field label="Name" htmlFor="new-name" required>
                <Input id="new-name" name="name" required />
              </Field>
              <Field label="Email" htmlFor="new-email" required>
                <Input id="new-email" name="email" type="email" required autoComplete="off" />
              </Field>
              <Field label="Password" htmlFor="new-password" required hint="At least 8 characters.">
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Role" htmlFor="new-role" required>
                <Select id="new-role" name="role" defaultValue="REGISTRATION">
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <SubmitButton className="w-full" pendingLabel="Creating…">
                Create account
              </SubmitButton>
            </ActionForm>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Activity log" description="The last 25 things staff did." />
          <ul>
            {recentAudit.length === 0 ? (
              <li className="px-5 py-8 text-sm text-ink-45">Nothing logged yet.</li>
            ) : (
              recentAudit.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/10 px-5 py-2.5 last:border-0"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-ink">{entry.action}</span>
                    <span className="ml-2 text-xs text-ink-45">{entry.actorLabel}</span>
                  </div>
                  <span className="font-mono text-[11px] text-ink-45">
                    {dateTimeLabel.format(entry.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
