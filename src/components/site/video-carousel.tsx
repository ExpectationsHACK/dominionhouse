"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type VideoCarouselItem = {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string | null;
};

/**
 * Short, muted, looping clips, phone-shaped, meant to give a feel for an
 * experience in five to ten seconds rather than explain anything. Each plays
 * only once it's actually in view, so a long row of them doesn't all fight
 * for bandwidth and decode time at once.
 */
function VideoCard({ item }: { item: VideoCarouselItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.6 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="relative aspect-[9/16] w-[62vw] shrink-0 snap-center overflow-hidden border border-white/12 bg-ink sm:w-[240px]">
      <video
        ref={videoRef}
        src={item.videoUrl}
        poster={item.posterUrl ?? undefined}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/20 to-transparent"
      />
      <p className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-white">{item.title}</p>
    </article>
  );
}

export function VideoCarousel({
  items,
  label = "Experience clips",
  tone = "dark",
}: {
  items: VideoCarouselItem[];
  label?: string;
  /** The section behind it: arrows are drawn to show on either. */
  tone?: "light" | "dark";
}) {
  const arrow = tone === "dark" ? "border-white/25 text-white" : "border-ink/20 text-ink";
  const live =
    tone === "dark" ? "hover:border-brass hover:bg-brass hover:text-ink" : "hover:border-ink hover:bg-ink hover:text-white";
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
    const step = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label="Previous clips"
          className={cn(
            "flex h-11 w-11 items-center justify-center border transition-colors",
            arrow,
            atStart ? "opacity-30" : live,
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
          aria-label="Next clips"
          className={cn(
            "flex h-11 w-11 items-center justify-center border transition-colors",
            arrow,
            atEnd ? "opacity-30" : live,
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
