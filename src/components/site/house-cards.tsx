import { Arcs, ARC_VARIANTS, BODY_TONE, CARD, REGION_TONE } from "@/components/site/arc-card";
import { CardCarousel } from "@/components/site/card-carousel";
import { Reveal } from "@/components/site/reveal";
import { PILLARS, SCRIPTURES, WHAT_WE_BELIEVE } from "@/lib/church";
import { cn } from "@/lib/utils";

/**
 * The house's own content as cards, shared by the About and Vision pages so
 * the two never drift apart: the seven pillars and what we believe as
 * carousels, the foundational scriptures as a row of cards.
 */

const BLUE_GRADIENT = "linear-gradient(180deg,#21a1ff 0%,#21a1ff 40%,#0b0b0c 135%)";

/** The seven pillars, one tall card each, cycling the three arc treatments. */
export function PillarCarousel({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <CardCarousel label="The seven pillars of Dominion House" tone={tone} className="mt-12">
      {PILLARS.map((pillar, index) => {
        const variant = ARC_VARIANTS[index % ARC_VARIANTS.length];
        return (
          <Reveal
            as="article"
            key={pillar.number}
            delay={(index % 3) * 90}
            className={cn(
              "card-lift relative flex w-[84vw] flex-col overflow-hidden sm:w-[380px] lg:w-[400px]",
              CARD[variant],
            )}
            style={variant === "blue" ? { background: BLUE_GRADIENT } : undefined}
          >
            <Arcs variant={variant} seed={index} />
            <div className="flex flex-1 flex-col p-6 pt-4 sm:p-7 sm:pt-5">
              <p className={cn("font-mono text-sm font-semibold", REGION_TONE[variant])}>
                {pillar.number}
              </p>
              <h3 className="display mt-2 text-4xl">{pillar.name}</h3>
              <p className={cn("mt-1 text-xs uppercase tracking-[0.08em]", REGION_TONE[variant])}>
                {pillar.subtitle}
              </p>

              <p className={cn("mt-5 text-[15px] leading-relaxed", BODY_TONE[variant])}>
                {pillar.body}
              </p>

              <ul className="mt-5 space-y-2">
                {pillar.points.map((point) => (
                  <li key={point} className={cn("flex gap-3 text-sm leading-relaxed", BODY_TONE[variant])}>
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-current" />
                    {point}
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-6 text-[15px] font-medium italic leading-relaxed">
                &ldquo;{pillar.pull}&rdquo;
              </p>
            </div>
          </Reveal>
        );
      })}
    </CardCarousel>
  );
}

/** Light to deep, the same progression the 5D cards use. */
const BELIEF_SHADES = [
  { bg: "#d3eaff", text: "text-ink", number: "text-[#1170c9]" },
  { bg: "#a8dbff", text: "text-ink", number: "text-[#0a3d75]" },
  { bg: "#5cbcff", text: "text-ink", number: "text-white" },
  { bg: "#21a1ff", text: "text-ink", number: "text-white" },
  { bg: "#1170c9", text: "text-white", number: "text-[#a8dbff]" },
  { bg: "#0a3d75", text: "text-white", number: "text-brass" },
  { bg: "#0b0b0c", text: "text-white", number: "text-brass" },
] as const;

/** What we believe, numbered cards stepping through the blues. */
export function BeliefCarousel({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <CardCarousel label="What we believe" tone={tone} className="mt-12">
      {WHAT_WE_BELIEVE.map((belief, index) => {
        const shade = BELIEF_SHADES[index % BELIEF_SHADES.length];
        return (
          <Reveal
            as="article"
            key={belief}
            delay={(index % 3) * 80}
            className={cn(
              "card-lift flex min-h-[17rem] w-[72vw] flex-col p-6 sm:w-[300px] sm:p-7",
              shade.text,
            )}
            style={{ backgroundColor: shade.bg }}
          >
            <p className={cn("display text-6xl leading-none", shade.number)}>
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-auto pt-8 text-[15px] font-medium leading-relaxed">{belief}</p>
          </Reveal>
        );
      })}
    </CardCarousel>
  );
}

/** The foundational scriptures as cards, a beat apart as they arrive. */
export function ScriptureCards() {
  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-3">
      {SCRIPTURES.map((scripture, index) => (
        <Reveal
          as="figure"
          key={scripture.reference}
          delay={index * 110}
          className={cn(
            "card-lift relative flex flex-col overflow-hidden p-7 sm:p-8",
            index === 1 ? "bg-ink text-white" : "border border-ink/12 bg-paper text-ink",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "display pointer-events-none absolute -right-2 -top-8 text-[9rem] leading-none",
              index === 1 ? "text-brass/30" : "text-brass/25",
            )}
          >
            &ldquo;
          </span>
          <blockquote
            className={cn(
              "relative text-[15px] italic leading-relaxed",
              index === 1 ? "text-white/80" : "text-ink-70",
            )}
          >
            &ldquo;{scripture.text}&rdquo;
          </blockquote>
          <figcaption className="relative mt-auto pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-brass">
            {scripture.reference} ({scripture.version})
          </figcaption>
        </Reveal>
      ))}
    </div>
  );
}
