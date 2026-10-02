"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export function usePrefersReducedMotion() {
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

/**
 * A horizontal scroll-snap track that a mouse can drag and flick, the way a
 * finger already can, plus what arrow buttons need: whether the track is at
 * either end, which card sits nearest the middle, and a one-card step.
 *
 * Spread `handlers` onto the track element and attach `trackRef` to it; each
 * direct child is treated as one card.
 */
export function useDragScroll() {
  const trackRef = useRef<HTMLDivElement>(null);
  const still = usePrefersReducedMotion();
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [centred, setCentred] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ x: 0, scroll: 0, lastX: 0, lastT: 0, velocity: 0, moved: 0 });
  const glide = useRef(0);

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

    // The card nearest the middle of the track is the one in focus.
    const middle = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    setCentred(best);
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

  useEffect(() => () => cancelAnimationFrame(glide.current), []);

  // Mouse drag with a flick: touch already scrolls natively with momentum,
  // this gives a mouse the same feel instead of only arrows and the wheel.
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    cancelAnimationFrame(glide.current);
    track.setPointerCapture(event.pointerId);
    track.style.scrollSnapType = "none";
    drag.current = {
      x: event.clientX,
      scroll: track.scrollLeft,
      lastX: event.clientX,
      lastT: performance.now(),
      velocity: 0,
      moved: 0,
    };
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const track = trackRef.current;
    if (!track) return;
    const now = performance.now();
    const state = drag.current;
    track.scrollLeft = state.scroll - (event.clientX - state.x);
    state.moved = Math.max(state.moved, Math.abs(event.clientX - state.x));
    const dt = Math.max(1, now - state.lastT);
    // Smoothed, so the last jittery millisecond doesn't decide the flick.
    state.velocity = state.velocity * 0.6 + ((event.clientX - state.lastX) / dt) * 0.4;
    state.lastX = event.clientX;
    state.lastT = now;
  }

  function endDrag() {
    if (!dragging) return;
    setDragging(false);
    const track = trackRef.current;
    if (!track) return;
    let velocity = still ? 0 : drag.current.velocity; // px per ms
    let last = performance.now();
    const release = () => {
      track.style.scrollSnapType = "";
    };
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      track.scrollLeft -= velocity * dt;
      velocity *= Math.pow(0.94, dt / 16);
      if (Math.abs(velocity) > 0.02) glide.current = requestAnimationFrame(step);
      else release();
    };
    if (Math.abs(velocity) > 0.02) glide.current = requestAnimationFrame(step);
    else release();
  }

  /** A drag that ends on a link shouldn't also follow it. */
  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (drag.current.moved > 6) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = 0;
    }
  }

  function page(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
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

  return {
    trackRef,
    still,
    atStart,
    atEnd,
    centred,
    dragging,
    page,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  };
}
