import type { Metadata } from "next";
import Link from "next/link";
import { Countdown } from "@/components/site/countdown";
import { DepthCardCarousel, type DepthCardItem } from "@/components/site/depth-card-carousel";
import { HeroVideo } from "@/components/site/hero-video";
import { HillContours } from "@/components/site/hill-contours";
import { LighthouseCards } from "@/components/site/lighthouse-cards";
import { MissionCards } from "@/components/site/mission-cards";
import { Reveal } from "@/components/site/reveal";
import { SplashLoader } from "@/components/site/splash-loader";
import { StaggerWords } from "@/components/site/stagger-words";
import { TiltCard } from "@/components/site/tilt-card";
import { VideoCarousel } from "@/components/site/video-carousel";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import { campLockup } from "@/lib/camp";
import {
  ABOUT,
  CAMPUSES,
  CHURCH,
  COUNTRY_COUNT,
  STRATEGY,
} from "@/lib/church";
import { remainingUntil } from "@/lib/countdown";
import { formatKobo } from "@/lib/money";
import { getPublicCamp, getPublicMedia } from "@/lib/public-data";
import { SERVICE_CLIPS } from "@/lib/site-videos";

export const metadata: Metadata = {
  title: { absolute: "Dominion House, the church that never sleeps" },
  description:
    "A new frontier church raising kingdom leaders, a people of purpose, passion and power. Nine lighthouses across Nigeria, the UK, Canada and Trinidad.",
};

/**
 * Revalidated on a short cycle so live counts, prices and dates stay honest.
 */
/** Every 30 minutes: see PUBLIC_TTL_SECONDS in src/lib/public-data.ts for why. */
export const revalidate = 1800;

const NEXT_STEPS = [
  {
    href: "/locations",
    title: "Find a lighthouse close to you",
    body: `Nine lighthouses across ${COUNTRY_COUNT} countries, from Jumofak to Calgary. Tell us you're coming and someone will be looking out for you.`,
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

/**
 * The Senior Pastors. Photos are the files in public/pastors/, replace one by
 * dropping in a new file with the same name. Admin, Website content can replace
 * the whole list.
 */
const SENIOR_PASTORS: DepthCardItem[] = [
  {
    id: "dotun-arifalo",
    title: "Rev Dotun Arifalo",
    subtitle: "Visionary / Founder",
    imageUrl: "/pastors/dotun-arifalo.jpg",
  },
  {
    id: "vincent-arifalo",
    title: "Pastor Vincent Arifalo",
    subtitle: "Visionary / Co-Founder",
    imageUrl: "/pastors/vincent-arifalo.jpg",
  },
  {
    id: "isoa-okojie",
    title: "Pastor Isoa Okojie",
    subtitle: "Senior Pastor",
    imageUrl: "/pastors/isoa-okojie.jpg",
  },
  {
    id: "ayomide-olofinjana",
    title: "Pastor Ayomide Olofinjana",
    subtitle: "Senior Pastor",
    imageUrl: "/pastors/ayomide-olofinjana.jpg",
  },
];

export default async function HomePage() {
  const camp = await getPublicCamp();
  const cheapest = camp?.priceTiers.length
    ? Math.min(...camp.priceTiers.map((tier) => tier.amountKobo))
    : null;
  const [pastorRows, clipRows] = await Promise.all([
    getPublicMedia("PASTORS"),
    getPublicMedia("SERVICE_VIDEOS").then((rows) => rows.filter((row) => row.videoUrl)),
  ]);
  const clips = clipRows.length
    ? clipRows.map((row) => ({
        id: row.id,
        title: row.title,
        videoUrl: row.videoUrl!,
        posterUrl: row.posterUrl,
      }))
    : SERVICE_CLIPS;
  const pastors: DepthCardItem[] = pastorRows.length
    ? pastorRows.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        imageUrl: row.imageUrl,
      }))
    : SENIOR_PASTORS;

  return (
    <>
      <SplashLoader />

      {/* ── hero, over the house's own aerial footage ─────────────────────── */}
      <section className="relative flex min-h-[88svh] flex-col justify-end overflow-hidden border-b border-ink/12 bg-ink text-white">
        <HeroVideo />
        {/* Legibility: darkest where the type sits, lighter up top so the film reads. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-ink/25"
        />
        <div className="relative mx-auto w-full max-w-[1400px] px-5 pb-12 pt-32 sm:px-8 sm:pb-16">
          <Eyebrow className="rise-in text-brass">{CHURCH.descriptor}</Eyebrow>
          <h1 className="display mt-6 text-[clamp(2.5rem,8.5vw,7rem)]">
            <StaggerWords
              start={120}
              lines={[
                ["A", "people", "of", "purpose,"],
                ["passion", "and", { text: "power", className: "text-brass" }],
              ]}
            />
          </h1>
          <div
            className="rise-in mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end"
            style={{ animationDelay: "760ms" }}
          >
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              We have a mandate to raise one million leaders.
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

      {/* ── the strapline, as a band that never stops moving ─────────────── */}
      <section
        aria-label="The church that never sleeps"
        className="marquee overflow-hidden border-b border-ink/12 bg-brass-soft py-8 text-ink sm:py-10"
      >
        <div aria-hidden="true" className="marquee-track flex w-max">
          {[0, 1].map((copy) => (
            <p key={copy} className="display flex shrink-0 items-center text-[clamp(2rem,6vw,4.5rem)]">
              {[
                "The church that never sleeps",
                `${CAMPUSES.length} lighthouses`,
                `${COUNTRY_COUNT} countries`,
                "Raising kingdom leaders",
              ].map((phrase) => (
                <span key={phrase} className="flex items-center">
                  <span className="px-6 sm:px-10">{phrase}</span>
                  <span className="h-3 w-3 shrink-0 bg-brass sm:h-4 sm:w-4" />
                </span>
              ))}
            </p>
          ))}
        </div>
        <h2 className="sr-only">The church that never sleeps</h2>
        <div className="mx-auto mt-6 max-w-[1400px] px-5 sm:px-8">
          <p className="max-w-xl text-sm leading-relaxed text-ink-70">
            A missional movement, {CAMPUSES.length} lighthouses across {COUNTRY_COUNT} countries,
            reaching the world one person and one community at a time.
          </p>
        </div>
      </section>

      {/* ── the feel of a service, five-second clips ─────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12 bg-ink text-white">
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-brass">A few seconds in the room</Eyebrow>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2.25rem,7vw,5rem)]">
              What a service feels like
            </h2>
          </Reveal>
          <div className="mt-14">
            <VideoCarousel label="Service experience clips" items={clips} />
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

            <Reveal className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <p className="max-w-xl text-lg leading-relaxed text-white/70">
                {camp.tagline} The whole house gathers, every lighthouse, one place. Registration is
                open, and you can pay in instalments.
              </p>

              <div className="flex flex-wrap items-end gap-x-10 gap-y-6 border-t border-white/15 pt-6">
                <div>
                  <p className="eyebrow flex items-center gap-2 text-white/40">
                    <span className="pulse-ring relative h-1.5 w-1.5 rounded-full bg-brass text-brass" />
                    Camp starts in
                  </p>
                  <Countdown
                    target={camp.startsAt.toISOString()}
                    initial={remainingUntil(camp.startsAt)}
                    className="mt-3"
                    numberClassName="text-4xl sm:text-5xl"
                    labelClassName="text-white/40"
                  />
                </div>
                <div>
                  <p className="eyebrow text-white/40">From</p>
                  <p className="display mt-3 text-4xl sm:text-5xl">
                    {cheapest !== null ? formatKobo(cheapest) : ", "}
                  </p>
                </div>
              </div>
            </Reveal>

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

      {/* ── the mission, D1 to D5 ────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Our mission</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5.5rem)]">The 5D&apos;s.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-70">{ABOUT}</p>
          </Reveal>

          <MissionCards steps={STRATEGY} />
        </div>
      </section>

      {/* ── meet our pastors ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10 bg-ink text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 15% 0%, rgba(33,161,255,.28), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-brass">The leadership of the house</Eyebrow>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2.25rem,7vw,5.5rem)]">
              Meet our Senior Pastors
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              The Senior Pastors who carry the vision and shepherd the house.
            </p>
          </Reveal>

          <div className="mt-12">
            <DepthCardCarousel items={pastors} label="Our Senior Pastors" numbered={false} />
          </div>
        </div>
      </section>

      {/* ── next steps ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <Eyebrow>Three ways in</Eyebrow>
          <h2 className="display mt-4 max-w-2xl text-[clamp(2.25rem,6vw,4.5rem)]">
            Everyone is a leader and a minister
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map((step, index) => (
            <Reveal key={step.href} delay={index * 150} className="h-full">
              <TiltCard
                href={step.href}
                className="h-full border border-ink/12 bg-paper p-7 transition-[background-color,box-shadow] hover:bg-brass-soft hover:shadow-[0_24px_48px_-24px_rgba(11,11,12,0.35)] sm:p-9"
              >
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold text-brass">0{index + 1}</p>
                    <h3 className="display mt-3 text-3xl">{step.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-ink-70">{step.body}</p>
                  </div>
                  <span className="mt-10 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em]">
                    {step.cta}
                    <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>
      {/* ── campuses ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/10 bg-meridian text-white">
        <HillContours className="absolute inset-x-0 top-0 h-[60%] w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow className="text-brass">Where we gather</Eyebrow>
              <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5.5rem)]">
                A Lighthouse in {COUNTRY_COUNT} countries
              </h2>
            </div>
            <Link
              href="/locations"
              className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
            >
              All {CAMPUSES.length} lighthouses <Arrow />
            </Link>
          </Reveal>

          <LighthouseCards campuses={CAMPUSES} />
        </div>
      </section>

    </>
  );
}
