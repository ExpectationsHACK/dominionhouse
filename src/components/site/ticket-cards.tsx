import { formatKobo } from "@/lib/money";
import { cn } from "@/lib/utils";

type Tier = {
  id: string;
  label: string;
  description: string | null;
  amountKobo: number;
};

/**
 * Ticket prices as stat cards: the price large and light at the top left, a
 * small caps line beneath it, the ticket name at the bottom, and a run of soft
 * vertical bars down the right that fade in from the top.
 *
 * Four treatments in the house palette (light blue, black, logo blue, white),
 * so a row never repeats a neighbour.
 */
const LOOKS = [
  { card: "bg-brass-soft text-ink", bar: "#0b0b0c", muted: "text-ink-70" },
  { card: "bg-ink text-white", bar: "#21a1ff", muted: "text-white/65" },
  { card: "bg-brass text-ink", bar: "#0b0b0c", muted: "text-ink/70" },
  { card: "border border-ink/12 bg-white text-ink", bar: "#21a1ff", muted: "text-ink-70" },
] as const;

/** Bar heights as a share of the panel, staggered like the reference. Deterministic. */
const BAR_HEIGHTS = [
  [92, 58, 100, 74, 100, 66, 84, 100],
  [66, 100, 80, 100, 62, 92, 100, 74],
  [100, 72, 96, 60, 100, 82, 68, 100],
  [78, 100, 64, 92, 100, 70, 100, 86],
];

function Bars({ color, seed }: { color: string; seed: number }) {
  const heights = BAR_HEIGHTS[seed % BAR_HEIGHTS.length];

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-7 right-7 top-7 flex w-[32%] items-end justify-between"
    >
      {heights.map((height, index) => (
        <span
          key={index}
          className="w-[5px] sm:w-[6px]"
          style={{
            height: `${height}%`,
            background: `linear-gradient(to bottom, transparent 0%, ${color} 38%, ${color} 100%)`,
          }}
        />
      ))}
    </div>
  );
}

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

        return (
          <li
            key={tier.id}
            className={cn(
              "relative flex min-h-[19rem] flex-col justify-between overflow-hidden rounded-[1.25rem] p-7 sm:p-8",
              look.card,
            )}
          >
            <Bars color={look.bar} seed={index} />

            <div className="relative max-w-[58%]">
              <p className="display text-[clamp(2.5rem,5.5vw,4rem)] leading-none">
                {formatKobo(tier.amountKobo)}
              </p>
              {holdFromKobo !== null ? (
                <p className={cn("mt-3 font-mono text-[10px] uppercase tracking-[0.14em]", look.muted)}>
                  From {formatKobo(Math.min(holdFromKobo, tier.amountKobo))} to hold
                </p>
              ) : null}
            </div>

            <div className="relative max-w-[60%]">
              <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-light leading-tight">{tier.label}</h3>
              {tier.description ? (
                <p className={cn("mt-2 text-sm leading-relaxed", look.muted)}>{tier.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
