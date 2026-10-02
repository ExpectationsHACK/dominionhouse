import type { Metadata } from "next";
import Image from "next/image";
import { HillContours } from "@/components/site/hill-contours";
import { BeliefCarousel, PillarCarousel, ScriptureCards } from "@/components/site/house-cards";
import { Reveal } from "@/components/site/reveal";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import {
  ABOUT,
  CHURCH,
  MANDATE,
  MANDATE_OBJECTIVE,
  SENIOR_PASTOR_BIOS,
  VISION,
  VISION_SUPPORT,
} from "@/lib/church";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Who Dominion House is: our vision, our mandate, our foundational scriptures, our culture, and what we believe.",
};

export default function AboutPage() {
  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12 bg-ink text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow className="rise-in text-brass">About us</Eyebrow>
          <h1
            className="display rise-in mt-5 max-w-5xl text-[clamp(2.5rem,9vw,7.5rem)]"
            style={{ animationDelay: "120ms" }}
          >
            A new frontier church
          </h1>
          <p
            className="rise-in mt-8 max-w-2xl text-lg leading-relaxed text-white/70"
            style={{ animationDelay: "260ms" }}
          >
            {ABOUT}
          </p>
          <p
            className="rise-in mt-4 max-w-2xl text-lg font-medium leading-relaxed text-brass"
            style={{ animationDelay: "340ms" }}
          >
            We are a missional church, the church that never sleeps.
          </p>
        </div>
      </section>

      {/* ── vision ───────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-brass-soft text-ink">
        <Reveal as="div" className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[280px_1fr]">
          <Eyebrow className="lg:pt-3">Our vision</Eyebrow>
          <div>
            <p className="text-[clamp(1.375rem,3vw,2rem)] font-medium leading-[1.35]">{VISION}</p>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-70">{VISION_SUPPORT}</p>
          </div>
        </Reveal>
      </section>

      {/* ── mandate ──────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-meridian text-white">
        <Reveal as="div" className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Eyebrow className="text-brass">Our mandate</Eyebrow>
          <p className="display mt-6 max-w-4xl text-[clamp(1.75rem,5vw,3.75rem)]">{MANDATE}</p>
          <p className="mt-6 max-w-2xl text-lg font-medium text-brass">
            The church that never sleeps.
          </p>

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
        </Reveal>
      </section>

      {/* ── foundational scriptures ──────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Our foundational scriptures</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">What we stand on</h2>
          </Reveal>

          <ScriptureCards />
        </div>
      </section>

      {/* ── culture, seven pillars ───────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Our culture</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">
              The seven pillars
              <br />
              of Dominion House
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-70">
              Culture is the invisible force that shapes the identity of a people, the unwritten
              code that governs behaviour, decisions, priorities and expression. Programs may
              change, environments may shift, people may come and go, but culture is what makes a
              house remain a house. Our culture is the reason we do what we do.
            </p>
          </Reveal>

          <PillarCarousel />

          <p className="mt-12 max-w-3xl text-lg leading-relaxed text-ink">
            These seven cultures are not activities, they are the essence of who we are. This is
            our identity. This is our atmosphere. This is our spiritual DNA. This is Dominion
            House.
          </p>
        </div>
      </section>

      {/* ── what we believe ──────────────────────────────────────────────── */}
      <section className="border-b border-ink/12 bg-bone">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Doctrine</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">What we believe</h2>
          </Reveal>

          <BeliefCarousel />
        </div>
      </section>

      {/* ── senior pastors ───────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>Leadership</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">Meet our Visionaries</h2>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {SENIOR_PASTOR_BIOS.map((pastor, index) => (
              <Reveal
                as="article"
                key={pastor.name}
                delay={index * 100}
                className="card-lift border border-ink/15 bg-paper p-5 sm:p-7"
              >
                <div className="flex items-start gap-5">
                  <Image
                    src={pastor.imageUrl}
                    alt={pastor.name}
                    width={160}
                    height={190}
                    className="h-32 w-28 shrink-0 border border-ink/12 object-cover sm:h-40 sm:w-32"
                  />
                  <div className="min-w-0 pt-1">
                    <h3 className="display text-2xl leading-[1.05] sm:text-3xl">{pastor.name}</h3>
                    {/* "Visionary / Founder" as a two-tone tag: the calling in the
                        house blue, the role beside it in black. */}
                    <p className="mt-3 inline-flex items-stretch font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">
                      {pastor.title.split(" / ").map((part, partIndex) => (
                        <span
                          key={part}
                          className={
                            partIndex === 0 ? "bg-brass px-3 py-1.5 text-ink" : "bg-ink px-3 py-1.5 text-white"
                          }
                        >
                          {part}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-dashed border-ink/25 pt-5">
                  <p className="text-[15px] leading-relaxed text-ink-70">{pastor.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── close ────────────────────────────────────────────────────────── */}
      <section className="bg-ink text-white">
        <Reveal
          as="div"
          className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <Eyebrow className="text-brass">Next step</Eyebrow>
            <h2 className="display mt-4 max-w-xl text-[clamp(2.25rem,6vw,4.5rem)]">
              Reading about it is not the same as being in the room
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href="/locations" variant="brass" size="lg">
              Find a lighthouse <Arrow />
            </ButtonLink>
            <ButtonLink href="/camp" variant="inverse" size="lg">
              Fresh Fire 2027
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
