"use client";

import { useDragScroll } from "@/components/site/use-drag-scroll";
import { cn } from "@/lib/utils";

/**
 * A row of cards that scrolls sideways: swipe on touch, drag or flick with a
 * mouse, or step with the arrows. Each child is one card; give it its own
 * width (the track snaps each card's left edge into place).
 */
export function CardCarousel({
  label,
  children,
  tone = "light",
  className,
}: {
  /** Accessible name for the scrolling region. */
  label: string;
  children: React.ReactNode;
  /** Colours the arrows for the section the carousel sits on. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const { trackRef, atStart, atEnd, dragging, page, handlers } = useDragScroll();

  const arrow = cn(
    "flex h-11 w-11 items-center justify-center border transition-colors",
    tone === "dark" ? "border-white/25 text-white" : "border-ink/20 text-ink",
  );
  const live = tone === "dark" ? "hover:border-brass hover:bg-brass hover:text-ink" : "hover:border-ink hover:bg-ink hover:text-white";

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        // Focusable so keyboard users can scroll it with the arrow keys.
        tabIndex={0}
        {...handlers}
        className={cn(
          "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 py-4 outline-none select-none sm:-mx-8 sm:scroll-px-8 sm:px-8",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 [&>*]:snap-start",
          "focus-visible:ring-2 focus-visible:ring-brass",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {children}
      </div>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label="Previous card"
          className={cn(arrow, atStart ? "opacity-30" : live)}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M14 8H3M7 12L3 8l4-4" strokeLinecap="square" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label="Next card"
          className={cn(arrow, atEnd ? "opacity-30" : live)}
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="square" />
          </svg>
        </button>
      </div>
    </div>
  );
}
