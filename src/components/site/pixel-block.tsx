import { cn } from "@/lib/utils";

/**
 * The house's blue card family and the block of squares that heads each card.
 *
 * Shared by the 5D's cards and the What We Believe cards so the two read as
 * one set: a shade per card, light to deep, each with a gentle fall into a
 * deeper tone so no card is a flat panel of colour.
 */
export const BLUE_SHADES = [
  { from: "#a8dbff", to: "#8ecdf9", text: "text-ink", muted: "text-ink/75", key: "text-[#0a3d75]", art: "text-white", dot: "bg-[#a8dbff]", glow: "rgba(168,219,255,0.55)" },
  { from: "#5cbcff", to: "#44aef5", text: "text-ink", muted: "text-ink/75", key: "text-[#0a3d75]", art: "text-white", dot: "bg-[#5cbcff]", glow: "rgba(92,188,255,0.55)" },
  { from: "#21a1ff", to: "#1990ea", text: "text-ink", muted: "text-ink/80", key: "text-[#0a3d75]", art: "text-ink", dot: "bg-[#21a1ff]", glow: "rgba(33,161,255,0.55)" },
  { from: "#1170c9", to: "#0c5aa6", text: "text-white", muted: "text-white/85", key: "text-[#a8dbff]", art: "text-[#5cbcff]", dot: "bg-[#1170c9]", glow: "rgba(17,112,201,0.55)" },
  { from: "#0a3d75", to: "#072a52", text: "text-white", muted: "text-white/80", key: "text-brass", art: "text-brass", dot: "bg-[#0a3d75]", glow: "rgba(10,61,117,0.6)" },
] as const;

export type BlueShade = (typeof BLUE_SHADES)[number];

export const shadeBackground = (shade: BlueShade) =>
  `linear-gradient(180deg, ${shade.from} 0%, ${shade.from} 35%, ${shade.to} 100%)`;

const COLS = 10;
const ROWS = 6;
const CELL = 20;

/** A small deterministic hash in 0…1, so the pattern never differs between renders. */
function noise(row: number, col: number, seed: number) {
  const value = Math.sin(row * 12.9898 + col * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * A checkerboard of squares that thins out row by row, so the block fades
 * into the card below it. Each square carries a stagger delay, used when a
 * parent animates the block in (see `.pixel-assemble` in globals.css).
 */
export function PixelBlock({ seed, className }: { seed: number; className?: string }) {
  const squares: { x: number; y: number; fade: number; delay: number }[] = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const checker = (row + col) % 2 === 0;
      const survives = noise(row, col, seed) > row / (ROWS + 1);
      if (row === 0 ? true : checker && survives) {
        squares.push({
          x: col * CELL + 2,
          y: row * CELL + 2,
          fade: row === 0 ? 1 : 1 - row / (ROWS + 1),
          // Top rows land first, with a little scatter along each row.
          delay: Math.round(row * 55 + noise(col, row, seed + 7) * 160),
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
          fillOpacity={square.fade}
          style={{ transitionDelay: `${square.delay}ms` }}
        />
      ))}
    </svg>
  );
}
