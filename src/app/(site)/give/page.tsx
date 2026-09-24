import type { Metadata } from "next";
import { HillContours } from "@/components/site/hill-contours";
import { Arrow, ButtonLink, Eyebrow, Notice, Panel } from "@/components/ui";
import { CONTACT_EMAIL, PILLARS } from "@/lib/church";
import { formatKobo } from "@/lib/money";
import { getActiveCamp } from "@/lib/camp";

export const metadata: Metadata = {
  title: "Become an Angel Partner",
  description:
    "Partner with Dominion House: sponsor a missionary, give to the Legacy Project, or send someone to Fresh Fire Camp Meeting 2027.",
};

export const revalidate = 60;

const GIVING = PILLARS.find((pillar) => pillar.name === "Giving")!;

const WAYS = [
  {
    name: "Weekly offerings",
    body: "Given at your lighthouse each week. This is the ordinary, faithful giving that carries the running of the house.",
  },
  {
    name: "Sacrificial giving",
    body: "Given beyond the ordinary, at seasons when God asks for more than convenience. It is always a decision, never a pressure.",
  },
  {
    name: "Monthly partnership",
    body: "A standing monthly commitment to the vision. Partnership is what lets the house plan beyond the next Sunday.",
  },
  {
    name: "Giving to leaders and pastors",
    body: "Honouring those who labour in the Word and carry spiritual responsibility for the house.",
  },
] as const;

export default async function GivePage() {
  const camp = await getActiveCamp();
  const cheapestKobo = camp?.priceTiers.length
    ? Math.min(...camp.priceTiers.map((tier) => tier.amountKobo))
    : null;

  const CAUSES = [
    {
      number: "01",
      name: "Sponsor a missionary",
      body: "Keep a sent one on the field. Partnering with a missionary covers their upkeep, travel and the work of planting where there is no church yet.",
      note: "We are a sending church, not a sitting one.",
    },
    {
      number: "02",
      name: "Give to the Legacy Project",
      body: "The building work, a permanent home for the house and the ministries it carries. Legacy giving is what the next generation inherits.",
      note: "Built once, used for decades.",
    },
    {
      number: "03",
      name: "Sponsor a person to camp",
      body: `Send someone to Fresh Fire Camp Meeting 2027 who could not otherwise go. ${
        cheapestKobo ? `A full place starts at ${formatKobo(cheapestKobo)}.` : ""
      } Nobody misses camp over money.`,
      note: "Given quietly, the person is never told who paid.",
    },
  ];

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12 bg-meridian text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow className="text-brass">Kingdom stewardship</Eyebrow>
          <h1 className="display mt-5 text-[clamp(2.5rem,9vw,7.5rem)]">
            Become an
            <br />
            Angel Partner
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            We give because we love God, honour God, trust God, and partner with His Kingdom. We do
            not manipulate people to give, we teach and disciple them into generosity.
          </p>
        </div>
      </section>

      {/* ── the three causes ─────────────────────────────────────────────── */}
      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24">
          <Eyebrow>Where a partner can give</Eyebrow>
          <h2 className="display mt-4 text-[clamp(2.25rem,6vw,4.5rem)]">Three ways to carry it</h2>

          <div className="mt-14 grid gap-px bg-ink/12 lg:grid-cols-3">
            {CAUSES.map((cause) => (
              <article key={cause.number} className="flex flex-col bg-bone p-7 sm:p-9">
                <p className="font-mono text-sm font-semibold text-brass">{cause.number}</p>
                <h3 className="display mt-4 text-3xl">{cause.name}</h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink-70">{cause.body}</p>
                <p className="mt-auto pt-7 text-sm italic leading-relaxed text-meridian">
                  {cause.note}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink-45">
            Put the cause in your transfer reference, &ldquo;Ade Bello, camp sponsorship&rdquo;,
            and it lands in the right place. Without a reference it goes to the general fund.
          </p>
        </div>
      </section>

      {/* ── giving culture + details ─────────────────────────────────────── */}
      <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_420px]">
        <div>
          <Eyebrow>Four ways we give</Eyebrow>
          <h2 className="display mt-3 text-[clamp(2.25rem,6vw,4rem)]">Our giving culture</h2>

          <div className="mt-10 border-t border-ink/12">
            {WAYS.map((way) => (
              <div key={way.name} className="border-b border-ink/12 py-6">
                <h3 className="text-lg font-semibold">{way.name}</h3>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-70">{way.body}</p>
              </div>
            ))}
          </div>

          <figure className="mt-12 max-w-2xl border-l-2 border-brass pl-6">
            <blockquote className="text-lg italic leading-relaxed text-ink-70">
              &ldquo;Let him who stole steal no longer, but rather let him labor, working with his
              hands what is good, that he may have something to give him who has need.&rdquo;
            </blockquote>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-meridian">
              Ephesians 4:28 (NKJV)
            </figcaption>
          </figure>

          <p className="mt-10 max-w-xl text-lg font-medium leading-relaxed text-ink">
            &ldquo;{GIVING.pull} Stewardship is the sign of kingdom responsibility.&rdquo;
          </p>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel className="p-6 sm:p-7">
            <Eyebrow>How to give</Eyebrow>
            <h2 className="display mt-3 text-3xl">Bank details</h2>

            <Notice tone="warn" className="mt-5">
              Account details haven&apos;t been supplied yet. Send them over and they&apos;ll go
              here, until then this page points people to the lighthouse office, which is safer than
              showing a number nobody has verified.
            </Notice>

            <div className="mt-6 border-t border-ink/12 pt-5">
              <p className="eyebrow text-ink-45">In the meantime</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-70">
                Give at your Lighthouse, or contact the church office and they will confirm
                the current giving details.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-block break-all text-sm font-semibold underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </Panel>

          <div className="mt-4 border border-ink/12 bg-paper p-6">
            <Eyebrow>Paying your own camp fee?</Eyebrow>
            <p className="mt-3 text-sm leading-relaxed text-ink-70">
              Camp fees are separate from partnership and go through the camp payment page, so your
              balance updates and your ticket is issued automatically.
            </p>
            <ButtonLink href="/camp/payment" variant="outline" size="sm" className="mt-4">
              Camp payment <Arrow />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
