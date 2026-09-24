import type { Metadata } from "next";
import Image from "next/image";
import flyer from "../../../../public/fresh-fire-camp.jpeg";
import { DepthCardCarousel } from "@/components/site/depth-card-carousel";
import { HillContours } from "@/components/site/hill-contours";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import { db } from "@/lib/db";
import { campLockup, requireActiveCamp } from "@/lib/camp";
import { campDateRange, dayLabel, daysUntil, timeLabel } from "@/lib/dates";
import { formatKobo } from "@/lib/money";

export const metadata: Metadata = {
  title: "Fresh Fire Camp Meeting 2027",
  description:
    "Fresh Fire Camp Meeting 2027, February 2027. The whole house gathers, teaching, prayer and worship. Registration is open for adults, students, teenagers and children, with instalment payments available.",
  openGraph: {
    title: "Fresh Fire Camp Meeting 2027 · Dominion House",
    description: "25–28 February 2027 at Redemption City. Registration is open.",
    images: [{ url: "/fresh-fire-camp.jpeg", width: 958, height: 1080, alt: "Fresh Fire Camp Meeting 2027, 25–28 February 2027" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/fresh-fire-camp.jpeg"],
  },
};

/**
 * Revalidated on a short cycle so live counts, prices and dates stay honest.
 * Admin edits also call revalidatePath, so a change shows up immediately.
 */
export const revalidate = 60;

const INCLUDED = [
  "Accommodation for the full camp, bedding provided",
  "All meals for the duration of camp",
  "Every teaching session, breakout and night meeting",
  "Camp workbook and your track materials",
] as const;

const BRING = [
  "A jacket for the evenings",
  "Torch or headlamp, and a power bank",
  "Refillable water bottle",
  "Sandals for the shower block",
  "Your Bible, a notebook and a pen you like",
] as const;

const FAQS = [
  {
    q: "Can I pay in instalments?",
    a: "Yes. Pay at least ₦10,000 to hold your place, then top up any amount, any time, until the balance clears. Your ticket is issued automatically the moment it does.",
  },
  {
    q: "When do I get my ticket?",
    a: "The second your balance reaches zero. It arrives by email with a QR code, and it also lives in your camp profile. Nobody has to chase the office for it.",
  },
  {
    q: "How are rooms decided?",
    a: "Rooms are same-gender and assigned by the camp desk. Leaders and ministers are placed in the smaller blocks. You'll see your room and roommates in your profile before you travel.",
  },
  {
    q: "Can my children come?",
    a: "Children 12 and under register on the child ticket and must be registered alongside a parent or guardian, who stays responsible for them all week. Teenagers 13–17 have their own supervised block and their own track.",
  },
  {
    q: "What if I can't afford it?",
    a: "Nobody misses camp over money. Write to dominionhs@gmail.com and the team will work something out with you quietly.",
  },
  {
    q: "Can I come for part of the week?",
    a: "Camp is sold as the full programme, the teaching builds. If you genuinely can only do part of it, register in full and tell the desk your arrival day.",
  },
] as const;

export default async function CampOverviewPage() {
  const camp = await requireActiveCamp();

  const [schedule, cards] = await Promise.all([
    db.scheduleItem.findMany({
      where: { campId: camp.id, isPublished: true },
      orderBy: [{ startsAt: "asc" }],
    }),
    db.siteMedia.findMany({
      where: { placement: "CAMP_CARDS", isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const lockup = campLockup(camp.name);
  const days = groupByDay(schedule);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={20} />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow className="text-brass">{camp.theme ?? "Camp Meeting"}</Eyebrow>
            <span aria-hidden="true" className="h-px w-10 bg-white/25" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
              {campDateRange(camp.startsAt, camp.endsAt)}
            </p>
          </div>

          <h1 className="display mt-6 text-[clamp(3rem,11vw,9.5rem)]">
            {lockup.lead}
            {lockup.year ? <span className="text-brass"> {lockup.year}</span> : null}
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-white/70">
            {camp.tagline}
          </p>

          <div className="mt-12 flex flex-wrap gap-2.5">
            <ButtonLink href="/camp/register" variant="brass" size="lg">
              Register now <Arrow />
            </ButtonLink>
            <ButtonLink href="/camp/payment" variant="inverse" size="lg">
              Already registered? Pay
            </ButtonLink>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/15 pt-8">
            <Fact label="Days away" value={String(daysUntil(camp.startsAt))} accent />
            <Fact label="Venue" value={camp.venue} />
          </dl>
          </div>

          {/* The official flyer, carrying the house's own blue-and-amber treatment. */}
          <Image
            src={flyer}
            alt={`${camp.name}, ${campDateRange(camp.startsAt, camp.endsAt)} at ${camp.venue}`}
            priority
            placeholder="blur"
            sizes="(max-width: 1024px) 100vw, 420px"
            className="mx-auto w-full max-w-sm border border-white/15 lg:max-w-none"
          />
        </div>
      </section>

      {/* ── what it is ───────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Eyebrow>The overview</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">
              The whole house,
              <br />
              in one place.
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-ink-70">
            <p>{camp.description}</p>
            <p>
              Mornings start with prayer. Teaching runs through the day, with breakouts where
              leaders, students and teenagers each have their own room. Nights are worship, and they
              finish when they finish.
            </p>
            <p className="text-ink">
              Every lighthouse, one gathering, days of unhurried attention on one thing. That is the
              whole point.
            </p>
          </div>
        </div>
      </section>

      {/* ── the fire ─────────────────────────────────────────────────────── */}
      {cards.length > 0 ? (
        <section className="relative overflow-hidden border-b border-ink/12 bg-ink text-white">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(1100px 520px at 15% 0%, rgba(33,161,255,.32), transparent 65%), radial-gradient(820px 420px at 90% 100%, rgba(238,247,255,.20), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
            <Eyebrow className="text-brass">What camp feels like</Eyebrow>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2.25rem,7vw,5rem)]">
              Fresh fire, and the people who carry it
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Teaching in the morning, breakouts at noon, worship at night, and the ordinary hours
              in between, where most of it actually happens.
            </p>

            <div className="mt-14">
              <DepthCardCarousel
                items={cards.map((card) => ({
                  id: card.id,
                  title: card.title,
                  subtitle: card.subtitle,
                  imageUrl: card.imageUrl,
                }))}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* ── pricing ──────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12" id="pricing">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Tickets</Eyebrow>
              <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">What it costs</h2>
            </div>
            {camp.installmentsEnabled ? (
              <p className="max-w-sm text-sm leading-relaxed text-ink-45">
                Pay in full, or start with {formatKobo(camp.minFirstInstallmentKobo)} and clear the rest
                before{" "}
                {camp.paymentDeadline ? dayLabel.format(camp.paymentDeadline) : "camp"}. Your ticket
                is issued automatically when the balance hits zero.
              </p>
            ) : null}
          </div>

          <div className="mt-14 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-4">
            {camp.priceTiers.map((tier) => (
              <div key={tier.id} className="flex flex-col justify-between bg-bone p-7 sm:p-8">
                <div>
                  <p className="eyebrow text-brass">{tier.label}</p>
                  <p className="display mt-4 text-5xl">{formatKobo(tier.amountKobo)}</p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-70">{tier.description}</p>
                </div>
                {camp.installmentsEnabled ? (
                  <p className="mt-8 border-t border-ink/12 pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
                    From{" "}
                    {formatKobo(Math.min(camp.minFirstInstallmentKobo, tier.amountKobo))} to hold
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-10">
            <ButtonLink href="/camp/register" size="lg">
              Pick your ticket <Arrow />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── schedule ─────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12" id="schedule">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow>The programme</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">Programme</h2>

          <div className="mt-14 space-y-12">
            {days.map(({ day, items }) => (
              <div key={day} className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <h3 className="display sticky top-20 self-start text-3xl text-meridian">
                  {dayLabel.format(new Date(day))}
                </h3>
                <ul className="border-t border-ink/12">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="grid gap-x-6 gap-y-1 border-b border-ink/12 py-5 sm:grid-cols-[110px_1fr_auto]"
                    >
                      <p className="font-mono text-sm font-semibold tracking-wide text-ink">
                        {timeLabel.format(item.startsAt)}
                      </p>
                      <div>
                        <p className="text-base font-semibold">{item.title}</p>
                        {item.speaker ? (
                          <p className="mt-0.5 text-sm text-ink-45">{item.speaker}</p>
                        ) : null}
                        {item.description ? (
                          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-45">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      {item.location ? (
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45 sm:text-right">
                          {item.location}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── included / bring ─────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto grid max-w-[1400px] gap-px bg-ink/12 md:grid-cols-2">
          <div className="bg-bone px-5 py-16 sm:px-8 sm:py-20">
            <Eyebrow>In the price</Eyebrow>
            <h2 className="display mt-4 text-4xl">What&apos;s included</h2>
            <ul className="mt-8 space-y-4">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-70">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-brass" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-bone px-5 py-16 sm:px-8 sm:py-20">
            <Eyebrow>Your bag</Eyebrow>
            <h2 className="display mt-4 text-4xl">What to bring</h2>
            <ul className="mt-8 space-y-4">
              {BRING.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-70">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-meridian" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── faq ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <Eyebrow>Before you ask</Eyebrow>
        <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">Questions</h2>

        <div className="mt-12 border-t border-ink/12">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group border-b border-ink/12">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="relative h-3 w-3 shrink-0 transition-transform duration-300 group-open:rotate-45"
                >
                  <span className="absolute left-0 top-1/2 h-px w-3 bg-ink" />
                  <span className="absolute left-1/2 top-0 h-3 w-px bg-ink" />
                </span>
              </summary>
              <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-ink-70">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── close ────────────────────────────────────────────────────────── */}
      <section className="bg-meridian text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="display max-w-2xl text-[clamp(2.5rem,7vw,5.5rem)]">
            The house is expecting you
          </h2>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/camp/register" variant="brass" size="lg">
              Register <Arrow />
            </ButtonLink>
            <ButtonLink href="/camp/payment" variant="inverse" size="lg">
              Pay a balance
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="eyebrow text-white/40">{label}</dt>
      <dd
        className={`display mt-2 hyphens-auto break-words text-2xl sm:text-3xl ${accent ? "text-brass" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function groupByDay<T extends { day: Date }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.day.toISOString();
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return [...map.entries()].map(([day, dayItems]) => ({ day, items: dayItems }));
}
