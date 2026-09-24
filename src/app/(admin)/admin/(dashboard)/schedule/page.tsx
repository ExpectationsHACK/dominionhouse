import type { Metadata } from "next";
import { deleteScheduleItem, saveScheduleItem, toggleSchedulePublish } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { Badge, Eyebrow, Panel, PanelHeader } from "@/components/ui";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { dayLabel, timeLabel, toDateInput } from "@/lib/dates";

export const metadata: Metadata = { title: "Schedule", robots: { index: false } };

const TYPES = [
  "SERVICE",
  "SESSION",
  "PRAYER",
  "MEAL",
  "ACTIVITY",
  "BREAKOUT",
  "LOGISTICS",
] as const;

export default async function SchedulePage() {
  await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const items = await db.scheduleItem.findMany({
    where: { campId: camp.id },
    orderBy: [{ startsAt: "asc" }],
  });

  const days = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.day.toISOString();
    const bucket = days.get(key);
    if (bucket) bucket.push(item);
    else days.set(key, [item]);
  }

  // Every date the camp actually runs, so the picker can't stray outside it.
  const campDays: string[] = [];
  for (
    let cursor = new Date(camp.startsAt);
    cursor <= camp.endsAt;
    cursor = new Date(cursor.getTime() + 86_400_000)
  ) {
    const value = toDateInput(cursor);
    if (!campDays.includes(value)) campDays.push(value);
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow>What happens, and when</Eyebrow>
        <h1 className="display mt-2 text-5xl">Programme</h1>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {days.size === 0 ? (
            <Panel className="p-8">
              <p className="text-sm text-ink-45">Nothing on the programme yet.</p>
            </Panel>
          ) : (
            [...days.entries()].map(([day, dayItems]) => (
              <Panel key={day}>
                <div className="border-b border-ink/12 bg-ink px-5 py-3.5">
                  <h2 className="display text-2xl text-white">
                    {dayLabel.format(new Date(day))}
                  </h2>
                </div>
                <ul>
                  {dayItems.map((item) => (
                    <li key={item.id} className="border-b border-ink/10 px-5 py-4 last:border-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold">
                            {timeLabel.format(item.startsAt)}
                            {item.endsAt ? `–${timeLabel.format(item.endsAt)}` : ""}
                          </p>
                          <p className="mt-1 text-sm font-semibold">{item.title}</p>
                          <p className="mt-0.5 text-xs text-ink-45">
                            {[item.speaker, item.location].filter(Boolean).join(" · ") || ", "}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">{item.type.toLowerCase()}</Badge>
                          {!item.isPublished ? <Badge tone="warn">hidden</Badge> : null}
                        </div>
                      </div>

                      <details className="mt-3">
                        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-ink-45">
                          Edit
                        </summary>
                        <div className="mt-4 space-y-4 border-l-2 border-brass pl-4">
                          <ActionForm action={saveScheduleItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <div className="grid gap-3 sm:grid-cols-3">
                              <Field label="Day" htmlFor={`day-${item.id}`}>
                                <Select id={`day-${item.id}`} name="day" defaultValue={toDateInput(item.day)}>
                                  {campDays.map((value) => (
                                    <option key={value} value={value}>
                                      {dayLabel.format(new Date(`${value}T12:00:00Z`))}
                                    </option>
                                  ))}
                                </Select>
                              </Field>
                              <Field label="Start" htmlFor={`start-${item.id}`}>
                                <Input
                                  id={`start-${item.id}`}
                                  name="startTime"
                                  type="time"
                                  defaultValue={timeLabel.format(item.startsAt)}
                                />
                              </Field>
                              <Field label="End" htmlFor={`end-${item.id}`}>
                                <Input
                                  id={`end-${item.id}`}
                                  name="endTime"
                                  type="time"
                                  defaultValue={item.endsAt ? timeLabel.format(item.endsAt) : ""}
                                />
                              </Field>
                            </div>
                            <Field label="Title" htmlFor={`title-${item.id}`}>
                              <Input id={`title-${item.id}`} name="title" defaultValue={item.title} required />
                            </Field>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <Field label="Speaker" htmlFor={`speaker-${item.id}`}>
                                <Input id={`speaker-${item.id}`} name="speaker" defaultValue={item.speaker ?? ""} />
                              </Field>
                              <Field label="Location" htmlFor={`location-${item.id}`}>
                                <Input
                                  id={`location-${item.id}`}
                                  name="location"
                                  defaultValue={item.location ?? ""}
                                />
                              </Field>
                              <Field label="Type" htmlFor={`type-${item.id}`}>
                                <Select id={`type-${item.id}`} name="type" defaultValue={item.type}>
                                  {TYPES.map((type) => (
                                    <option key={type} value={type}>
                                      {type.toLowerCase()}
                                    </option>
                                  ))}
                                </Select>
                              </Field>
                            </div>
                            <Field label="Description" htmlFor={`desc-${item.id}`}>
                              <Textarea
                                id={`desc-${item.id}`}
                                name="description"
                                rows={2}
                                defaultValue={item.description ?? ""}
                              />
                            </Field>
                            <SubmitButton size="sm" pendingLabel="Saving…">
                              Save session
                            </SubmitButton>
                          </ActionForm>

                          <div className="flex flex-wrap gap-2">
                            <ActionForm action={toggleSchedulePublish}>
                              <input type="hidden" name="id" value={item.id} />
                              <SubmitButton size="sm" variant="outline" withArrow={false} pendingLabel="…">
                                {item.isPublished ? "Hide from registrants" : "Publish"}
                              </SubmitButton>
                            </ActionForm>
                            <ActionForm action={deleteScheduleItem} confirm={`Delete "${item.title}"?`}>
                              <input type="hidden" name="id" value={item.id} />
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
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))
          )}
        </div>

        <Panel className="xl:sticky xl:top-6 xl:self-start">
          <PanelHeader title="Add a session" />
          <div className="p-5">
            <ActionForm action={saveScheduleItem}>
              <Field label="Day" htmlFor="new-day" required>
                <Select id="new-day" name="day" required defaultValue={campDays[0]}>
                  {campDays.map((value) => (
                    <option key={value} value={value}>
                      {dayLabel.format(new Date(`${value}T12:00:00Z`))}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Start" htmlFor="new-start" required>
                  <Input id="new-start" name="startTime" type="time" defaultValue="09:00" required />
                </Field>
                <Field label="End" htmlFor="new-end">
                  <Input id="new-end" name="endTime" type="time" defaultValue="11:00" />
                </Field>
              </div>
              <Field label="Title" htmlFor="new-title" required>
                <Input id="new-title" name="title" required placeholder="Teaching II. Carrying weight" />
              </Field>
              <Field label="Speaker" htmlFor="new-speaker">
                <Input id="new-speaker" name="speaker" />
              </Field>
              <Field label="Location" htmlFor="new-location">
                <Input id="new-location" name="location" placeholder="Main Tent" />
              </Field>
              <Field label="Type" htmlFor="new-type">
                <Select id="new-type" name="type" defaultValue="SESSION">
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.toLowerCase()}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Description" htmlFor="new-description">
                <Textarea id="new-description" name="description" rows={2} />
              </Field>
              <SubmitButton className="w-full" pendingLabel="Adding…">
                Add to programme
              </SubmitButton>
            </ActionForm>
          </div>
        </Panel>
      </div>
    </div>
  );
}
