import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A tall portrait card with a pair of sweeping arcs.
 *
 * Each card carries a pair of large sweeping arcs, a nod to the light a
 * lighthouse throws, drawn as SVG so it stays crisp at any size. Three
 * treatments rotate (logo blue, white, black) in the house palette, offset row
 * to row so no two neighbours match.
 */

export const ARC_VARIANTS = ["blue", "light", "dark"] as const;
export type ArcVariant = (typeof ARC_VARIANTS)[number];

export const CARD: Record<ArcVariant, string> = {
  blue: "text-white",
  light: "border border-ink/12 bg-white text-ink",
  dark: "border border-white/15 bg-ink text-white",
};

const ARC_TONE: Record<ArcVariant, [string, string]> = {
  blue: ["text-white", "text-ink"],
  light: ["text-brass", "text-ink"],
  dark: ["text-brass", "text-white"],
};

export const REGION_TONE: Record<ArcVariant, string> = {
  blue: "text-white/80",
  light: "text-brass",
  dark: "text-brass",
};

export const BODY_TONE: Record<ArcVariant, string> = {
  blue: "text-white/85",
  light: "text-ink-70",
  dark: "text-white/70",
};

/** Where the two arcs sit, so neighbouring cards don't repeat the same shape. */
const ARC_LAYOUTS = [
  { a: [40, 10, 95], b: [190, 120, 80] },
  { a: [220, 20, 100], b: [70, 130, 70] },
  { a: [120, -20, 90], b: [250, 110, 75] },
  { a: [20, 90, 85], b: [200, 30, 95] },
] as const;

export function Arcs({ variant, seed }: { variant: ArcVariant; seed: number }) {
  const layout = ARC_LAYOUTS[seed % ARC_LAYOUTS.length];
  const [first, second] = ARC_TONE[variant];

  return (
    <svg
      viewBox="0 0 300 200"
      aria-hidden="true"
      className="block h-44 w-full"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle
        cx={layout.a[0]}
        cy={layout.a[1]}
        r={layout.a[2]}
        stroke="currentColor"
        strokeWidth="36"
        className={first}
      />
      <circle
        cx={layout.b[0]}
        cy={layout.b[1]}
        r={layout.b[2]}
        stroke="currentColor"
        strokeWidth="36"
        opacity="0.85"
        className={second}
      />
    </svg>
  );
}


/** The card shell: background, arcs, and a padded body for the caller's content. */
export function ArcCard({
  variant,
  seed,
  className,
  children,
}: {
  variant: ArcVariant;
  seed: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cn("relative flex min-h-[26rem] flex-col overflow-hidden", CARD[variant], className)}
      style={
        variant === "blue"
          ? { background: "linear-gradient(180deg,#21a1ff 0%,#21a1ff 40%,#0b0b0c 135%)" }
          : undefined
      }
    >
      <Arcs variant={variant} seed={seed} />
      <div className="flex flex-1 flex-col p-6 pt-5">{children}</div>
    </li>
  );
}
