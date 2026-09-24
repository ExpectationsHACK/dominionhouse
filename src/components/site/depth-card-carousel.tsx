"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

/**
 * Depth cards.
 *
 * A perspective card that responds to the pointer: the card tilts, and the
 * layers inside it (image, wash, type) translate on different Z planes so the
 * front of the card leads the back. That separation is what reads as depth,
 * a tilt on its own just looks like a hover state.
 *
 * This is a local implementation. React Bits Pro ships a `depth-card-tw`
 * component that needs a paid licence key; when one is available, swap the
 * `<DepthCard>` body for it, the carousel, data and admin around it stay.
 */

export type DepthCardItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
};

/** Ember washes, so a card without an image still looks deliberate. */
const FALLBACK_WASH = [
  "linear-gradient(150deg,#0b0b0c 0%,#21a1ff 55%,#eef7ff 100%)",
  "linear-gradient(150deg,#0b0b0c 0%,#21a1ff 100%)",
  "linear-gradient(150deg,#eef7ff 0%,#21a1ff 50%,#0b0b0c 100%)",
  "linear-gradient(150deg,#21a1ff 0%,#0b0b0c 100%)",
];

function usePrefersReducedMotion() {
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function DepthCard({
  item,
  index,
  still,
  numbered,
}: {
  item: DepthCardItem;
  index: number;
  still: boolean;
  numbered: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });

  function handleMove(event: React.PointerEvent<HTMLElement>) {
    if (still) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // -0.5 … 0.5 from the card's own centre
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px, y: py, active: true });
  }

  function handleLeave() {
    setTilt({ x: 0, y: 0, active: false });
  }

  const wash = FALLBACK_WASH[index % FALLBACK_WASH.length];
  const transition = tilt.active ? "none" : "transform 600ms var(--ease-out-expo, ease-out)";

  return (
    <article
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="group relative aspect-[3/4] w-[76vw] shrink-0 snap-center sm:w-[340px] lg:w-[380px]"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-full w-full overflow-hidden border border-white/12"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${tilt.x * 12}deg) rotateX(${-tilt.y * 12}deg) scale(${tilt.active ? 1.02 : 1})`,
          transition,
        }}
      >
        {/* back plane, the image, pushed away and over-sized so the parallax
            never exposes an edge */}
        <div
          className="absolute inset-[-8%]"
          style={{
            transform: `translateZ(-40px) translate3d(${tilt.x * -22}px, ${tilt.y * -22}px, 0)`,
            transition,
          }}
        >
          {item.imageUrl ? (
            // Remote, admin-supplied URLs; next/image would need every host allow-listed.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full" style={{ background: wash }} />
          )}
        </div>

        {/* mid plane, legibility wash */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent"
          style={{ transform: "translateZ(0px)" }}
        />

        {/* specular sheen that tracks the pointer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(420px circle at ${(tilt.x + 0.5) * 100}% ${(tilt.y + 0.5) * 100}%, rgba(255,255,255,0.20), transparent 60%)`,
          }}
        />

        {/* front plane, type leads the image */}
        <div
          className="absolute inset-x-0 bottom-0 p-6"
          style={{
            transform: `translateZ(48px) translate3d(${tilt.x * 16}px, ${tilt.y * 16}px, 0)`,
            transition,
          }}
        >
          {numbered ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
              {String(index + 1).padStart(2, "0")}
            </p>
          ) : null}
          <h3 className={cn("display text-3xl text-white", numbered && "mt-2")}>{item.title}</h3>
          {item.subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-white/70">{item.subtitle}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function DepthCardCarousel({
  items,
  label = "Fresh Fire gallery",
  numbered = true,
}: {
  items: DepthCardItem[];
  /** Show the 01, 02… counter on each card. */
  numbered?: boolean;
  /** Accessible name for the scrolling track. */
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const still = usePrefersReducedMotion();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    // A track that hasn't been laid out yet measures 0, which would otherwise
    // read as "already at the end" and leave the next arrow stuck disabled.
    if (track.clientWidth === 0) {
      setAtStart(true);
      setAtEnd(false);
      return;
    }

    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    syncEdges();
    track.addEventListener("scroll", syncEdges, { passive: true });

    // Fires when the track is first laid out, and on every reflow after,
    // covers late fonts, images and container resizes that `resize` misses.
    const observer = new ResizeObserver(syncEdges);
    observer.observe(track);

    return () => {
      track.removeEventListener("scroll", syncEdges);
      observer.disconnect();
    };
  }, [syncEdges]);

  function page(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector("article");
    const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    const from = track.scrollLeft;
    const to = Math.max(0, Math.min(from + step * direction, track.scrollWidth - track.clientWidth));

    if (still) {
      track.scrollLeft = to;
      return;
    }

    track.scrollBy({ left: step * direction, behavior: "smooth" });

    // Smooth scrolling is animated, and a few environments never run that
    // animation. If nothing has moved shortly after, jump instead, an arrow
    // that does nothing is worse than an arrow that doesn't glide.
    window.setTimeout(() => {
      if (trackRef.current && trackRef.current.scrollLeft === from && from !== to) {
        trackRef.current.scrollLeft = to;
      }
    }, 250);
  }

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <DepthCard key={item.id} item={item} index={index} still={still} numbered={numbered} />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label="Previous cards"
          className={cn(
            "flex h-11 w-11 items-center justify-center border border-white/25 text-white transition-colors",
            atStart ? "opacity-30" : "hover:border-brass hover:bg-brass hover:text-ink",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M14 8H3M7 12L3 8l4-4" strokeLinecap="square" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label="Next cards"
          className={cn(
            "flex h-11 w-11 items-center justify-center border border-white/25 text-white transition-colors",
            atEnd ? "opacity-30" : "hover:border-brass hover:bg-brass hover:text-ink",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="square" />
          </svg>
        </button>
        <p className="ml-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
          Drag, or use the arrows
        </p>
      </div>
    </div>
  );
}
