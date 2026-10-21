"use client";

import { useEffect, useRef } from "react";

/**
 * A line along the bottom edge of the header that fills as the page is read.
 * Rendered inside the (sticky) header, so it sits just under it in the house
 * blue, visible against the page rather than lost in the blue header.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      // Written straight to the DOM: re-rendering React on every scroll frame
      // for a single transform would be wasted work.
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
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

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-[4px] h-[3px] origin-left scale-x-0 bg-brass"
    />
  );
}
