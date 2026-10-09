import type { Metadata } from "next";
import Link from "next/link";
import { GiveForm } from "./give-form";
import { HillContours } from "@/components/site/hill-contours";
import { BLUE_SHADES, PixelBlock, shadeBackground } from "@/components/site/pixel-block";
import { Reveal } from "@/components/site/reveal";
import { Arrow, ButtonLink, Eyebrow, Panel } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/church";
import {
  LEGACY_BENEFITS,
  LEGACY_COVENANT_STEPS,
  LEGACY_DEFAULT_RAISED_NAIRA,
  LEGACY_FAQ,
  LEGACY_IMPACT,
  LEGACY_INTERN_QUOTE,
  LEGACY_LINKS,
  LEGACY_MANDATE_STEPS,
  LEGACY_MILESTONES,
  LEGACY_PARTNER_TARGET,
  LEGACY_PHASES,
  LEGACY_SEED_GOAL_NAIRA,
  LEGACY_SPACES,
  LEGACY_TOTAL_COST_NAIRA,
  LEGACY_WHY,
} from "@/lib/legacy-place";
import { getPublicLegacyRaised } from "@/lib/public-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Become an Angel Partner",
  description:
    "Join 500 Angel Partners giving at least ₦20,000 or $20 a month to build Legacy Place, a missions training hub raising a generation to reach 1,000,000 young people.",
};

export const revalidate = 60;

const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;
const nairaShort = (value: number) =>
  value >= 1_000_000_000
    ? `₦${(value / 1_000_000_000).toLocaleString("en-NG")} billion`
    : `₦${(value / 1_000_000).toLocaleString("en-NG")} million`;

const PARTNERSHIP_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Angel Partners")}`;

export default async function GivePage() {
  const raised = (await getPublicLegacyRaised()) ?? LEGACY_DEFAULT_RAISED_NAIRA;
  const percent = Math.min(100, (raised / LEGACY_SEED_GOAL_NAIRA) * 100);

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={18} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow className="rise-in text-brass">Angel Partners &middot; Legacy Place</Eyebrow>
          <h1
            className="display rise-in mt-5 max-w-5xl text-[clamp(3rem,10vw,8rem)]"
            style={{ animationDelay: "120ms" }}
          >
            Build what
            <br />
            <span className="text-brass">outlives you.</span>
          </h1>
          <p
            className="rise-in mt-8 max-w-2xl text-lg leading-relaxed text-white/75"
            style={{ animationDelay: "260ms" }}
          >
            Join {LEGACY_PARTNER_TARGET} Angel Partners committing at least ₦20,000 or $20 a month
            till 2030 to build Legacy Place: a missions training hub raising and sending a generation
            to touch 1,000,000 young people.
          </p>
          <ul className="rise-in mt-7 flex flex-wrap gap-2" style={{ animationDelay: "340ms" }}>
            {LEGACY_MILESTONES.map((milestone) => (
              <li
                key={milestone}
                className="flex items-center gap-2 border border-white/20 px-3 py-1.5 text-sm text-white/85"
              >
                <span aria-hidden="true" className="text-brass">
                  &#10003;
                </span>
                {milestone}
              </li>
            ))}
          </ul>
          <div className="rise-in mt-9 flex flex-wrap gap-2.5" style={{ animationDelay: "420ms" }}>
            <ButtonLink href="#partner" variant="brass" size="lg">
              Become an Angel Partner <Arrow />
            </ButtonLink>
            {LEGACY_LINKS.visionVideo ? (
              <ButtonLink href={LEGACY_LINKS.visionVideo} variant="inverse" size="lg">
                Watch the vision video
              </ButtonLink>
            ) : (
              <ButtonLink href={PARTNERSHIP_MAILTO} variant="inverse" size="lg">
                Talk to the partnership team
              </ButtonLink>
            )}
          </div>
          <p className="mt-5 text-sm text-white/50">A covenant invitation. Pause anytime.</p>
        </div>
      </section>

      {/* ── progress ─────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-brass-soft">
        <Reveal as="div" className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 sm:py-16">
          <p className="max-w-2xl text-lg font-medium leading-relaxed">
            Together, we&apos;re building something eternal. Every brick, every chair, every Bible:
            it all adds up to transformed lives.
          </p>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink-45">Raised</p>
              <p className="display mt-1 text-[clamp(2.25rem,6vw,4rem)]">{naira(raised)}</p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-ink-45">Seed goal</p>
              <p className="display mt-1 text-[clamp(1.5rem,4vw,2.5rem)] text-ink-70">
                {naira(LEGACY_SEED_GOAL_NAIRA)}
              </p>
            </div>
          </div>
          <div
            className="mt-5 h-3 w-full bg-white"
            role="progressbar"
            aria-valuenow={Math.round(percent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward the seed goal"
          >
            <div className="h-full bg-brass" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-70">
            {percent.toFixed(1)}% of the seed goal (commencement phase)
          </p>
        </Reveal>
      </section>

      {/* ── why ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Why Angel Partners exists</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">
              Training pipelines require planning, not last-minute pressure
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-70">
              We are Angel Partners because we believe in the power of preparation. Rev. Dotun
              Arifalo has raised over 50 interns, and Legacy Place is the permanent campus to
              multiply this impact.
            </p>
          </Reveal>
          <div>
            <ul className="space-y-3">
              {LEGACY_WHY.map((line, index) => (
                <Reveal
                  as="li"
                  key={line}
                  delay={index * 100}
                  className="flex gap-4 border border-ink/12 bg-paper p-5 text-[16px] leading-relaxed"
                >
                  <span className="font-mono text-sm font-semibold text-brass">0{index + 1}</span>
                  {line}
                </Reveal>
              ))}
            </ul>
            <figure className="mt-8 border-l-2 border-brass pl-6">
              <blockquote className="text-xl font-medium italic leading-relaxed">
                &ldquo;We are not just building a structure; we are building the people who will
                build the future.&rdquo;
              </blockquote>
              <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-45">
                Rev. Dotun Arifalo &middot; Lead Visionary
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ── what Legacy Place is ─────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-bone">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Holy ground for kingdom training</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">Legacy Place</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-70">
              More than a building: a global missions hub where young leaders are grounded in
              truth, formed in love, equipped with practical skills, and sent with boldness.
            </p>
          </Reveal>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEGACY_SPACES.map((space, index) => {
              const shade = BLUE_SHADES[index % BLUE_SHADES.length];
              return (
                <Reveal
                  as="li"
                  key={space.name}
                  delay={(index % 3) * 90}
                  className={cn("card-lift flex flex-col overflow-hidden", shade.text)}
                  style={{ background: shadeBackground(shade) }}
                >
                  <div className="aspect-[10/2] w-full overflow-hidden">
                    <PixelBlock seed={index + 3} className={shade.art} />
                  </div>
                  <div className="p-6 pt-4">
                    <h3 className="display text-3xl">{space.name}</h3>
                    <p className={cn("mt-2 text-[15px] leading-relaxed", shade.muted)}>{space.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
          {LEGACY_LINKS.walkthrough3d ? (
            <ButtonLink href={LEGACY_LINKS.walkthrough3d} variant="outline" size="lg" className="mt-8">
              View the full 3D walkthrough <Arrow />
            </ButtonLink>
          ) : null}
        </div>
      </section>

      {/* ── the 1 million mandate ────────────────────────────────────────── */}
      <section className="border-b border-white/10 bg-meridian text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-brass">The 5-year goal</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">The 1 million mandate</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              In the next five years, we are committing to reaching 1,000,000 young people through
              transformational discipleship experiences, raising leaders who raise leaders.
            </p>
          </Reveal>
          <ol className="mt-12 grid gap-px bg-white/15 sm:grid-cols-3">
            {LEGACY_MANDATE_STEPS.map((step, index) => (
              <Reveal as="li" key={step.name} delay={index * 120} className="bg-meridian p-7">
                <p className="display text-6xl text-brass">{index + 1}</p>
                <h3 className="display mt-4 text-3xl">{step.name}</h3>
                <p className="mt-1 text-white/65">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── impact so far ────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Real lives. Eternal impact.</Eyebrow>
            <h2 className="display mt-4 max-w-4xl text-[clamp(2.25rem,6vw,4.5rem)]">
              Now we&apos;re building the home that multiplies the fruit
            </h2>
          </Reveal>
          <dl className="mt-12 grid grid-cols-2 gap-px bg-ink/12 lg:grid-cols-4">
            {LEGACY_IMPACT.map((stat, index) => (
              <Reveal as="div" key={stat.label} delay={index * 90} className="bg-bone p-6 sm:p-8">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="display text-[clamp(2.75rem,7vw,4.5rem)] text-brass">{stat.value}</dd>
                <dd className="mt-1 text-sm text-ink-70">{stat.label}</dd>
              </Reveal>
            ))}
          </dl>
          <Reveal as="figure" className="mt-10 border border-ink/12 bg-paper p-7 sm:p-10">
            <blockquote className="text-lg italic leading-relaxed text-ink-70">
              &ldquo;{LEGACY_INTERN_QUOTE.text}&rdquo;
            </blockquote>
            <figcaption className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-brass">
              {LEGACY_INTERN_QUOTE.name} &middot; {LEGACY_INTERN_QUOTE.role}
            </figcaption>
          </Reveal>
          {LEGACY_LINKS.testimoniesVideo ? (
            <ButtonLink href={LEGACY_LINKS.testimoniesVideo} variant="outline" size="lg" className="mt-8">
              Watch testimonies <Arrow />
            </ButtonLink>
          ) : null}
        </div>
      </section>

      {/* ── transparency ─────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-ink text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow className="text-brass">Transparency</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">
              The cost is {nairaShort(LEGACY_TOTAL_COST_NAIRA)}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              We are starting with a focused seed milestone to commence construction, then
              advancing step by step with consistent reporting.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            <div className="border border-white/15 p-7">
              <p className="eyebrow text-white/50">Estimated completion</p>
              <p className="display mt-2 text-4xl">{naira(LEGACY_TOTAL_COST_NAIRA)}</p>
            </div>
            <div className="border border-brass bg-brass p-7 text-ink">
              <p className="eyebrow text-ink/70">Current phase: seed goal</p>
              <p className="display mt-2 text-4xl">{naira(LEGACY_SEED_GOAL_NAIRA)}</p>
              <p className="mt-2 text-sm text-ink/75">Commencement of construction</p>
            </div>
            <div className="border border-white/15 p-7">
              <p className="eyebrow text-white/50">Construction &amp; phases</p>
              <ul className="mt-3 space-y-1.5">
                {LEGACY_PHASES.map((phase) => (
                  <li key={phase} className="flex gap-3 text-white/80">
                    <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 bg-brass" />
                    {phase}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── the covenant + the form ──────────────────────────────────────── */}
      <section id="partner" className="scroll-mt-20 border-b border-ink/12">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_480px]">
          <div>
            <Reveal>
              <Eyebrow>The 20/20/20 covenant</Eyebrow>
              <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">Become an Angel Partner</h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-70">
                Angel Partners commit at least ₦20,000 or $20 a month for five years to build
                Legacy Place and fuel the 1 million mandate. A covenant invitation, with grace for
                life&apos;s seasons.
              </p>
            </Reveal>
            <ol className="mt-10 space-y-3">
              {LEGACY_COVENANT_STEPS.map((step, index) => (
                <Reveal
                  as="li"
                  key={step.name}
                  delay={index * 100}
                  className="flex gap-5 border border-ink/12 bg-paper p-5"
                >
                  <span className="display text-4xl text-brass">{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{step.name}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-70">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>

            <Reveal className="mt-12">
              <Eyebrow>Founding 500 benefits</Eyebrow>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-70">
                As a founding Angel, you are not just a donor; you are a co-builder. We honour your
                sacrifice with these tokens of appreciation and access.
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {LEGACY_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex gap-3 text-[15px] leading-relaxed">
                    <span aria-hidden="true" className="text-brass">
                      &#10003;
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Panel className="p-6 sm:p-7">
              <Eyebrow>Start your covenant</Eyebrow>
              <h3 className="display mt-3 text-3xl">Choose your seed</h3>
              <div className="mt-6">
                <GiveForm />
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* ── questions ────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-bone">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">Frequently asked</h2>
          <div className="mt-10 max-w-3xl divide-y divide-ink/12 border-y border-ink/12">
            {LEGACY_FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                  {item.q}
                  <span aria-hidden="true" className="text-2xl text-brass transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[16px] leading-relaxed text-ink-70">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── close ────────────────────────────────────────────────────────── */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-24">
          <h2 className="display max-w-4xl text-[clamp(2.25rem,6vw,4.5rem)]">
            You may not go to the nations, but your giving can
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            This is your invitation to be part of a holy work. Build what God is birthing. Fuel a
            generation on fire for Jesus. Leave a legacy that echoes in eternity.
          </p>
          <div className="mt-9 flex flex-wrap gap-2.5">
            <ButtonLink href="#partner" variant="brass" size="lg">
              Become an Angel Partner <Arrow />
            </ButtonLink>
            <ButtonLink href={PARTNERSHIP_MAILTO} variant="inverse" size="lg">
              Talk to the partnership team
            </ButtonLink>
          </div>
          <p className="mt-10 border-t border-white/15 pt-6 text-sm text-white/50">
            Paying your own Fresh Fire camp fee? That goes through the{" "}
            <Link href="/camp/payment" className="font-semibold text-white underline underline-offset-4">
              camp payment page
            </Link>
            , so your balance and ticket update automatically.
          </p>
        </div>
      </section>
    </>
  );
}
