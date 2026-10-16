"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/site/use-drag-scroll";

/** How long each card holds before the row moves on. */
const HOLD_MS = 4500;

/**
 * Moves a horizontal carousel along by itself: one card every few seconds,
 * back to the first after the last.
 *
 * It stops while someone is with it, a mouse over the cards, a finger or
 * mouse pressed on one, a card focused from the keyboard, and picks up again
 * when they let go. It also rests while the row is off screen or the tab is
 * hidden, and never runs for anyone who has asked for reduced motion.
 *
 * `step` moves one card forward (the carousel's own arrow logic). Call the
 * returned `restart` when an arrow is used, so the next move waits a full beat.
 */
export function useAutoAdvance(
  trackRef: React.RefObject<HTMLElement | null>,
  step: () => void,
) {
  const still = usePrefersReducedMotion();
  const timer = useRef(0);
  const holds = useRef({
    hover: false,
    press: false,
    focus: false,
    hidden: false,
    offscreen: true,
  });
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const schedule = useCallback(() => {
    const queue = () => {
      window.clearTimeout(timer.current);
      const h = holds.current;
      if (still || h.hover || h.press || h.focus || h.hidden || h.offscreen) return;

      timer.current = window.setTimeout(() => {
        const track = trackRef.current;
        if (track && track.scrollWidth > track.clientWidth + 4) {
          const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
          if (atEnd) {
            track.scrollTo({ left: 0, behavior: "smooth" });
            // Where smooth scrolling never runs, jump back instead.
            window.setTimeout(() => {
              if (track.scrollLeft > 4 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) {
                track.scrollLeft = 0;
              }
            }, 300);
          } else stepRef.current();
        }
        queue();
      }, HOLD_MS);
    };
    queue();
  }, [still, trackRef]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || still) return;
    const h = holds.current;
    // A fresh start each time this runs: nobody on it yet, and off screen
    // until the observer below says otherwise (it reports straight away).
    Object.assign(h, { hover: false, press: false, focus: false, hidden: document.hidden, offscreen: true });
    const set = (key: keyof typeof h, value: boolean) => {
      if (h[key] === value) return;
      h[key] = value;
      schedule();
    };

    // A row followed by a copy of itself (see loopCopies) never runs out:
    // once it settles inside the copy, jump back by one set, which shows
    // exactly the same cards, so the move can't be seen.
    let settle = 0;
    const wrap = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const copy = track.querySelector<HTMLElement>(":scope > [data-loop-copy]");
        const first = track.firstElementChild as HTMLElement | null;
        if (!copy || !first || h.press) return;
        const set = copy.offsetLeft - first.offsetLeft;
        if (set > 0 && track.scrollLeft >= set - 2) {
          const snap = track.style.scrollSnapType;
          track.style.scrollSnapType = "none";
          track.scrollLeft -= set;
          requestAnimationFrame(() => {
            track.style.scrollSnapType = snap;
          });
        }
      }, 140);
    };
    const enter = (event: PointerEvent) =>
      event.pointerType === "mouse" && set("hover", true);
    const leave = (event: PointerEvent) =>
      event.pointerType === "mouse" && set("hover", false);
    const press = () => set("press", true);
    // Released anywhere, a drag often ends outside the row.
    const release = () => {
      set("press", false);
      wrap();
    };
    // Keyboard focus only: a mouse click also focuses the row, and that alone
    // shouldn't stop it for good once the mouse has moved away.
    const keyboardFocus = () =>
      track.matches(":focus-visible") ||
      track.querySelector(":focus-visible") !== null;
    const focusIn = () => set("focus", keyboardFocus());
    const focusOut = () =>
      window.setTimeout(() => set("focus", keyboardFocus()), 0);
    const visibility = () => set("hidden", document.hidden);

    track.addEventListener("scroll", wrap, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => set("offscreen", !entry.isIntersecting),
      {
        threshold: 0.35,
      },
    );
    observer.observe(track);

    track.addEventListener("pointerenter", enter);
    track.addEventListener("pointerleave", leave);
    track.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    track.addEventListener("focusin", focusIn);
    track.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(settle);
      track.removeEventListener("scroll", wrap);
      observer.disconnect();
      track.removeEventListener("pointerenter", enter);
      track.removeEventListener("pointerleave", leave);
      track.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      track.removeEventListener("focusin", focusIn);
      track.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [still, trackRef, schedule]);

  return { restart: schedule };
}
