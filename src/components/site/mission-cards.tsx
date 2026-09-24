import { cn } from "@/lib/utils";

type Step = {
  key: string;
  name: string;
  summary: string;
  body: string;
  scripture?: string;
};

/**
 * The mission, D1 to D5, as tall portrait cards.
 *
 * Two treatments (black and logo blue) so the row has rhythm
 * without leaving the house palette. Each card carries a block of squares that
 * dissolves as it moves away from the edge, drawn as SVG so it stays sharp and
 * is identical on server and client.
 */

const VARIANTS = ["dark", "dark", "blue", "dark", "dark"] as const;
type Variant = (typeof VARIANTS)[number];

const CARD: Record<Variant, string> = {
  dark: "bg-ink text-white",
  blue: "text-white",
};

const KEY_TONE: Record<Variant, string> = {
  dark: "text-brass",
  blue: "text-white/80",
};

const PIXEL_TONE: Record<Variant, string> = {
  dark: "text-brass",
  blue: "text-white",
};

const BODY_TONE: Record<Variant, string> = {
  dark: "text-white/70",
  blue: "text-white/85",
};

const SUMMARY_TONE: Record<Variant, string> = {
  dark: "text-white/45",
  blue: "text-white/70",
};

const COLS = 10;
const ROWS = 6;
const CELL = 20;

/** A small deterministic hash in 0…1, so the pattern never differs between renders. */
function noise(row: number, col: number, seed: number) {
  const value = Math.sin(row * 12.9898 + col * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function PixelDissolve({ seed, className }: { seed: number; className?: string }) {
  const squares: { x: number; y: number; opacity: number }[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // Checkerboard, thinning out row by row so the block fades into the card.
      const checker = (row + col) % 2 === 0;
      const survives = noise(row, col, seed) > row / (ROWS + 1);
      if (row === 0 ? true : checker && survives) {
        squares.push({
          x: col * CELL + 2,
          y: row * CELL + 2,
          opacity: row === 0 ? 1 : 1 - row / (ROWS + 1),
        });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      aria-hidden="true"
      className={cn("block w-full", className)}
      fill="currentColor"
      preserveAspectRatio="xMidYMin slice"
    >
      {squares.map((square) => (
        <rect
          key={`${square.x}-${square.y}`}
          x={square.x}
          y={square.y}
          width={CELL - 4}
          height={CELL - 4}
          opacity={square.opacity}
        />
      ))}
    </svg>
  );
}

export function MissionCards({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {steps.map((step, index) => {
        const variant = VARIANTS[index % VARIANTS.length];

        return (
          <li
            key={step.key}
            className={cn(
              "relative flex min-h-[30rem] flex-col overflow-hidden xl:min-h-[36rem]",
              // With two columns the fifth card would sit alone, let it span.
              index === steps.length - 1 && steps.length % 2 === 1 && "sm:col-span-2 xl:col-span-1",
              CARD[variant],
            )}
            style={
              variant === "blue"
                ? { background: "linear-gradient(180deg,#21a1ff 0%,#21a1ff 32%,#0b0b0c 100%)" }
                : undefined
            }
          >
            {/* Capped so a card that spans two columns doesn't blow the squares up. */}
            <div className="w-full max-w-[20rem]">
              <PixelDissolve seed={index + 1} className={PIXEL_TONE[variant]} />
            </div>

            <div className="flex flex-1 flex-col p-6 pt-8">
              <p className={cn("font-mono text-sm font-semibold", KEY_TONE[variant])}>{step.key}</p>
              <h3 className="display mt-3 text-4xl">{step.name}</h3>
              <p
                className={cn(
                  "mt-3 text-xs uppercase tracking-[0.08em]",
                  SUMMARY_TONE[variant],
                )}
              >
                {step.summary}
              </p>
              <p className={cn("mt-4 text-sm leading-relaxed", BODY_TONE[variant])}>{step.body}</p>
              {step.scripture ? (
                <p className={cn("mt-auto pt-5 font-mono text-[11px] uppercase tracking-[0.14em]", KEY_TONE[variant])}>
                  {step.scripture}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
