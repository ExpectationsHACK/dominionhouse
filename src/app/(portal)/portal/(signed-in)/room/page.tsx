import type { Metadata } from "next";
import { DataRow, EmptyState, Eyebrow, Notice, Panel, PanelHeader } from "@/components/ui";
import { requireRegistrant } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatKobo } from "@/lib/money";
import { POSITION_LABEL } from "@/lib/positions";
import { totalsFor } from "@/lib/registration";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My room",
  robots: { index: false, follow: false },
};

const ROOM_TYPE_LABEL: Record<string, string> = {
  DORMITORY: "Dormitory",
  SHARED: "Shared room",
  PRIVATE: "Private room",
  FAMILY: "Family room",
};

export default async function PortalRoomPage() {
  const registrant = await requireRegistrant();
  const totals = totalsFor(registrant);

  if (!registrant.roomAssignment) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="Not yet assigned"
          description={
            totals.isSettled
              ? "You're paid up. The camp desk assigns rooms by hand, you'll get an email the moment yours is set."
              : `Rooms go to registrants who are paid in full. ${formatKobo(totals.balanceKobo)} to go.`
          }
        />
        <Panel className="p-6">
          <Eyebrow>How rooms are decided</Eyebrow>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-70">
            <li>Rooms are same-gender, always.</li>
            <li>Leaders, ministers and pastors are placed in the smaller blocks.</li>
            <li>Every paid registrant gets a bed, rooms are assigned by the camp desk.</li>
          </ul>
        </Panel>
      </div>
    );
  }

  const room = registrant.roomAssignment.room;
  const occupants = await db.roomAssignment.findMany({
    where: { roomId: room.id },
    include: { registrant: true },
    orderBy: { bedLabel: "asc" },
  });

  const roommates = occupants.filter((item) => item.registrantId !== registrant.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Panel>
        <PanelHeader
          title="Who you're sharing with"
          description={`${occupants.length} of ${room.capacity} beds taken.`}
        />
        {roommates.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-45">
            You&apos;re the first in this room. More names appear as the block fills.
          </p>
        ) : (
          <ul>
            {roommates.map((mate) => (
              <li
                key={mate.id}
                className="flex items-center gap-4 border-b border-ink/10 px-5 py-4 last:border-0"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink font-mono text-xs font-semibold text-white">
                  {initials(mate.registrant.firstName, mate.registrant.lastName)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {mate.registrant.firstName} {mate.registrant.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-45">
                    {POSITION_LABEL[mate.registrant.position]}
                    {mate.registrant.department ? ` · ${mate.registrant.department}` : ""}
                    {mate.bedLabel ? ` · Bed ${mate.bedLabel}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-6">
        <Panel className="p-6">
          <Eyebrow>Your bed</Eyebrow>
          <p className="display mt-3 text-5xl">
            {room.block} {room.name}
          </p>
          <div className="mt-5">
            <DataRow label="Bed" value={registrant.roomAssignment.bedLabel ?? ", "} />
            <DataRow label="Type" value={ROOM_TYPE_LABEL[room.type] ?? room.type} />
            <DataRow label="Floor" value={room.floor ?? ", "} />
            <DataRow label="Capacity" value={`${occupants.length} of ${room.capacity}`} />
          </div>
          {room.notes ? <p className="mt-4 text-xs text-ink-45">{room.notes}</p> : null}
        </Panel>

        <Notice tone="neutral" title="Need a change?">
          Room moves are handled at the camp desk on arrival day, or by email before you travel.
        </Notice>
      </div>
    </div>
  );
}
