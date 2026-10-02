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
 * The 5D strategy as compact cards that open themselves.
 *
 * A progress rail draws through the cards as the section scrolls into view
 * (across the row on wide screens, down the column on phones). When it reaches
 * a card, the block of squares scatters and the words rise out of a blur, one
 * after another. Once open, a card stays open.
 *
 * Hover is decoration only: the card tilts toward the cursor and a sheen
 * passes over it. The text is always laid out, invisible until revealed, so
 * opening never changes a card's size. Reduced motion shows it all at once.
 */

/** Light to deep: the strategy reads as a progression, D1 to D5. */
const SHADES = [
  { bg: "#a8dbff", text: "text-ink", muted: "text-ink/70", art: "text-white", dot: "bg-[#a8dbff]", glow: "rgba(168,219,255,0.55)" },
  { bg: "#5cbcff", text: "text-ink", muted: "text-ink/70", art: "text-white", dot: "bg-[#5cbcff]", glow: "rgba(92,188,255,0.55)" },
  { bg: "#21a1ff", text: "text-ink", muted: "text-ink/75", art: "text-ink", dot: "bg-[#21a1ff]", glow: "rgba(33,161,255,0.55)" },
  { bg: "#1170c9", text: "text-white", muted: "text-white/90", art: "text-brass", dot: "bg-[#1170c9]", glow: "rgba(17,112,201,0.55)" },
  { bg: "#0a3d75", text: "text-white", muted: "text-white/85", art: "text-brass", dot: "bg-[#0a3d75]", glow: "rgba(10,61,117,0.6)" },
] as const;

/** Gap between one word surfacing and the next. */
const WORD_STEP_MS = 22;
/** Words wait this long, so the squares are mostly gone first. */
const WORDS_START_MS = 260;
const MAX_TILT = 6;

const COLS = 10;
const ROWS = 5;
const CELL = 20;

function noise(row: number, col: number, seed: number) {
  const value = Math.sin(row * 12.9898 + col * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

/** The block of squares that sits where the text will appear, then scatters. */
function PixelDissolve({ seed, className }: { seed: number; className?: string }) {
  const squares: { x: number; y: number; opacity: number; delay: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const checker = (row + col) % 2 === 0;
      const survives = noise(row, col, seed) > row / (ROWS + 1);
      if (row === 0 ? true : checker && survives) {
        squares.push({
          x: col * CELL + 2,
          y: row * CELL + 2,
          opacity: 1 - row / (ROWS + 1),
          delay: Math.round(noise(col, row, seed + 7) * 320),
        });
      }
    }
  }
  return (
    <svg
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      aria-hidden="true"
      className={cn("pixel-dissolve block w-full max-w-[16rem]", className)}
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
          style={{ transitionDelay: `${square.delay}ms` }}
        />
      ))}
    </svg>
  );
}

/** Text split into words that surface one by one, starting at `from`. */
function Words({ text, from }: { text: string; from: number }) {
  return text.split(/\s+/).map((word, index, all) => (
    <span key={index}>
      <span
        className="reveal-word"
        style={{ transitionDelay: `${WORDS_START_MS + (from + index) * WORD_STEP_MS}ms` }}
      >
        {word}
      </span>
      {index < all.length - 1 ? " " : null}
    </span>
  ));
}

const wordCount = (text: string) => text.split(/\s+/).length;

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

function MissionCard({
  step,
  index,
  open,
  lit,
  canTilt,
  dotRef,
}: {
  step: Step;
  index: number;
  open: boolean;
  lit: boolean;
  canTilt: boolean;
  dotRef: (node: HTMLSpanElement | null) => void;
}) {
  const shade = SHADES[index % SHADES.length];
  const cardRef = useRef<HTMLDivElement>(null);
  const summaryWords = wordCount(step.summary);
  const bodyWords = wordCount(step.body);

  function tilt(event: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!canTilt || !card || event.pointerType !== "mouse") return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    card.style.setProperty("--rx", `${(-y * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${(x * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty("--lift", "-6px");
    card.style.boxShadow = `0 26px 50px -22px ${shade.glow}`;
  }

  function settle() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--lift", "0px");
    card.style.boxShadow = "";
  }

  return (
    <li className="relative">
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
        ref={cardRef}
        data-open={open}
        onPointerMove={tilt}
        onPointerLeave={settle}
        className={cn("tilt-sheen relative flex h-full flex-col overflow-hidden p-5 sm:p-6", shade.text)}
        style={{ backgroundColor: shade.bg }}
      >
        <p className={cn("font-mono text-sm font-semibold", shade.muted)}>{step.key}</p>
        <h3 className="display mt-2 text-3xl sm:text-4xl">{step.name}</h3>

        <div className="relative mt-5 flex-1">
          {/* Transparent until revealed, but always in the page, so screen
              readers and search engines get the full text either way. */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em]">
              <Words text={step.summary} from={0} />
            </p>
            <p className={cn("mt-3 text-[13px] leading-relaxed sm:text-sm", shade.muted)}>
              <Words text={step.body} from={summaryWords} />
            </p>
            {step.scripture ? (
              <p className={cn("mt-4 font-mono text-[11px] uppercase tracking-[0.14em]", shade.muted)}>
                <Words text={step.scripture} from={summaryWords + bodyWords + 4} />
              </p>
            ) : null}
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <PixelDissolve seed={index + 1} className={shade.art} />
          </div>
        </div>
      </div>
    </li>
  );
}

export function MissionCards({ steps }: { steps: readonly Step[] }) {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)", false);
  // False until hydrated: the server can't know how far down the page is.
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const listRef = useRef<HTMLOListElement>(null);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const [rail, setRail] = useState<{ x: number; y: number; length: number; vertical: boolean } | null>(null);
  const [progress, setProgress] = useState(0);

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
      // A column fills to wherever 65% down the screen is; a row fills as the
      // section rises through the lower part of the screen.
      const next = rail.vertical ? (vh * 0.65 - top) / rail.length : (vh * 0.9 - top) / (vh * 0.35);
      // Only ever forward: an opened card stays open on the way back up.
      setProgress((current) => Math.max(current, Math.min(1, Math.max(0, next))));
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

  // Reduced motion: the rail is simply drawn, every card open.
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
            className="absolute inset-0 bg-ink transition-transform duration-300 ease-out"
            style={{
              transform: rail.vertical ? `scaleY(${shown})` : `scaleX(${shown})`,
              transformOrigin: rail.vertical ? "top" : "left",
            }}
          />
        </span>
      ) : null}

      {steps.map((step, index) => (
        <MissionCard
          key={step.key}
          step={step}
          index={index}
          // Before hydration the scroll position is unknown: stay closed.
          open={ready && reached(index)}
          lit={ready && reached(index)}
          canTilt={canHover && !reduce}
          dotRef={(node) => {
            dots.current[index] = node;
          }}
        />
      ))}
    </ol>
  );
}
