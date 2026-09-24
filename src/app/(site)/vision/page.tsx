import type { Metadata } from "next";
import { HillContours } from "@/components/site/hill-contours";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import {
  ABOUT,
  MANDATE,
  MANDATE_OBJECTIVE,
  PILLARS,
  SCRIPTURES,
  STRATEGY,
  VISION,
  VISION_SUPPORT,
  CHURCH,
} from "@/lib/church";

export const metadata: Metadata = {
  title: "Our vision",
  description:
    "Dominion House is a disciple-making movement raising kingdom leaders. Our vision, the 5D strategy, our mandate, and the seven pillars that form our culture.",
};

export default function VisionPage() {
  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12">
        <HillContours className="absolute inset-x-0 bottom-0 h-[80%] w-full text-meridian" lines={12} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow>{CHURCH.descriptor}</Eyebrow>
          <h1 className="display mt-5 max-w-5xl text-[clamp(2.75rem,9vw,7.5rem)]">
            A disciple-making movement
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-70">{ABOUT}</p>
        </div>
      </section>

      {/* ── vision ───────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-ink text-white">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[280px_1fr]">
          <Eyebrow className="text-brass lg:pt-3">Our vision</Eyebrow>
          <div>
            <p className="text-[clamp(1.375rem,3vw,2rem)] font-medium leading-[1.35]">{VISION}</p>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/60">
              {VISION_SUPPORT}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5D strategy ──────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow>Our mission, the 5D strategy</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">
            Discover · Develop · Deploy
            <br />
            Duplicate · Dominate
          </h2>

          <div className="mt-14 border-t border-ink/12">
            {STRATEGY.map((step) => (
              <div
                key={step.key}
                className="grid gap-x-10 gap-y-3 border-b border-ink/12 py-8 lg:grid-cols-[120px_260px_1fr] lg:items-baseline"
              >
                <p className="display text-4xl text-brass">{step.key}</p>
                <div>
                  <h3 className="display text-3xl">{step.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-ink-45">
                    {step.summary}
                  </p>
                </div>
                <div>
                  <p className="max-w-2xl text-[15px] leading-relaxed text-ink-70">{step.body}</p>
                  {"scripture" in step && step.scripture ? (
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-meridian">
                      {step.scripture}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── mandate ──────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-meridian text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow className="text-brass">Our mandate</Eyebrow>
          <p className="display mt-6 max-w-4xl text-[clamp(1.75rem,5vw,3.75rem)]">{MANDATE}</p>

          <figure className="mt-12 max-w-2xl border-l-2 border-brass pl-6">
            <blockquote className="text-lg leading-relaxed italic text-white/75">
              &ldquo;{CHURCH.mandateScripture.text}&rdquo;
            </blockquote>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass">
              {CHURCH.mandateScripture.reference}
            </figcaption>
          </figure>

          <p className="mt-12 max-w-3xl text-[15px] leading-relaxed text-white/60">
            {MANDATE_OBJECTIVE}
          </p>
        </div>
      </section>

      {/* ── seven pillars ────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow>Our culture</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">
            The seven pillars
            <br />
            of Dominion House
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-70">
            Culture is the invisible force that shapes the identity of a people. Programs may
            change, environments may shift, people may come and go, but culture is what makes a
            house remain a house.
          </p>

          <div className="mt-14 grid gap-px bg-ink/12 lg:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article key={pillar.number} className="flex flex-col bg-bone p-7 sm:p-9">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-sm font-semibold text-brass">
                    {pillar.number}
                  </span>
                  <div>
                    <h3 className="display text-4xl">{pillar.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-ink-45">
                      {pillar.subtitle}
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-[15px] leading-relaxed text-ink-70">{pillar.body}</p>

                <ul className="mt-6 space-y-2.5">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-70">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-meridian" />
                      {point}
                    </li>
                  ))}
                </ul>

                <p className="mt-auto pt-7 text-[15px] font-medium italic leading-relaxed text-ink">
                  &ldquo;{pillar.pull}&rdquo;
                </p>
              </article>
            ))}
          </div>

          <p className="mt-12 max-w-3xl text-lg leading-relaxed text-ink">
            These seven cultures are not activities; they are the essence of who we are. This is our
            identity. This is our atmosphere. This is our spiritual DNA. This is Dominion House.
          </p>
        </div>
      </section>

      {/* ── scriptures ───────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow>Foundational scriptures</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">What we stand on</h2>

          <div className="mt-12 grid gap-px bg-ink/12 lg:grid-cols-3">
            {SCRIPTURES.map((scripture) => (
              <figure key={scripture.reference} className="bg-bone p-7 sm:p-8">
                <figcaption className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass">
                  {scripture.reference} ({scripture.version})
                </figcaption>
                <blockquote className="mt-4 text-[15px] italic leading-relaxed text-ink-70">
                  &ldquo;{scripture.text}&rdquo;
                </blockquote>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── close ────────────────────────────────────────────────────────── */}
      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow className="text-brass">Next step</Eyebrow>
            <h2 className="display mt-4 max-w-xl text-[clamp(2.25rem,6vw,4.5rem)]">
              Reading about it is not the same as being in the room
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/locations" variant="brass" size="lg">
              Find a campus <Arrow />
            </ButtonLink>
            <ButtonLink href="/camp" variant="inverse" size="lg">
              Fresh Fire 2027
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
