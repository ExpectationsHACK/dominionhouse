import type { Metadata } from "next";
import { createAnnouncement, deleteAnnouncement, togglePin } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { Badge, Eyebrow, Panel, PanelHeader } from "@/components/ui";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { dateTimeLabel } from "@/lib/dates";

export const metadata: Metadata = { title: "Announcements", robots: { index: false } };

export default async function AnnouncementsPage() {
  await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const [announcements, reach] = await Promise.all([
    db.announcement.findMany({
      where: { campId: camp.id },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    }),
    db.registrant.count({ where: { campId: camp.id, status: { not: "CANCELLED" } } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>Reaches {reach} camp profiles</Eyebrow>
        <h1 className="display mt-2 text-5xl">Announcements</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Panel>
          <PanelHeader title="Published" description="Newest first, pinned at the top." />
          {announcements.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink-45">Nothing published yet.</p>
          ) : (
            <ul>
              {announcements.map((announcement) => (
                <li key={announcement.id} className="border-b border-ink/10 px-5 py-4 last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">{announcement.title}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                        {announcement.publishedAt
                          ? dateTimeLabel.format(announcement.publishedAt)
                          : "draft"}
                        {announcement.emailedAt ? " · emailed" : " · portal only"}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {announcement.isPinned ? <Badge tone="brass">pinned</Badge> : null}
                      {announcement.emailedAt ? <Badge tone="brand">emailed</Badge> : null}
                    </div>
                  </div>

                  <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-ink-70">
                    {announcement.body}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionForm action={togglePin}>
                      <input type="hidden" name="id" value={announcement.id} />
                      <SubmitButton size="sm" variant="ghost" withArrow={false} pendingLabel="…">
                        {announcement.isPinned ? "Unpin" : "Pin to top"}
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={deleteAnnouncement} confirm={`Delete "${announcement.title}"?`}>
                      <input type="hidden" name="id" value={announcement.id} />
                      <SubmitButton
                        size="sm"
                        variant="ghost"
                        withArrow={false}
                        pendingLabel="…"
                        className="text-danger"
                      >
                        Delete
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="xl:sticky xl:top-6 xl:self-start">
          <PanelHeader title="Write an announcement" />
          <div className="p-5">
            <ActionForm action={createAnnouncement}>
              <Field label="Title" htmlFor="title" required>
                <Input id="title" name="title" required placeholder="Shuttle times have changed" />
              </Field>
              <Field
                label="Message"
                htmlFor="body"
                required
                hint="Blank lines become paragraphs in the email."
              >
                <Textarea id="body" name="body" rows={7} required />
              </Field>
              <Checkbox
                name="isPinned"
                label="Pin to the top of every camp profile"
                description="Use for anything people need to see first."
              />
              <Checkbox
                name="emailEveryone"
                label={`Email all ${reach} registrants`}
                description="Sends immediately. Leave off to publish to the portal only."
              />
              <SubmitButton
                className="w-full"
                pendingLabel="Publishing…"
              >
                Publish
              </SubmitButton>
            </ActionForm>
          </div>
        </Panel>
      </div>
    </div>
  );
}
