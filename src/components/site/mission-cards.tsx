"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Step = {
  key: string;
  name: string;
  summary: string;
  body: string;
  scripture?: string;
};

/**
 * The 5D strategy as compact cards: each shows only its number and name
 * until it's opened, then the rest types itself out.
 *
 * Opening is hover (or keyboard focus) on a mouse; on touch screens there is
 * no hover, so a card opens as the progress rail drawing down the section
 * reaches it. Reduced motion skips the typing and shows everything.
 *
 * The full text is always laid out invisibly underneath, so typing never
 * changes a card's size and nothing on the page jumps.
 */

/** Light to deep: the strategy reads as a progression, D1 to D5. */
const SHADES = [
  { bg: "#a8dbff", text: "text-ink", muted: "text-ink/70", art: "text-white", dot: "bg-[#a8dbff]" },
  { bg: "#5cbcff", text: "text-ink", muted: "text-ink/70", art: "text-white", dot: "bg-[#5cbcff]" },
  { bg: "#21a1ff", text: "text-ink", muted: "text-ink/75", art: "text-ink", dot: "bg-[#21a1ff]" },
  { bg: "#1170c9", text: "text-white", muted: "text-white/90", art: "text-brass", dot: "bg-[#1170c9]" },
  { bg: "#0a3d75", text: "text-white", muted: "text-white/85", art: "text-brass", dot: "bg-[#0a3d75]" },
] as const;

const TYPE_SPEED = 120; // characters per second

const COLS = 10;
const ROWS = 5;
const CELL = 20;

function noise(row: number, col: number, seed: number) {
  const value = Math.sin(row * 12.9898 + col * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

/** The dissolving block of squares that sits where the text will type. */
function PixelDissolve({ seed, className }: { seed: number; className?: string }) {
  const squares: { x: number; y: number; opacity: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const checker = (row + col) % 2 === 0;
      const survives = noise(row, col, seed) > row / (ROWS + 1);
      if (row === 0 ? true : checker && survives) {
        squares.push({ x: col * CELL + 2, y: row * CELL + 2, opacity: 1 - row / (ROWS + 1) });
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      aria-hidden="true"
      className={cn("block w-full max-w-[16rem]", className)}
      fill="currentColor"
    >
      {squares.map((square) => (
        <rect
          key={`${square.x}-${square.y}`}
          x={square.x}
          y={square.y}
          width={CELL - 4}
          height={CELL - 4}
          opacity={square.opacity}
        />
      ))}
    </svg>
  );
}

/** A live media query; `serverValue` is used for the server and hydration render. */
function useMediaQuery(query: string, serverValue: boolean) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

const noSubscribe = () => () => {};

function useMotionPrefs() {
  return {
    hover: useMediaQuery("(hover: hover) and (pointer: fine)", true),
    reduce: useMediaQuery("(prefers-reduced-motion: reduce)", false),
    // False until hydrated, when the device is still unknown.
    ready: useSyncExternalStore(noSubscribe, () => true, () => false),
  };
}

function MissionCard({
  step,
  index,
  open,
  instant,
  lit,
  onOpen,
  onClose,
  dotRef,
}: {
  step: Step;
  index: number;
  open: boolean;
  instant: boolean;
  lit: boolean;
  onOpen: () => void;
  onClose: () => void;
  dotRef: (node: HTMLSpanElement | null) => void;
}) {
  const shade = SHADES[index % SHADES.length];
  const full = `${step.summary}\n${step.body}`;
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!open) {
      // Rewind for the next opening (a closed card shows nothing typed anyway).
      const frame = requestAnimationFrame(() => setTyped(0));
      return () => cancelAnimationFrame(frame);
    }
    if (instant) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const count = Math.min(full.length, Math.floor(((now - start) / 1000) * TYPE_SPEED));
      setTyped(count);
      if (count < full.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, instant, full.length]);

  const count = open ? (instant ? full.length : typed) : 0;
  const summaryShown = full.slice(0, Math.min(count, step.summary.length));
  const bodyShown = count > step.summary.length ? full.slice(step.summary.length + 1, count) : "";
  const done = count >= full.length;

  return (
    <li
      tabIndex={0}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
      className={cn(
        "relative outline-none transition-transform duration-500 ease-[var(--ease-out-expo)] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
        open && "xl:-translate-y-1.5",
      )}
    >
      {/* the node this card hangs from on the progress rail */}
      <span
        ref={dotRef}
        aria-hidden="true"
        className={cn(
          "absolute z-10 h-3 w-3 rounded-full border-2 border-ink transition-colors duration-500",
          "-left-[2.15rem] top-6 xl:-top-[2.15rem] xl:left-6",
          lit ? shade.dot : "bg-bone",
        )}
      />

      <div
        className={cn("flex h-full flex-col p-5 sm:p-6", shade.text)}
        style={{ backgroundColor: shade.bg }}
      >
        <p className={cn("font-mono text-sm font-semibold", shade.muted)}>{step.key}</p>
        <h3 className="display mt-2 text-3xl sm:text-4xl">{step.name}</h3>

        <div className="relative mt-5 flex-1">
          {/* Reserves the opened size, so typing never resizes the card. */}
          <div aria-hidden="true" className="invisible">
            <p className="text-xs font-semibold uppercase tracking-[0.08em]">{step.summary}</p>
            <p className="mt-3 text-[13px] leading-relaxed sm:text-sm">{step.body}</p>
            {step.scripture ? (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em]">{step.scripture}</p>
            ) : null}
          </div>

          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              open ? "opacity-0" : "opacity-100",
            )}
          >
            <PixelDissolve seed={index + 1} className={shade.art} />
          </div>

          <div aria-hidden="true" className="absolute inset-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em]">{summaryShown}</p>
            <p className={cn("mt-3 text-[13px] leading-relaxed sm:text-sm", shade.muted)}>
              {bodyShown}
              {open && !done ? <span className="caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current" /> : null}
            </p>
            {step.scripture ? (
              <p
                className={cn(
                  "mt-4 font-mono text-[11px] uppercase tracking-[0.14em] transition-opacity duration-500",
                  shade.muted,
                  done && open ? "opacity-100" : "opacity-0",
                )}
              >
                {step.scripture}
              </p>
            ) : null}
          </div>

          <p className="sr-only">
            {step.summary}. {step.body} {step.scripture ?? ""}
          </p>
        </div>

        <p
          aria-hidden="true"
          className={cn(
            "mt-5 hidden font-mono text-[10px] uppercase tracking-[0.16em] transition-opacity duration-300 xl:block",
            shade.muted,
            open ? "opacity-0" : "opacity-100",
          )}
        >
          Hover to read
        </p>
      </div>
    </li>
  );
}

export function MissionCards({ steps }: { steps: readonly Step[] }) {
  const { hover, reduce, ready } = useMotionPrefs();
  const listRef = useRef<HTMLOListElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const [rail, setRail] = useState<{ x: number; y: number; length: number; vertical: boolean } | null>(null);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  // Where the rail runs: from the first card's node to the last, measured,
  // so it is right whether the cards sit in a row or a column.
  const measure = useCallback(() => {
    const list = listRef.current;
    const first = dots.current[0];
    const last = dots.current[steps.length - 1];
    if (!list || !first || !last) return;
    const box = list.getBoundingClientRect();
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const ax = a.left + a.width / 2 - box.left;
    const ay = a.top + a.height / 2 - box.top;
    const bx = b.left + b.width / 2 - box.left;
    const by = b.top + b.height / 2 - box.top;
    const vertical = Math.abs(by - ay) > Math.abs(bx - ax);
    setRail({ x: ax, y: ay, length: vertical ? by - ay : bx - ax, vertical });
  }, [steps.length]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!rail || reduce) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const list = listRef.current;
      if (!list) return;
      const vh = window.innerHeight;
      const top = list.getBoundingClientRect().top + rail.y;
      // A column fills to wherever 60% down the screen is; a row fills as the
      // section rises through the lower half of the screen.
      const next = rail.vertical ? (vh * 0.6 - top) / rail.length : (vh * 0.85 - top) / (vh * 0.4);
      setProgress(Math.min(1, Math.max(0, next)));
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
  }, [rail, reduce]);

  // Reduced motion: the rail is simply drawn, every card lit.
  const shown = reduce ? 1 : progress;
  const reached = (index: number) =>
    shown >= (steps.length > 1 ? index / (steps.length - 1) : 0) - 0.001;

  return (
    <ol ref={listRef} className="relative mt-14 grid gap-4 pl-10 xl:grid-cols-5 xl:pl-0 xl:pt-10">
      {rail ? (
        <span
          aria-hidden="true"
          className="absolute bg-ink/15"
          style={
            rail.vertical
              ? { left: rail.x - 1, top: rail.y, width: 2, height: rail.length }
              : { left: rail.x, top: rail.y - 1, height: 2, width: rail.length }
          }
        >
          <span
            className="absolute inset-0 bg-ink transition-transform duration-150 ease-out"
            style={{
              transform: rail.vertical ? `scaleY(${shown})` : `scaleX(${shown})`,
              transformOrigin: rail.vertical ? "top" : "left",
            }}
          />
        </span>
      ) : null}

      {steps.map((step, index) => {
        // Before mount we don't know the device: render closed, never "typing".
        const open = !ready
          ? false
          : reduce
            ? true
            : hover
              ? hovered === index
              : reached(index);

        return (
          <MissionCard
            key={step.key}
            step={step}
            index={index}
            open={open}
            instant={reduce}
            lit={reached(index)}
            onOpen={() => hover && setHovered(index)}
            onClose={() => hover && setHovered((current) => (current === index ? null : current))}
            dotRef={(node) => {
              dots.current[index] = node;
            }}
          />
        );
      })}
    </ol>
  );
}
