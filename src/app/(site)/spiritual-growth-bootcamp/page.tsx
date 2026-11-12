import type { Metadata } from "next";
import { HillContours } from "@/components/site/hill-contours";
import { NumberedCardsCarousel } from "@/components/site/house-cards";
import { Reveal } from "@/components/site/reveal";
import { LightLines, Magnetic, StaggerLetters, Timeline } from "@/components/site/motion";
import { Arrow, ButtonLink, Eyebrow } from "@/components/ui";
import { SgbRegistrationForm } from "./registration-form";
import { MobileRegisterButton } from "./mobile-register-button";

const description =
  "The Spiritual Growth Bootcamp (SGB) is a transformative one-week intensive designed to awaken spiritual hunger, establish strong spiritual foundations, and set you on a purposeful journey of spiritual growth and destiny fulfilment.";

export const metadata: Metadata = {
  alternates: { canonical: "/spiritual-growth-bootcamp" },
  title: { absolute: "Spiritual Growth Bootcamp · Dominion House" },
  description,
  openGraph: {
    title: "Spiritual Growth Bootcamp · Dominion House",
    description,
    type: "website",
    images: [{ url: "/video/camp-prayer.jpg", alt: "Prayer at a Dominion House gathering" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/video/camp-prayer.jpg"],
    title: "Spiritual Growth Bootcamp · Dominion House",
    description,
  },
};

/**
 * Dates, time and venue for the hero. Add them as they're announced, e.g.
 * { label: "Dates", value: "1–7 December" }; the row stays hidden while empty
 * so the page never shows a placeholder.
 */
const FACTS: { label: string; value: string; accent?: boolean }[] = [];

const EXPECTATIONS = [
  {
    title: "Intensive Prayer Sessions",
    text: "Develop a deeper prayer life and cultivate consistency in fellowship with God.",
  },
  {
    title: "In-depth Study of God's Word",
    text: "Build a stronger understanding of Scripture and establish your life on God's Word.",
  },
  {
    title: "Meditation",
    text: "Learn to engage deeply with God's Word, allowing it to shape your thoughts, convictions, and daily living.",
  },
  {
    title: "Accountability and Mentorship",
    text: "Receive guidance, encouragement, and support as you take responsibility for your spiritual growth.",
  },
  {
    title: "Community and Shared Growth Experiences",
    text: "Connect with others who are committed to growing spiritually and pursuing God intentionally.",
  },
  {
    title: "Practical Spiritual Disciplines",
    text: "Establish consistent habits and a clear personal growth plan to sustain your spiritual journey beyond the Bootcamp.",
  },
] as const;

const JOIN_STEPS = [
  {
    title: "Register",
    description: "Complete the Bootcamp registration form with the required details.",
  },
  {
    title: "Get Confirmed",
    description: "Receive your registration confirmation and access information.",
  },
  {
    title: "Join the Community",
    description: "Become part of the Bootcamp community where you'll connect with other participants and receive important updates.",
  },
  {
    title: "Follow the Schedule",
    description: "Participate in the daily sessions, activities, and accountability exercises.",
  },
  {
    title: "Complete the Journey",
    description: "Give yourself fully to the one-week experience and take intentional steps towards building a consistent spiritual life.",
  },
] as const;

const WEEK = [
  {
    time: "6:00 AM",
    title: "Morning Sessions",
    description: "Start each day with intentional encounters through prayer and the study of God's Word.",
  },
  {
    time: "",
    title: "Prayer and Bible Study",
    description: "Dedicated sessions to deepen your fellowship with God and strengthen your understanding of Scripture.",
  },
  {
    time: "",
    title: "Accountability Check-ins",
    description: "Daily opportunities to review your progress, stay committed, and remain intentional about your growth.",
  },
  {
    time: "8:00 PM",
    title: "Special Sessions",
    description: "Participate in focused teachings, spiritual exercises, and other specially curated sessions.",
  },
  {
    time: "",
    title: "Fruit Fast",
    description: "Take part in the designated fasting period as you devote yourself to prayer and spiritual growth.",
  },
] as const;

export default function SpiritualGrowthBootcampPage() {
  return (
    <>
      <section id="sgb-hero" className="relative overflow-hidden border-b border-ink/12 bg-ink text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow className="rise-in text-brass">One-week intensive</Eyebrow>
          <h1 className="display mt-5 max-w-5xl text-[clamp(2.5rem,9vw,7.5rem)]">
            <StaggerLetters text="Spiritual Growth Bootcamp" start={120} />
          </h1>
          <p
            className="rise-in mt-8 max-w-2xl text-lg leading-relaxed text-white/70"
            style={{ animationDelay: "260ms" }}
          >
            {description}
          </p>
          <div className="rise-in mt-8 flex flex-wrap gap-2.5" style={{ animationDelay: "340ms" }}>
            <Magnetic>
              <ButtonLink href="#register" variant="brass" size="lg" className="shine">
                Register for the Bootcamp <Arrow />
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="#schedule" variant="inverse" size="lg">
              See the schedule
            </ButtonLink>
          </div>
          {FACTS.length > 0 ? (
            <Reveal
              as="dl"
              delay={150}
              className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-white/15 pt-8 sm:grid-cols-3"
            >
              {FACTS.map((fact) => (
                <Fact key={fact.label} label={fact.label} value={fact.value} accent={fact.accent} />
              ))}
            </Reveal>
          ) : null}
        </div>
      </section>

      <section className="border-b border-ink/12 bg-brass-soft text-ink">
        <Reveal
          as="div"
          className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[280px_1fr]"
        >
          <h2 className="eyebrow text-ink-45 lg:pt-3">About the Bootcamp</h2>
          <LightLines>
            <p className="text-[clamp(1.375rem,3vw,2rem)] font-medium leading-[1.35]">
              Through intentional sessions of prayer, in-depth study of God&apos;s Word, meditation,
              accountability, mentorship, and practical spiritual disciplines, you will be equipped
              to build a consistent walk with God, break free from spiritual complacency, and
              develop habits that sustain lifelong spiritual growth.
            </p>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-ink-70">
              This is more than a week of spiritual activities. It is an opportunity to reset your
              spiritual life, cultivate discipline, deepen your relationship with God, and build a
              personal growth structure that continues long after the Bootcamp.
            </p>
            <figure className="mt-10 max-w-3xl border-l-2 border-brass pl-6">
              <blockquote className="text-lg leading-relaxed italic text-ink-70">
                &ldquo;Our goal is to move you from merely desiring spiritual growth to actively
                pursuing it with intentionality, discipline, and purpose.&rdquo;
              </blockquote>
            </figure>
          </LightLines>
        </Reveal>
      </section>

      <section className="border-b border-ink/12 bg-bone">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>What to expect</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">A week of intentional growth</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-70">
              Your week at the Spiritual Growth Bootcamp will be filled with intentional
              experiences designed to strengthen your spiritual life and establish a sustainable
              growth culture.
            </p>
          </Reveal>
          <NumberedCardsCarousel
            label="What to expect at the Spiritual Growth Bootcamp"
            cardLabel="Expect"
            items={EXPECTATIONS}
          />
        </div>
      </section>

      <section className="border-b border-ink/12">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>How to join</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.25rem,7vw,5rem)]">Take your next step</h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-70">
              Getting started is simple! Take the following steps to become part of the Spiritual
              Growth Bootcamp:
            </p>
          </Reveal>
          <ol className="mt-12 grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-5">
            {JOIN_STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 80} className="bg-bone p-6">
                <p className="display text-4xl text-brass">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-70">{step.description}</p>
              </Reveal>
            ))}
          </ol>
          <p className="mt-8 text-lg font-medium">Your journey begins with registration. Take that first step today!</p>
        </div>
      </section>

      <section className="border-b border-ink/12" id="schedule">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <Eyebrow>The schedule</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2.5rem,7vw,5rem)]">Here&apos;s what your week will look like</h2>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-70">
              One week. Seven days of intentional spiritual pursuit. A structured experience
              designed to help you develop consistency, deepen your walk with God, and establish a
              sustainable rhythm of spiritual growth.
            </p>
          </Reveal>

          <Reveal className="mt-12">
            <Timeline className="border-t border-ink/12">
              {WEEK.map((item) => (
                <li
                  key={item.title}
                  className="grid gap-x-6 gap-y-1 border-b border-ink/12 py-5 sm:grid-cols-[110px_1fr]"
                >
                  <p
                    className={
                      item.time
                        ? "font-mono text-sm font-semibold tracking-wide text-ink"
                        : "font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45 sm:pt-0.5"
                    }
                  >
                    {item.time || "During the week"}
                  </p>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-45">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </Timeline>
          </Reveal>
          <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-ink-70">
            Participants are expected to follow the schedule, remain actively engaged, and approach
            every session with a heart ready to learn and grow.
          </p>
        </div>
      </section>

      <section id="register" className="scroll-mt-24 border-b border-ink/12 bg-brass-soft">
        <div className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="mx-auto max-w-xl border border-ink/12 bg-paper p-6 sm:p-7">
            <Eyebrow>Registration</Eyebrow>
            <h2 className="display mt-3 text-3xl">Register for the Spiritual Growth Bootcamp</h2>
            <div className="mt-6">
              <SgbRegistrationForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-sky text-ink">
        <Reveal
          as="div"
          className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <Eyebrow className="text-brass">Next step</Eyebrow>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2.25rem,6vw,4.5rem)]">
              DON&apos;T JUST DESIRE GROWTH. TAKE INTENTIONAL STEPS TOWARDS IT.
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-70">
              Spiritual growth doesn&apos;t happen by wishes alone. It requires intentional pursuit,
              consistency, discipline, and a willingness to keep growing. This is your opportunity
              to move beyond spiritual complacency, establish strong foundations, and become more
              intentional about your walk with God. Don&apos;t settle for wanting a deeper
              relationship with God. Take the steps to build one. Your spiritual growth journey
              begins with a decision. Make that decision today.
            </p>
          </div>
          <Magnetic className="shrink-0">
            <ButtonLink href="#register" variant="sky" size="lg" className="shine">
              Register for the Bootcamp <Arrow />
            </ButtonLink>
          </Magnetic>
        </Reveal>
      </section>

      <MobileRegisterButton />
    </>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="eyebrow opacity-60">{label}</dt>
      <dd
        className={`display mt-2 hyphens-auto break-words text-2xl sm:text-3xl ${accent ? "text-brass" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
