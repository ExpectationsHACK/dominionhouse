import { cn } from "@/lib/utils";

/**
 * The house motif: contour lines, for a house that takes territory.
 *
 * Drawn, not photographed, it survives at any size, needs no asset pipeline,
 * and gives the camp pages a landscape without stock imagery. Deterministic
 * maths, so it renders identically on server and client.
 */
export function HillContours({
  className,
  lines = 14,
  stroke = "currentColor",
}: {
  className?: string;
  lines?: number;
  stroke?: string;
}) {
  const width = 1200;
  const height = 520;

  const paths = Array.from({ length: lines }, (_, index) => {
    const t = index / (lines - 1);
    const baseline = height * (0.28 + t * 0.72);
    const peak = 150 - t * 96;
    const shoulder = 74 - t * 44;

    const d = [
      `M -40 ${baseline + 60}`,
      `C ${width * 0.12} ${baseline + 18 - shoulder * 0.4}, ${width * 0.2} ${baseline - shoulder}, ${width * 0.31} ${baseline - shoulder * 0.72}`,
      `C ${width * 0.4} ${baseline - shoulder * 0.5}, ${width * 0.44} ${baseline - peak * 0.55}, ${width * 0.53} ${baseline - peak}`,
      `C ${width * 0.62} ${baseline - peak * 0.86}, ${width * 0.68} ${baseline - shoulder * 0.3}, ${width * 0.79} ${baseline - shoulder * 0.62}`,
      `C ${width * 0.88} ${baseline - shoulder * 0.9}, ${width * 0.94} ${baseline - shoulder * 0.2}, ${width + 40} ${baseline + 30}`,
    ].join(" ");

    return { d, opacity: 0.16 + t * 0.5, key: index };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      fill="none"
    >
      {paths.map((path) => (
        <path
          key={path.key}
          d={path.d}
          stroke={stroke}
          strokeOpacity={path.opacity}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
