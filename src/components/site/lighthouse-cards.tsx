import Link from "next/link";
import { ARC_VARIANTS, ArcCard, BODY_TONE, REGION_TONE } from "@/components/site/arc-card";
import { Arrow } from "@/components/ui";
import type { Campus } from "@/lib/church";
import { cn } from "@/lib/utils";

/**
 * The lighthouses, as tall portrait cards. Three treatments rotate (logo blue,
 * white, black), offset row to row so no two neighbours match.
 */
export function LighthouseCards({ campuses }: { campuses: readonly Campus[] }) {
  return (
    <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campuses.map((campus, index) => {
        const variant = ARC_VARIANTS[(index + Math.floor(index / 3)) % ARC_VARIANTS.length];
        const phone = campus.phones[0];

        return (
          <ArcCard key={campus.slug} variant={variant} seed={index}>
            <p
              className={cn(
                "font-mono text-[10px] uppercase tracking-[0.16em]",
                REGION_TONE[variant],
              )}
            >
              {campus.region === "Lagos" ? "Lagos" : campus.country}
            </p>
            <h3 className="display mt-2 text-4xl">{campus.name}</h3>
            <p className={cn("mt-3 text-sm leading-relaxed", BODY_TONE[variant])}>
              {campus.address}
            </p>
            {phone ? (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className={cn(
                  "mt-3 font-mono text-xs underline-offset-4 hover:underline",
                  BODY_TONE[variant],
                )}
              >
                {phone}
              </a>
            ) : null}

            <Link
              href={`/locations?campus=${campus.slug}`}
              className="mt-auto inline-flex items-center gap-2 pt-6 text-[12px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
            >
              Plan a visit <Arrow />
            </Link>
          </ArcCard>
        );
      })}
    </ul>
  );
}
