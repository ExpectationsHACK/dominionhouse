"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const RADIUS = 21;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * A round "back to top" button, bottom right, once the page has been scrolled
 * a screen or so. Its ring fills with how much of the page has been read.
 */
export function BackToTop() {
  const ring = useRef<SVGCircleElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      // Straight to the DOM: no React re-render on every scroll frame.
      if (ring.current) ring.current.style.strokeDashoffset = String(LENGTH * (1 - progress));
      setShown(window.scrollY > window.innerHeight * 0.9);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function toTop() {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "instant" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={cn(
        "fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-brass text-white shadow-[0_12px_28px_-10px_rgba(11,11,12,0.55)] transition-[opacity,transform] duration-300 hover:bg-ink motion-reduce:transition-none sm:bottom-7 sm:right-7",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
        <circle
          ref={ring}
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH}
        />
      </svg>
      <svg viewBox="0 0 16 16" className="relative h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M8 13V3M4 7l4-4 4 4" strokeLinecap="square" />
      </svg>
    </button>
  );
}
