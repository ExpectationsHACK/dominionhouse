import type { Metadata } from "next";
import Link from "next/link";
import { HillContours } from "@/components/site/hill-contours";
import { CountUp, Magnetic } from "@/components/site/motion";
import { Reveal } from "@/components/site/reveal";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import { getPublicCamp } from "@/lib/public-data";
import { CAMPUSES, COUNTRY_COUNT, GATHERINGS } from "@/lib/church";
import { daysUntil } from "@/lib/dates";

export const metadata: Metadata = {
  alternates: { canonical: "/events" },
  title: "What's on",
  description:
    "Morning Dew on Mondays, Bible Study on Wednesdays, Night of Encounters on Thursdays and the Sunday Worship Experience. Plus Fresh Fire Camp Meeting 2027.",
};

/**
 * Revalidated on a short cycle so live counts, prices and dates stay honest.
 * Admin edits also call revalidatePath, so a change shows up immediately.
 */
export const revalidate = 60;

/** Rhythms the vision document states, kept below the concrete gatherings. */
const RHYTHMS = [
  {
    when: "Wednesday to Thursday morning",
    title: "The weekly fruit-fast",
    detail:
      "One full day, every week, as a lifestyle rather than an emergency measure. It is a condition of spiritual leadership in this house.",
  },
  {
    when: "Continually",
    title: "Prayer",
    detail:
      "We pray intensely, consistently, corporately and personally, praying in the Spirit and praying long hours. Prayer is our breath, not an event.",
  },
  {
    when: "Ongoing",
    title: "Evangelism and follow-up",
    detail:
      "We are a soul-winning movement. We evangelize intentionally, follow up diligently, and gather people into God's family.",
  },
  {
    when: "Ongoing",
    title: "Discipleship and training",
    detail:
      "We don't stop at salvation. We train, mentor and grow believers into maturity, disciples who reproduce disciples.",
  },
] as const;

export default async function EventsPage() {
  const camp = await getPublicCamp();

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/12 bg-meridian text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow className="rise-in text-brass">
            <CountUp to={CAMPUSES.length} /> lighthouses · <CountUp to={COUNTRY_COUNT} /> countries
          </Eyebrow>
          <h1 className="display rise-in mt-5 text-[clamp(2.5rem,9vw,7.5rem)]" style={{ animationDelay: "120ms" }}>
            What&apos;s on
          </h1>
          <p className="rise-in mt-8 max-w-xl text-lg leading-relaxed text-white/70" style={{ animationDelay: "240ms" }}>
            Four gatherings carry the week, from Monday morning prayer to Sunday worship. Every one
            of them is open to you.
          </p>
        </div>
      </section>

      {/* ── the week ─────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
          <Reveal>
            <Eyebrow>Join us</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">Every week</h2>
          </Reveal>

          <div className="mt-14 space-y-px bg-ink/12">
            {GATHERINGS.map((gathering, index) => (
              <Reveal
                as="article"
                key={gathering.slug}
                delay={(index % 2) * 80}
                className="grid gap-x-10 gap-y-5 bg-bone p-7 sm:p-9 lg:grid-cols-[280px_1fr]"
              >
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass">
                    {gathering.day}
                  </p>
                  <p className="display mt-2 text-4xl">{gathering.time}</p>
                  <p className="mt-3 text-sm text-ink-45">{gathering.where}</p>
                  {gathering.host ? (
                    <p className="mt-1 text-sm font-medium text-meridian">{gathering.host}</p>
                  ) : null}
                </div>

                <div>
                  <h3 className="display text-3xl">{gathering.name}</h3>
                  <p className="mt-2 text-base font-medium text-ink">{gathering.strapline}</p>
                  <div className="mt-4 space-y-3">
                    {gathering.body.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 24)}
                        className="max-w-2xl text-[15px] leading-relaxed text-ink-70"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {gathering.cta ? (
                    <ButtonLink href={gathering.cta.href} variant="outline" size="sm" className="mt-6">
                      {gathering.cta.label} <Arrow />
                    </ButtonLink>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── the headline event ───────────────────────────────────────────── */}
      {camp ? (
        <section className="relative overflow-hidden border-b border-ink/12 bg-sky text-ink">
          <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={18} />
          <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow className="text-brass">The one to plan around</Eyebrow>
              <span aria-hidden="true" className="h-px w-10 bg-ink/5" />
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-45">
                25 to 28 February 2027
              </p>
            </div>

            <h2 className="display mt-6 text-[clamp(2.75rem,10vw,8rem)]">{camp.name}</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-70">{camp.tagline}</p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Magnetic>
                <ButtonLink href="/camp/register" variant="sky" size="lg" className="shine">
                  Register <Arrow />
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="/camp" variant="solid" size="lg">
                Read more
              </ButtonLink>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
                {daysUntil(camp.startsAt)} days away
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Spiritual Growth Bootcamp ────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-ink text-white">
        <Reveal className="mx-auto grid max-w-[1400px] gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Eyebrow className="text-brass">One-week intensive</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">Spiritual Growth Bootcamp</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
              A transformative one-week intensive designed to awaken spiritual hunger, establish
              strong spiritual foundations, and set you on a purposeful journey of spiritual growth
              and destiny fulfilment.
            </p>
          </div>
          <ButtonLink href="/spiritual-growth-bootcamp" variant="brass" size="lg" className="shrink-0">
            Find out more <Arrow />
          </ButtonLink>
        </Reveal>
      </section>

      {/* ── the rhythm ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
        <Reveal>
          <Eyebrow>How this house moves</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">The ordinary rhythm</h2>
        </Reveal>

        <ul className="mt-12 border-t border-ink/12">
          {RHYTHMS.map((item) => (
            <li key={item.title}>
              <Link
                href="/vision"
                className="group grid gap-x-8 gap-y-2 border-b border-ink/12 py-6 transition-colors hover:bg-paper sm:grid-cols-[240px_1fr_auto] sm:items-baseline"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass">
                  {item.when}
                </p>
                <div>
                  <h3 className="display text-2xl">{item.title}</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-70">
                    {item.detail}
                  </p>
                </div>
                <Arrow className="hidden h-4 w-4 text-ink-45 transition-transform duration-300 group-hover:translate-x-1 sm:block" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-2.5">
          <ButtonLink href="/locations" size="lg">
            Find a lighthouse near you <Arrow />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
