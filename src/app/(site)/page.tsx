import type { Metadata } from "next";
import Link from "next/link";
import { HillContours } from "@/components/site/hill-contours";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import { campLockup, getActiveCamp } from "@/lib/camp";
import { daysUntil } from "@/lib/dates";
import {
  ABOUT,
  CAMPUSES,
  CHURCH,
  COUNTRY_COUNT,
  LAGOS_CAMPUSES,
  STRATEGY,
} from "@/lib/church";
import { formatKobo } from "@/lib/money";

export const metadata: Metadata = {
  title: { absolute: "Dominion House, the church that never sleeps" },
  description:
    "A new frontier church raising kingdom leaders, a people of purpose, passion and power. Nine lighthouses across Nigeria, the UK, Canada and Trinidad.",
};

/**
 * Revalidated on a short cycle so live counts, prices and dates stay honest.
 * Admin edits also call revalidatePath, so a change shows up immediately.
 */
export const revalidate = 60;

const NEXT_STEPS = [
  {
    href: "/locations",
    title: "Find your lighthouse",
    body: `Nine lighthouses across ${COUNTRY_COUNT} countries, from Ikorodu to Calgary. Tell us you're coming and someone will be looking out for you.`,
    cta: "See all locations",
  },
  {
    href: "/vision",
    title: "Know why we exist",
    body: "The vision, the 5D strategy and the seven pillars that shape how this house thinks, decides and moves.",
    cta: "Our vision",
  },
  {
    href: "/give",
    title: "Partner with the work",
    body: "We do not manipulate people to give, we disciple them into generosity. Here is what your giving builds.",
    cta: "Give",
  },
] as const;

export default async function HomePage() {
  const camp = await getActiveCamp();
  const cheapest = camp?.priceTiers.length
    ? Math.min(...camp.priceTiers.map((tier) => tier.amountKobo))
    : null;
  const daysAway = camp ? daysUntil(camp.startsAt) : null;

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12 bg-ink text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-[70%] w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-10 pt-16 sm:px-8 sm:pb-12 sm:pt-24">
          <Eyebrow className="text-brass">{CHURCH.descriptor}</Eyebrow>
          <h1 className="display mt-6 text-[clamp(3rem,11.5vw,9.5rem)]">
            Raising
            <br />
            kingdom
            <br />
            <span className="text-brass">leaders</span>
          </h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-xl text-lg leading-relaxed text-white/70">
              A people of purpose, passion and power, empowered by God&apos;s Word and Spirit to
              reign in life as kings, taking territories and establishing the rulership of Christ in
              every place.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href="/locations" variant="brass" size="lg">
                Plan a visit <Arrow />
              </ButtonLink>
              <ButtonLink href="/vision" variant="inverse" size="lg">
                Our vision
              </ButtonLink>
            </div>
          </div>
        </div>

      </section>

      {/* ── the strapline, given room ────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-brass-soft text-ink">
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            <p className="display text-[clamp(2rem,6vw,4.5rem)]">
              The church that never sleeps
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-ink-70">
              A missional movement, {CAMPUSES.length} lighthouses across {COUNTRY_COUNT} countries,
              reaching the world one person and one community at a time.
            </p>
          </div>
        </div>
      </section>

      {/* ── the 5D strategy ──────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow>Our mission</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5.5rem)]">
            Discover · Develop · Deploy
            <br />
            Duplicate · Dominate
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-70">{ABOUT}</p>

          <div className="mt-14 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-5">
            {STRATEGY.map((step) => (
              <div key={step.key} className="flex flex-col bg-bone p-6">
                <p className="font-mono text-sm font-semibold text-brass">{step.key}</p>
                <h3 className="display mt-3 text-3xl">{step.name}</h3>
                <p className="mt-3 text-xs uppercase tracking-[0.08em] text-ink-45">
                  {step.summary}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── camp band, the loudest moment on the page ───────────────────── */}
      {camp ? (
        <section className="relative overflow-hidden bg-ink text-white">
          <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={18} />
          <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow className="text-brass">{camp.theme ?? "Camp Meeting"}</Eyebrow>
              <span aria-hidden="true" className="h-px w-10 bg-white/25" />
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
                February 2027
              </p>
            </div>

            <h2 className="display mt-6 text-[clamp(2.5rem,9vw,7.5rem)]">
              {campLockup(camp.name).lead}
              {campLockup(camp.name).year ? (
                <span className="text-brass"> {campLockup(camp.name).year}</span>
              ) : null}
            </h2>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
              <p className="max-w-xl text-lg leading-relaxed text-white/70">
                {camp.tagline} The whole house gathers, every lighthouse, one place. Registration is
                open, and you can pay in instalments.
              </p>

              <dl className="grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
                <div>
                  <dt className="eyebrow text-white/40">Days away</dt>
                  <dd className="display mt-2 text-4xl text-brass">{daysAway}</dd>
                </div>
                <div>
                  <dt className="eyebrow text-white/40">From</dt>
                  <dd className="display mt-2 text-4xl">
                    {cheapest !== null ? formatKobo(cheapest) : ", "}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow text-white/40">Spaces</dt>
                  <dd className="display mt-2 text-4xl">{camp.capacity ?? ", "}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-10 flex flex-wrap gap-2.5">
              <ButtonLink href="/camp/register" variant="brass" size="lg">
                Register now <Arrow />
              </ButtonLink>
              <ButtonLink href="/camp" variant="inverse" size="lg">
                What happens at camp
              </ButtonLink>
            </div>
          </div>
        </section>
      ) : null}

      {/* ── campuses ─────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Where we gather</Eyebrow>
              <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">
                A Lighthouse in {COUNTRY_COUNT} countries
              </h2>
            </div>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
            >
              All {CAMPUSES.length} lighthouses <Arrow />
            </Link>
          </div>

          <ul className="mt-12 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-3">
            {LAGOS_CAMPUSES.slice(0, 6).map((campus) => (
              <li key={campus.slug} className="bg-bone p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">
                  Lagos
                </p>
                <h3 className="display mt-2 text-2xl">{campus.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-70">{campus.address}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── next steps ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <Eyebrow>Three ways in</Eyebrow>
        <h2 className="display mt-4 max-w-2xl text-[clamp(2.25rem,6vw,4.5rem)]">
          Everyone is a leader and a minister
        </h2>

        <div className="mt-14 grid gap-px bg-ink/12 sm:grid-cols-3">
          {NEXT_STEPS.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="group flex flex-col justify-between bg-bone p-7 transition-colors hover:bg-paper sm:p-9"
            >
              <div>
                <h3 className="display text-3xl">{step.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink-70">{step.body}</p>
              </div>
              <span className="mt-10 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]">
                {step.cta}
                <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
