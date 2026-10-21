import type { AgeCategory } from "@/generated/prisma/enums";
import { WipeIn } from "@/components/site/motion";
import { formatKobo } from "@/lib/money";
import { cn } from "@/lib/utils";

type Tier = {
  id: string;
  category: AgeCategory;
  label: string;
  description: string | null;
  amountKobo: number;
};

/**
 * Ticket prices as wide cards: a photo of who the ticket is for across the
 * left half, the card's own colour fading over it, and the price and ticket
 * on the right.
 *
 * Four treatments in the house palette (light blue, black, house blue,
 * white), so a row never repeats a neighbour. `fade` is the card colour the
 * photo melts into.
 */
const LOOKS = [
  { card: "bg-brass-soft text-ink", fade: "var(--color-brass-soft)", muted: "text-ink-70" },
  { card: "bg-ink text-white", fade: "var(--color-ink)", muted: "text-white/70" },
  { card: "bg-brass text-white", fade: "var(--color-brass)", muted: "text-white/80" },
  { card: "border border-ink/12 bg-white text-ink", fade: "#ffffff", muted: "text-ink-70" },
] as const;

/** Who each ticket is for, in photos from the house. */
const PHOTOS: Record<AgeCategory, { src: string; alt: string }> = {
  ADULT: { src: "/tickets/adult.jpg", alt: "A smiling young man in a shirt and tie" },
  STUDENT: { src: "/tickets/campus.jpg", alt: "A student on her university campus" },
  TEEN: { src: "/tickets/teen.jpg", alt: "Two smiling teenage girls" },
  CHILD: { src: "/tickets/children.jpg", alt: "Two smiling children" },
};

export function TicketCards({
  tiers,
  holdFromKobo,
}: {
  tiers: readonly Tier[];
  /** When set, each card notes the smallest first payment that holds a place. */
  holdFromKobo: number | null;
}) {
  return (
    <ul className="mt-14 grid gap-4 sm:grid-cols-2">
      {tiers.map((tier, index) => {
        const look = LOOKS[index % LOOKS.length];
        const photo = PHOTOS[tier.category];

        return (
          <li
            key={tier.id}
            className={cn(
              "card-lift card-glow relative flex min-h-[10.5rem] overflow-hidden rounded-[1.25rem] sm:min-h-[13rem]",
              look.card,
            )}
          >
            {/* The photo across the left half, face at its centre (the files are
                cropped that way), the card colour fading over its outer half. */}
            <WipeIn className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- local, pre-sized */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-center"
              />
            </WipeIn>
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent 0%, transparent 25%, ${look.fade} 50%, ${look.fade} 100%)`,
              }}
            />

            <div className="relative ml-[48%] flex flex-1 flex-col justify-between gap-4 py-5 pl-2 pr-5 sm:py-6 sm:pr-7">
              <div>
                <p className="display text-[clamp(1.75rem,3.6vw,2.75rem)] leading-none">
                  {formatKobo(tier.amountKobo)}
                </p>
                {holdFromKobo !== null ? (
                  <p className={cn("mt-2 font-mono text-[10px] uppercase tracking-[0.14em]", look.muted)}>
                    From {formatKobo(Math.min(holdFromKobo, tier.amountKobo))} to hold
                  </p>
                ) : null}
              </div>

              <div>
                <h3 className="text-[clamp(1.2rem,2.2vw,1.6rem)] font-light leading-tight">{tier.label}</h3>
                {tier.description ? (
                  <p className={cn("mt-1.5 text-[13px] leading-snug sm:text-sm sm:leading-relaxed", look.muted)}>
                    {tier.description}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
