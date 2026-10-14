import type { Metadata } from "next";
import { Countdown } from "@/components/site/countdown";
import { DepthCardCarousel } from "@/components/site/depth-card-carousel";
import { HeroVideo } from "@/components/site/hero-video";
import { Reveal } from "@/components/site/reveal";
import { TestimonialCarousel } from "@/components/site/testimonial-carousel";
import { TestimonyStories } from "@/components/site/testimony-stories";
import { TicketCards } from "@/components/site/ticket-cards";
import { VideoCarousel } from "@/components/site/video-carousel";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import { CAMP_ENCOUNTER_LINE, campLockup } from "@/lib/camp";
import { getPublicCamp, getPublicMedia, getPublicSchedule } from "@/lib/public-data";
import { remainingUntil } from "@/lib/countdown";
import { campDateRange, dayLabel, timeLabel } from "@/lib/dates";
import { formatKobo } from "@/lib/money";
import { CAMP_CLIPS } from "@/lib/site-videos";
import { TESTIMONIES } from "@/lib/testimonies";

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
  "All meals for the duration of camp",
  "Selected accommodation, bedding provided",
  "Camp resources",
] as const;

/** "My camping checklist", from the camp team. */
const BRING = [
  { group: "Toiletries", items: ["Toothbrush and paste", "Deodorant", "Skin care items"] },
  { group: "Clothes", items: ["Comfortable wears", "Sleepwear and underwear", "Sunday outfit"] },
  { group: "Shoes", items: ["Sneakers", "Sandals or slippers", "Comfortable heels"] },
  { group: "Bedding", items: ["Bedsheet", "Light blanket"] },
  { group: "Food", items: ["Snacks", "Covered plate, spoon and cup", "Water bottle"] },
  { group: "Spiritual materials", items: ["Bible", "Notebook or journal", "Pen and highlighter"] },
] as const;

const WHAT_TO_EXPECT = [
  "Long hours of teaching",
  "Intense and fervent prayer",
  "Fresh fire for spiritual life",
  "A charged atmosphere of faith, clarity, and divine encounters",
  "Spiritual equipping for global impact",
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
    a: "Children under 5 come free, and children 5 to 11 pay a ₦15,000 camp fee, register them alongside your own adult registration and tell us how many are coming. Teenagers 12–17 have their own ticket, their own supervised block and their own track.",
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
  const camp = await getPublicCamp();
  if (!camp) throw new Error("No active camp found.");

  const [schedule, cards, testimonialRows, clipRows] = await Promise.all([
    getPublicSchedule(camp.id),
    getPublicMedia("CAMP_CARDS"),
    getPublicMedia("TESTIMONIALS"),
    getPublicMedia("CAMP_VIDEOS").then((rows) => rows.filter((row) => row.videoUrl)),
  ]);
  const clips = clipRows.length
    ? clipRows.map((row) => ({
        id: row.id,
        title: row.title,
        videoUrl: row.videoUrl!,
        posterUrl: row.posterUrl,
      }))
    : CAMP_CLIPS;

  const lockup = campLockup(camp.name);
  const days = groupByDay(schedule);

  return (
    <>
      {/* ── hero, over footage from camp ─────────────────────────────────── */}
      <section className="relative flex min-h-[88svh] flex-col justify-end overflow-hidden bg-ink text-white">
        <HeroVideo name="camp-hero" />
        {/* Legibility: darkest where the type sits, lighter up top so the film reads. */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-14 pt-32 sm:px-8 sm:pb-20">
          <div className="rise-in flex flex-wrap items-center gap-3">
            <Eyebrow className="text-brass">{camp.theme ?? "Camp Meeting"}</Eyebrow>
            <span aria-hidden="true" className="h-px w-10 bg-white/25" />
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
              {campDateRange(camp.startsAt, camp.endsAt)}
            </p>
          </div>

          <h1
            className="display rise-in mt-6 text-[clamp(3rem,11vw,9.5rem)]"
            style={{ animationDelay: "120ms" }}
          >
            {lockup.lead}
            {lockup.year ? <span className="text-brass"> {lockup.year}</span> : null}
          </h1>

          <p
            className="rise-in mt-8 max-w-2xl text-xl leading-relaxed text-white/80"
            style={{ animationDelay: "240ms" }}
          >
            {camp.tagline} {CAMP_ENCOUNTER_LINE}
          </p>

          <div className="rise-in mt-12 flex flex-wrap gap-2.5" style={{ animationDelay: "360ms" }}>
            <ButtonLink href="/camp/register" variant="brass" size="lg">
              Register now <Arrow />
            </ButtonLink>
            <ButtonLink href="/camp/payment" variant="inverse" size="lg">
              Already registered? Pay
            </ButtonLink>
          </div>

          <div
            className="rise-in mt-16 flex flex-wrap items-start gap-x-10 gap-y-8 border-t border-white/20 pt-8"
            style={{ animationDelay: "480ms" }}
          >
            <div>
              <p className="eyebrow flex items-center gap-2 text-white/60">
                <span className="pulse-ring relative h-1.5 w-1.5 rounded-full bg-brass text-brass" />
                Camp starts in
              </p>
              <Countdown
                target={camp.startsAt.toISOString()}
                initial={remainingUntil(camp.startsAt)}
                className="mt-3"
                numberClassName="text-3xl sm:text-4xl"
                labelClassName="text-white/60"
              />
            </div>
            <dl>
              <Fact label="Venue" value={camp.venue} />
            </dl>
          </div>
        </div>
      </section>

      {/* ── the invasion ─────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-meridian text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-brass">Dominion House annual camp is always an experience</Eyebrow>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2rem,6vw,4rem)]">
              Get ready for an unforgettable spiritual encounter
            </h2>

            <div className="mt-8 max-w-3xl space-y-5 text-lg leading-relaxed text-white/70">
              <p>
                FFC 2027 is a supernatural convergence designed to ignite fresh passion, birth fresh
                conviction, sharpen your discernment and position you for all God has prepared for
                the year ahead.
              </p>
              <p>
                This is not just a gathering, it is a{" "}
                <strong className="font-semibold text-white">SPIRITUAL AWAKENING</strong>. An
                Awakening through the Word, Prayer and Impartation for Kingdom influence across
                territories and nations.
              </p>
              <p>
                Prepare to be launched into deeper depths of the Word and prayer. This is where lives
                are realigned, visions are reawakened, and believers are empowered to take territories
                locally and globally.
              </p>
            </div>
          </Reveal>

          <Reveal
            as="dl"
            delay={100}
            className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/15 pt-8 sm:grid-cols-3"
          >
            <Fact label="Camp opens" value="3:00 PM" />
            <Fact label="Venue" value={camp.venue} accent />
            <Fact label="Dates" value={campDateRange(camp.startsAt, camp.endsAt)} />
          </Reveal>

          <Reveal delay={150} className="mt-14">
            <Eyebrow className="text-brass">What to expect</Eyebrow>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {WHAT_TO_EXPECT.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-white/80">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-brass" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal
            as="p"
            delay={200}
            className="mt-14 max-w-2xl text-lg font-medium leading-relaxed text-white"
          >
            Come expectant. Come hungry. Come ready to step fully into God&apos;s agenda for your
            life.
          </Reveal>
        </div>
      </section>

      {/* ── the feel of it, five-second clips ─────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12 bg-white">
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-meridian">A few seconds in the room</Eyebrow>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2.25rem,7vw,5rem)]">
              What it feels like
            </h2>
          </Reveal>
          <div className="mt-14">
            <VideoCarousel label="Fresh Fire experience clips" items={clips} tone="light" />
          </div>
        </div>
      </section>

      {/* ── testimonials: the admin's, or the house's own stories ─────────── */}
      <section className="border-b border-white/10 bg-ink text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-brass">In their own words</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">Fresh Fire testimonies</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Healing, calling, direction, assurance. A few of the stories people carried home from
              camp.
            </p>
          </Reveal>

          <div className="mt-12">
            {testimonialRows.length > 0 ? (
              <TestimonialCarousel
                items={testimonialRows.map((row) => ({
                  id: row.id,
                  name: row.title,
                  testimony: row.subtitle ?? "",
                  imageUrl: row.imageUrl,
                }))}
              />
            ) : (
              <TestimonyStories items={TESTIMONIES} />
            )}
          </div>
        </div>
      </section>

      {/* ── the fire ─────────────────────────────────────────────────────── */}
      {cards.length > 0 ? (
        <section className="relative overflow-hidden border-b border-ink/12 bg-white">
          <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
            <Reveal>
              <Eyebrow className="text-meridian">What camp feels like</Eyebrow>
              <h2 className="display mt-4 max-w-3xl text-[clamp(2.25rem,7vw,5rem)]">
                Fresh Fire, Fresh Convictions and Fresh Impartation
              </h2>
            </Reveal>

            <div className="mt-14">
              <DepthCardCarousel
                tone="light"
                items={cards.map((card) => ({
                  id: card.id,
                  title: card.title,
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
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
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
          </Reveal>

          <TicketCards
            tiers={camp.priceTiers}
            holdFromKobo={camp.installmentsEnabled ? camp.minFirstInstallmentKobo : null}
          />

          <div className="mt-10">
            <ButtonLink href="/camp/register" size="lg">
              Register now <Arrow />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── schedule ─────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12" id="schedule">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>The programme</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">Programme</h2>
          </Reveal>

          <div className="mt-14 space-y-12">
            {days.map(({ day, items }, dayIndex) => (
              <Reveal as="div" key={day} delay={dayIndex * 80} className="grid gap-6 lg:grid-cols-[220px_1fr]">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── included / bring ─────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto grid max-w-[1400px] gap-px bg-ink/12 md:grid-cols-2">
          <Reveal direction="left" className="bg-bone px-5 py-16 sm:px-8 sm:py-20">
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
          </Reveal>
          <Reveal direction="right" delay={100} className="bg-bone px-5 py-16 sm:px-8 sm:py-20">
            <Eyebrow>Your bag</Eyebrow>
            <h2 className="display mt-4 text-4xl">What to bring</h2>
            <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {BRING.map(({ group, items }) => (
                <div key={group}>
                  <h3 className="eyebrow text-ink-45">{group}</h3>
                  <ul className="mt-3 space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-70">
                        <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-meridian" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── faq ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <Eyebrow>Before you ask</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">Questions</h2>
        </Reveal>

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
        <Reveal
          as="div"
          className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between"
        >
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
        </Reveal>
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
