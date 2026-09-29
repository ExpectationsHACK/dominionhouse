"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Testimonial = {
  id: string;
  name: string;
  testimony: string;
  imageUrl?: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article className="flex w-[82vw] shrink-0 snap-center flex-col justify-between border border-ink/12 bg-paper p-6 sm:w-[380px] sm:p-7">
      <p className="text-lg leading-relaxed text-ink">&ldquo;{item.testimony}&rdquo;</p>
      <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-5">
        {item.imageUrl ? (
          // Admin-supplied URLs from arbitrary hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full border border-ink/12 object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
            {initials(item.name)}
          </div>
        )}
        <p className="font-semibold">{item.name}</p>
      </div>
    </article>
  );
}

export function TestimonialCarousel({
  items,
  label = "Camp testimonials",
}: {
  items: Testimonial[];
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
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
    track.scrollBy({ left: step * direction, behavior: "smooth" });
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
        {items.map((item) => (
          <TestimonialCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label="Previous testimonials"
          className={cn(
            "flex h-11 w-11 items-center justify-center border border-ink/20 text-ink transition-colors",
            atStart ? "opacity-30" : "hover:border-ink hover:bg-ink hover:text-white",
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
          aria-label="Next testimonials"
          className={cn(
            "flex h-11 w-11 items-center justify-center border border-ink/20 text-ink transition-colors",
            atEnd ? "opacity-30" : "hover:border-ink hover:bg-ink hover:text-white",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="square" />
          </svg>
        </button>
      </div>
    </div>
  );
}
