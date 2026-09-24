import type { Metadata } from "next";
import Link from "next/link";
import { createRoom, createRoomBlock, deleteRoom, moveOccupant, updateRoom } from "./actions";
import { ActionForm } from "@/components/admin/action-form";
import { Badge, Eyebrow, Meter, Panel, PanelHeader, Stat } from "@/components/ui";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { OPS_ROLES, requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { db } from "@/lib/db";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/positions";
import { occupancySummary } from "@/lib/rooms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rooms", robots: { index: false } };

const GENDER_TONE = { MALE: "brand", FEMALE: "brass", MIXED: "neutral" } as const;

export default async function RoomsPage() {
  await requireAdmin(OPS_ROLES);
  const camp = await requireActiveCamp();

  const [rooms, occupancy, waiting, personalRequests] = await Promise.all([
    db.room.findMany({
      where: { campId: camp.id },
      include: {
        assignments: {
          include: { registrant: true },
          orderBy: { bedLabel: "asc" },
        },
      },
      orderBy: [{ block: "asc" }, { name: "asc" }],
    }),
    occupancySummary(camp.id),
    db.registrant.findMany({
      where: {
        campId: camp.id,
        roomAssignment: { is: null },
        status: { not: "CANCELLED" },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 60,
    }),
    db.registrant.count({
      where: { campId: camp.id, wantsPersonalAccommodation: true, status: { not: "CANCELLED" } },
    }),
  ]);

  const blocks = new Map<string, typeof rooms>();
  for (const room of rooms) {
    const bucket = blocks.get(room.block);
    if (bucket) bucket.push(room);
    else blocks.set(room.block, [room]);
  }

  const readyToPlace = waiting.filter((person) => person.status === "PAID").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Accommodation</Eyebrow>
          <h1 className="display mt-2 text-5xl">Rooms</h1>
        </div>
      </header>

      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Beds" value={occupancy.beds} hint={`${rooms.length} rooms`} tone="brand" />
        <Stat
          label="Filled"
          value={occupancy.filled}
          hint={`${Math.round((occupancy.filled / Math.max(1, occupancy.beds)) * 100)}% of capacity`}
        />
        <Stat label="Free beds" value={occupancy.free} />
        <Stat
          label="Waiting"
          value={waiting.length}
          hint={`${readyToPlace} paid up · ${personalRequests} asked for a personal room`}
        />
      </div>

      {/* ── the board ───────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {[...blocks.entries()].map(([block, blockRooms]) => {
          const blockBeds = blockRooms.reduce((sum, room) => sum + room.capacity, 0);
          const blockFilled = blockRooms.reduce((sum, room) => sum + room.assignments.length, 0);

          return (
            <Panel key={block}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/12 bg-ink px-5 py-4 text-white">
                <div>
                  <h2 className="display text-2xl">{block}</h2>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                    {blockRooms.length} rooms · {blockFilled}/{blockBeds} beds
                  </p>
                </div>
                <div className="w-32">
                  <Meter percent={(blockFilled / Math.max(1, blockBeds)) * 100} tone="brass" />
                </div>
              </div>

              <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-3">
                {blockRooms.map((room) => {
                  const full = room.assignments.length >= room.capacity;
                  return (
                    <div
                      key={room.id}
                      className={cn("bg-paper p-4", !room.isActive && "opacity-55")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{room.name}</p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-45">
                            {room.type.toLowerCase()}
                            {room.floor ? ` · ${room.floor}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge tone={GENDER_TONE[room.gender]}>{room.gender.toLowerCase()}</Badge>
                          <span
                            className={cn(
                              "font-mono text-[11px] font-semibold",
                              full ? "text-danger" : "text-ink-45",
                            )}
                          >
                            {room.assignments.length}/{room.capacity}
                          </span>
                        </div>
                      </div>

                      {room.minPosition ? (
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-brass">
                          {POSITION_LABEL[room.minPosition]} and above
                        </p>
                      ) : null}

                      <ul className="mt-3 space-y-1.5">
                        {room.assignments.length === 0 ? (
                          <li className="text-xs text-ink-45">Empty</li>
                        ) : (
                          room.assignments.map((assignment) => (
                            <li key={assignment.id} className="flex items-baseline gap-2 text-xs">
                              <span className="font-mono text-ink-45">
                                {assignment.bedLabel ?? "–"}
                              </span>
                              <Link
                                href={`/admin/registrants/${assignment.registrantId}`}
                                className="min-w-0 flex-1 truncate hover:underline"
                              >
                                {assignment.registrant.firstName} {assignment.registrant.lastName}
                              </Link>
                              {assignment.registrant.department ? (
                                <span className="shrink-0 text-ink-45">
                                  {assignment.registrant.department}
                                </span>
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>

                      <details className="mt-3 border-t border-ink/10 pt-2">
                        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-ink-45">
                          Edit room
                        </summary>
                        <div className="mt-3 space-y-3">
                          <ActionForm action={updateRoom}>
                            <input type="hidden" name="roomId" value={room.id} />
                            <Field label="Beds" htmlFor={`cap-${room.id}`}>
                              <Input
                                id={`cap-${room.id}`}
                                name="capacity"
                                type="number"
                                min={room.assignments.length || 1}
                                defaultValue={room.capacity}
                              />
                            </Field>
                            <Field label="Notes" htmlFor={`notes-${room.id}`}>
                              <Input id={`notes-${room.id}`} name="notes" defaultValue={room.notes ?? ""} />
                            </Field>
                            <Checkbox name="isActive" label="In use" defaultChecked={room.isActive} />
                            <SubmitButton size="sm" withArrow={false} pendingLabel="Saving…">
                              Save
                            </SubmitButton>
                          </ActionForm>

                          {room.assignments.length === 0 ? (
                            <ActionForm action={deleteRoom} confirm={`Delete ${room.block} ${room.name}?`}>
                              <input type="hidden" name="roomId" value={room.id} />
                              <SubmitButton
                                size="sm"
                                variant="ghost"
                                withArrow={false}
                                pendingLabel="…"
                                className="text-danger"
                              >
                                Delete room
                              </SubmitButton>
                            </ActionForm>
                          ) : null}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* ── waiting list ────────────────────────────────────────────────── */}
      <Panel>
        <PanelHeader
          title="Waiting for a bed"
          description={`${waiting.length} people. Auto-allocation only places those who are paid in full.`}
        />
        {waiting.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-45">Everyone who needs a bed has one.</p>
        ) : (
          <ul>
            {waiting.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/registrants/${person.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {person.firstName} {person.lastName}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-45">
                    {person.gender === "MALE" ? "Male" : "Female"} ·{" "}
                    {POSITION_LABEL[person.position]}
                    {person.department ? ` · ${person.department}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge tone={person.status === "PAID" ? "success" : "warn"}>
                    {person.status === "PAID" ? "ready" : "owes"}
                  </Badge>
                  <ActionForm action={moveOccupant} className="flex items-center gap-2">
                    <input type="hidden" name="registrantId" value={person.id} />
                    <input type="hidden" name="notify" value="on" />
                    <Select name="roomId" defaultValue="" className="min-w-[190px] py-2 text-sm">
                      <option value="" disabled>
                        Place in…
                      </option>
                      {rooms
                        .filter(
                          (room) =>
                            room.isActive &&
                            room.assignments.length < room.capacity &&
                            (room.gender === "MIXED" || room.gender === person.gender),
                        )
                        .map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.block} {room.name} ({room.assignments.length}/{room.capacity})
                          </option>
                        ))}
                    </Select>
                    <SubmitButton size="sm" withArrow={false} pendingLabel="…">
                      Place
                    </SubmitButton>
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ── add capacity ────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <Eyebrow>Add a block of rooms</Eyebrow>
          <p className="mt-1.5 text-xs text-ink-45">
            Creates a numbered run. Zion Z01, Z02, Z03 and so on.
          </p>
          <ActionForm action={createRoomBlock} className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Block name" htmlFor="bulk-block" required>
                <Input id="bulk-block" name="block" required placeholder="Zion" />
              </Field>
              <Field label="Room prefix" htmlFor="bulk-prefix" required>
                <Input id="bulk-prefix" name="prefix" required placeholder="Z" />
              </Field>
              <Field label="How many rooms" htmlFor="bulk-count" required>
                <Input id="bulk-count" name="count" type="number" min={1} max={100} defaultValue={10} required />
              </Field>
              <Field label="Beds per room" htmlFor="bulk-capacity" required>
                <Input id="bulk-capacity" name="capacity" type="number" min={1} defaultValue={12} required />
              </Field>
              <Field label="Gender" htmlFor="bulk-gender">
                <Select id="bulk-gender" name="gender" defaultValue="MIXED">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="MIXED">Mixed</option>
                </Select>
              </Field>
              <Field label="Type" htmlFor="bulk-type">
                <Select id="bulk-type" name="type" defaultValue="DORMITORY">
                  <option value="DORMITORY">Dormitory</option>
                  <option value="SHARED">Shared</option>
                  <option value="PRIVATE">Private</option>
                  <option value="FAMILY">Family</option>
                </Select>
              </Field>
            </div>
            <Field
              label="Reserve for"
              htmlFor="bulk-minPosition"
              hint="Only this rank and above can be placed here."
            >
              <Select id="bulk-minPosition" name="minPosition" defaultValue="">
                <option value="">Anyone</option>
                {POSITION_OPTIONS.map((position) => (
                  <option key={position} value={position}>
                    {POSITION_LABEL[position]} and above
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton size="sm" pendingLabel="Creating…">
              Create block
            </SubmitButton>
          </ActionForm>
        </Panel>

        <Panel className="p-5">
          <Eyebrow>Add a single room</Eyebrow>
          <ActionForm action={createRoom} className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Block" htmlFor="room-block" required>
                <Input id="room-block" name="block" required placeholder="Carmel" />
              </Field>
              <Field label="Room name" htmlFor="room-name" required>
                <Input id="room-name" name="name" required placeholder="C07" />
              </Field>
              <Field label="Beds" htmlFor="room-capacity" required>
                <Input id="room-capacity" name="capacity" type="number" min={1} defaultValue={2} required />
              </Field>
              <Field label="Floor" htmlFor="room-floor">
                <Input id="room-floor" name="floor" placeholder="Ground" />
              </Field>
              <Field label="Gender" htmlFor="room-gender">
                <Select id="room-gender" name="gender" defaultValue="MIXED">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="MIXED">Mixed</option>
                </Select>
              </Field>
              <Field label="Type" htmlFor="room-type">
                <Select id="room-type" name="type" defaultValue="SHARED">
                  <option value="DORMITORY">Dormitory</option>
                  <option value="SHARED">Shared</option>
                  <option value="PRIVATE">Private</option>
                  <option value="FAMILY">Family</option>
                </Select>
              </Field>
            </div>
            <Field label="Reserve for" htmlFor="room-minPosition">
              <Select id="room-minPosition" name="minPosition" defaultValue="">
                <option value="">Anyone</option>
                {POSITION_OPTIONS.map((position) => (
                  <option key={position} value={position}>
                    {POSITION_LABEL[position]} and above
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Notes" htmlFor="room-notes">
              <Input id="room-notes" name="notes" placeholder="Nearest the medical tent" />
            </Field>
            <SubmitButton size="sm" pendingLabel="Adding…">
              Add room
            </SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </div>
  );
}
