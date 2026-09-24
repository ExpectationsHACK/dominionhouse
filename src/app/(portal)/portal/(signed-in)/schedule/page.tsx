import type { Metadata } from "next";
import { Badge, Eyebrow, Panel, type Tone } from "@/components/ui";
import { requireRegistrant } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayLabel, timeLabel } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Camp schedule",
  robots: { index: false, follow: false },
};

const TYPE_TONE: Record<string, Tone> = {
  SERVICE: "brand",
  SESSION: "brand",
  PRAYER: "brass",
  MEAL: "neutral",
  ACTIVITY: "success",
  BREAKOUT: "brass",
  LOGISTICS: "neutral",
};

export default async function PortalSchedulePage() {
  const registrant = await requireRegistrant();

  const items = await db.scheduleItem.findMany({
    where: { campId: registrant.campId, isPublished: true },
    orderBy: [{ startsAt: "asc" }],
  });

  const days = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.day.toISOString();
    const bucket = days.get(key);
    if (bucket) bucket.push(item);
    else days.set(key, [item]);
  }

  return (
    <div className="space-y-8">
      <Eyebrow>{registrant.camp.venue}</Eyebrow>

      {[...days.entries()].map(([day, dayItems]) => (
        <Panel key={day}>
          <div className="border-b border-ink/12 bg-ink px-5 py-4">
            <h2 className="display text-2xl text-white">{dayLabel.format(new Date(day))}</h2>
          </div>
          <ul>
            {dayItems.map((item) => (
              <li
                key={item.id}
                className="grid gap-x-5 gap-y-1.5 border-b border-ink/10 px-5 py-4 last:border-0 sm:grid-cols-[92px_1fr_auto]"
              >
                <p className="font-mono text-sm font-semibold">{timeLabel.format(item.startsAt)}</p>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.speaker ? <p className="mt-0.5 text-xs text-ink-45">{item.speaker}</p> : null}
                  {item.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-ink-45">{item.description}</p>
                  ) : null}
                  {item.location ? (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-45">
                      {item.location}
                    </p>
                  ) : null}
                </div>
                <Badge tone={TYPE_TONE[item.type] ?? "neutral"}>{item.type.toLowerCase()}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
