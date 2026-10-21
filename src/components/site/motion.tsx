"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Small motion pieces shared across the site. Every one of them:
 * - renders its final, readable state on the server (no-JS and slow
 *   connections never see something half-hidden),
 * - stays completely still for anyone who asked for reduced motion,
 * - uses IntersectionObserver / CSS, nothing heavy, so older phones cope.
 */

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True once the element has come into view (and stays true). */
export function useInViewOnce<T extends Element>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  // Callers pass a fresh object each render, so depend on its values.
  const threshold = options?.threshold ?? 0.4;
  const rootMargin = options?.rootMargin;
  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, threshold, rootMargin]);
  return [ref, seen] as const;
}

// ── #7 highlighter sweep ───────────────────────────────────────────────────

/** A word or phrase that gets a blue underline swept across it when seen. */
export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  const [ref, seen] = useInViewOnce<HTMLSpanElement>({ threshold: 0.8 });
  return (
    <span ref={ref} data-on={seen || undefined} className={cn("sweep", className)}>
      {children}
    </span>
  );
}

// ── #8 letter-by-letter ────────────────────────────────────────────────────

/**
 * A title that builds itself letter by letter on load. CSS only (the
 * `rise-in` keyframe), so it starts with first paint. Words never break
 * mid-letter; screen readers get the plain text.
 */
export function StaggerLetters({
  text,
  start = 0,
  step = 34,
  accent,
  accentClassName,
}: {
  text: string;
  start?: number;
  step?: number;
  /** A trailing word drawn in its own colour (e.g. the year). */
  accent?: string;
  accentClassName?: string;
}) {
  let index = 0;
  const word = (value: string, className?: string) => (
    <span className={cn("inline-block whitespace-nowrap", className)}>
      {[...value].map((letter, i) => (
        <span key={i} className="rise-in inline-block" style={{ animationDelay: `${start + index++ * step}ms` }}>
          {letter}
        </span>
      ))}
    </span>
  );
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">
        {text}
        {accent ? ` ${accent}` : ""}
      </span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i}>
            {i > 0 ? " " : null}
            {word(w)}
          </span>
        ))}
        {accent ? <> {word(accent, accentClassName)}</> : null}
      </span>
    </>
  );
}

// ── #9 rotating word ───────────────────────────────────────────────────────

/**
 * The last word of a headline changing every few seconds. All the words sit
 * in one grid cell, so the line never jumps as they swap. Reduced motion: the
 * first word, still.
 */
export function RotatingWord({ words, className, startAfter = 2600, every = 2400 }: { words: string[]; className?: string; startAfter?: number; every?: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion() || words.length < 2) return;
    let interval = 0;
    const timeout = window.setTimeout(() => {
      interval = window.setInterval(() => setIndex((i) => (i + 1) % words.length), every);
    }, startAfter);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [words.length, every, startAfter]);
  return (
    <span className={cn("relative inline-grid", className)}>
      <span className="sr-only">{words[0]}</span>
      {words.map((word, i) => (
        <span
          key={word}
          aria-hidden="true"
          className="col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)]"
          style={{ opacity: i === index ? 1 : 0, transform: i === index ? "none" : i < index ? "translateY(-0.35em)" : "translateY(0.35em)" }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

// ── #4 count-up ────────────────────────────────────────────────────────────

/**
 * A number that counts up from 0 when it comes into view. Renders the real
 * number on the server; only after mounting does it reset and count.
 */
export function CountUp({ to, prefix = "", suffix = "", duration = 1400, className }: { to: number; prefix?: string; suffix?: string; duration?: number; className?: string }) {
  const [ref, seen] = useInViewOnce<HTMLSpanElement>({ threshold: 0.6 });
  const started = useRef(false);
  const show = (n: number) => `${prefix}${n.toLocaleString("en-NG")}${suffix}`;

  // Written straight to the DOM, like the scroll line: no React render per
  // frame. Mounted: drop to 0 (the server already rendered the real number).
  useEffect(() => {
    if (ref.current && !prefersReducedMotion()) ref.current.textContent = show(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !seen || started.current || prefersReducedMotion()) return;
    started.current = true;
    let frame = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      node.textContent = show(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- show() is derived from props listed here
  }, [seen, to, duration, prefix, suffix]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {show(to)}
    </span>
  );
}

// ── #3 lines that light up ─────────────────────────────────────────────────

/**
 * Paragraphs that start softly dimmed and light up, one by one, as each
 * reaches the middle of the screen, and stay lit. Only dims once mounted and
 * only for those who don't ask for reduced motion.
 */
export function LightLines({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = box.current;
    if (!node || prefersReducedMotion()) return;
    setReady(true);
    const items = [...node.children] as HTMLElement[];
    // Light every line whose top has reached the middle of the screen,
    // including any a fast flick or a jump link carried straight past.
    const sweep = () => {
      for (const item of items) {
        if (item.dataset.lit === undefined && item.getBoundingClientRect().top < window.innerHeight * 0.5) {
          item.dataset.lit = "";
          observer.unobserve(item);
        }
      }
    };
    // Watches the top half of the screen; any change re-checks them all.
    const observer = new IntersectionObserver(sweep, { rootMargin: "0px 0px -50% 0px" });
    items.forEach((item) => observer.observe(item));
    sweep();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={box} data-lines={ready || undefined} className={className}>
      {children}
    </div>
  );
}

// ── #5 image wipe ──────────────────────────────────────────────────────────

/**
 * A photo uncovered left to right the first time it scrolls into view.
 * Anything already on screen when the page loads is left alone.
 */
export function WipeIn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // The clip sits on an inner layer: a fully clipped element never counts
    // as "in view", so the observer watches the unclipped outer box.
    const node = ref.current;
    const inner = photo.current;
    if (!node || !inner || prefersReducedMotion()) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    inner.dataset.wipe = "hidden";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          inner.dataset.wipe = "shown";
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      <div ref={photo} className="h-full w-full">
        {children}
      </div>
    </div>
  );
}

// ── #10 magnetic button ────────────────────────────────────────────────────

/**
 * Leans a button a few pixels toward the cursor while it's over it. Mouse
 * only (phones have no hover), and still for reduced motion.
 */
export function Magnetic({ children, className, strength = 0.22 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = node.getBoundingClientRect();
        const x = Math.max(-10, Math.min(10, (event.clientX - box.left - box.width / 2) * strength));
        const y = Math.max(-8, Math.min(8, (event.clientY - box.top - box.height / 2) * strength));
        node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };
    const leave = () => {
      cancelAnimationFrame(frame);
      node.style.transform = "";
    };
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={cn("magnetic inline-flex", className)}>
      {children}
    </span>
  );
}

// ── #6 programme timeline ──────────────────────────────────────────────────

/**
 * A list with a line down its left edge that draws itself as the list is
 * scrolled through, lighting a dot at each item it passes. The server draws
 * the whole line and every dot; only once mounted does it start from empty.
 */
export function Timeline({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = list.current;
    const fill = line.current;
    if (!node || !fill || !box.current || prefersReducedMotion()) return;
    const wrap = box.current;
    const items = [...node.querySelectorAll<HTMLElement>(":scope > li")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      const mark = window.innerHeight * 0.6;
      const progress = box.height > 0 ? Math.max(0, Math.min(1, (mark - box.top) / box.height)) : 1;
      fill.style.transform = `scaleY(${progress})`;
      for (const item of items) {
        if (item.getBoundingClientRect().top + 28 <= mark) item.dataset.lit = "";
        else delete item.dataset.lit;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    wrap.dataset.timeline = "live";
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div ref={box} data-timeline="" className="relative pl-7">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-ink/12" />
      <span ref={line} aria-hidden="true" className="timeline-fill absolute inset-y-0 left-0 w-0.5 -translate-x-[0.5px] origin-top bg-brass" />
      <ul ref={list} className={className}>
        {children}
      </ul>
    </div>
  );
}

// ── #17 / #26 meter fill ───────────────────────────────────────────────────

/**
 * A progress bar that fills from empty the first time it's seen, then marks
 * its end with a soft pulse. The server renders it full.
 */
export function MeterBar({ percent, className, barClassName, label }: { percent: number; className?: string; barClassName?: string; label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const value = Math.max(0, Math.min(100, percent));
  useEffect(() => {
    const node = track.current;
    const fill = bar.current;
    if (!node || !fill || prefersReducedMotion()) return;
    fill.style.transition = "none";
    fill.style.width = "0%";
    delete node.dataset.done;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // Read layout so the empty bar is committed before it starts filling.
        void fill.offsetWidth;
        fill.style.transition = "";
        fill.style.width = `${value}%`;
        timer = window.setTimeout(() => (node.dataset.done = ""), 1500);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [value]);
  return (
    <div
      ref={track}
      data-done=""
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("meter relative", className)}
    >
      <div ref={bar} className={cn("meter-fill relative h-full", barClassName)} style={{ width: `${value}%` }}>
        <span aria-hidden="true" className="meter-mark pulse-ring absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-current" />
      </div>
    </div>
  );
}

// ── #19 success moment ─────────────────────────────────────────────────────

const CONFETTI = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const reach = 70 + ((i * 37) % 60);
  return {
    x: Math.round(Math.cos(angle) * reach),
    y: Math.round(Math.sin(angle) * reach - 30),
    spin: ((i * 97) % 540) - 270,
    color: ["var(--color-brass)", "var(--color-skyblue)", "#ffc46b", "var(--color-ink)"][i % 4],
    delay: (i % 5) * 25,
  };
});

/**
 * A round check mark that draws itself, with one burst of confetti. CSS
 * only, so it plays with the first paint; reduced motion shows the finished
 * check and no confetti.
 */
export function SuccessBurst({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("success-burst relative h-14 w-14 shrink-0", className)}>
      {CONFETTI.map((bit, index) => (
        <span
          key={index}
          className="confetti absolute left-1/2 top-1/2 h-2 w-1.5"
          style={
            {
              background: bit.color,
              animationDelay: `${300 + bit.delay}ms`,
              "--x": `${bit.x}px`,
              "--y": `${bit.y}px`,
              "--spin": `${bit.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
      <svg viewBox="0 0 56 56" className="relative h-full w-full text-success">
        <circle className="check-ring" cx="28" cy="28" r="25" fill="none" stroke="currentColor" strokeWidth="3" />
        <path className="check-mark" d="M17 29l7.5 7.5L40 21" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── #21 next-field hint ────────────────────────────────────────────────────

/**
 * On phones, once a field is filled in and left, the next empty field on
 * the step pulses gently so it's clear where to go. Renders nothing visible;
 * it finds its form from where it's placed.
 */
export function NextFieldHint() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form || prefersReducedMotion() || !window.matchMedia("(max-width: 639px)").matches) return;
    let timer = 0;
    const clear = () => form.querySelectorAll("[data-hint]").forEach((el) => el.removeAttribute("data-hint"));
    const fields = () =>
      [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")].filter(
        (el) =>
          el.type !== "hidden" &&
          el.type !== "checkbox" &&
          el.type !== "radio" &&
          !el.disabled &&
          el.offsetParent !== null,
      );
    const left = (event: FocusEvent) => {
      const field = event.target as HTMLInputElement;
      if (!field.matches?.("input, select, textarea") || !field.value) return;
      const all = fields();
      const next = all.slice(all.indexOf(field as never) + 1).find((el) => !el.value);
      clear();
      window.clearTimeout(timer);
      if (!next) return;
      next.dataset.hint = "";
      timer = window.setTimeout(clear, 2600);
    };
    form.addEventListener("focusout", left);
    form.addEventListener("focusin", clear);
    return () => {
      window.clearTimeout(timer);
      form.removeEventListener("focusout", left);
      form.removeEventListener("focusin", clear);
    };
  }, []);
  return <span ref={ref} hidden />;
}

// ── #14 testimonies fanning out ────────────────────────────────────────────

/**
 * Wraps a card carousel: the first time it scrolls into view its cards start
 * stacked on the first one and fan out into their places. Off-screen on load
 * only; every inline style is dropped afterwards so the carousel is untouched.
 */
export function FanIn({ children, className }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = box.current;
    if (!node || prefersReducedMotion()) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    const track = node.querySelector<HTMLElement>("[data-loop-copy]")?.parentElement;
    if (!track) return;
    const cards = ([...track.children] as HTMLElement[]).slice(0, 6);
    const first = cards[0];
    if (!first) return;
    const reset = () => {
      for (const card of cards) {
        card.style.transition = card.style.transform = card.style.opacity = card.style.zIndex = "";
      }
    };
    cards.forEach((card, i) => {
      const dx = card.offsetLeft - first.offsetLeft;
      card.style.transition = "none";
      card.style.transform = `translateX(${-dx}px) rotate(${i * -2.5}deg) scale(${1 - i * 0.03})`;
      card.style.zIndex = String(10 - i);
      if (i > 0) card.style.opacity = "0.9";
    });
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        cards.forEach((card, i) => {
          card.style.transition = `transform 900ms var(--ease-out-expo) ${i * 90}ms, opacity 600ms ease ${i * 90}ms`;
          card.style.transform = "";
          card.style.opacity = "";
        });
        timer = window.setTimeout(reset, 900 + cards.length * 90 + 50);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      reset();
    };
  }, []);
  return (
    <div ref={box} className={className}>
      {children}
    </div>
  );
}
