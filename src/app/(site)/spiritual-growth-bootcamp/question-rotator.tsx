"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const INTERVAL = 3000;

/**
 * The hero's questions, a set at a time: every 3 s the set fades out and the
 * next rises in line by line, looping. Only the current set is visible; every
 * set stays in the HTML for search engines. Pauses on hover and focus, and in
 * a hidden tab. With reduced motion the sets still change, without movement.
 */
export function QuestionRotator({ sets }: { sets: readonly (readonly string[])[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (paused || sets.length < 2) return;
    const timer = window.setTimeout(() => {
      if (document.hidden) {
        setCycle((n) => n + 1);
        return;
      }
      setActive((index) => (index + 1) % sets.length);
    }, INTERVAL);
    return () => window.clearTimeout(timer);
  }, [active, paused, cycle, sets.length]);

  // Resuming starts the set's 3 s (and its bar) again.
  function resume() {
    setPaused(false);
    setCycle((n) => n + 1);
  }

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={resume}
      onFocus={() => setPaused(true)}
      onBlur={resume}
    >
      <div className="grid">
        {sets.map((set, setIndex) => {
          const on = setIndex === active;
          return (
            <ul
              key={setIndex}
              aria-hidden={on ? undefined : true}
              className={cn(
                "space-y-2 text-lg leading-relaxed text-white/80 [grid-area:1/1]",
                on ? "relative z-10" : "pointer-events-none select-none",
              )}
            >
              {set.map((question, index) => (
                <li
                  key={question}
                  style={{ transitionDelay: on ? `${120 + index * 110}ms` : "0ms" }}
                  className={cn(
                    "flex gap-3 transition-[opacity,transform,filter] duration-500 ease-out",
                    on ? "translate-y-0 opacity-100 blur-0" : "translate-y-3 opacity-0 blur-[2px]",
                    "motion-reduce:translate-y-0 motion-reduce:blur-0 motion-reduce:transition-none",
                  )}
                >
                  <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 bg-brass" />
                  {question}
                </li>
              ))}
            </ul>
          );
        })}
      </div>

      {sets.length > 1 ? (
        <div className="mt-5 flex gap-2">
          {sets.map((_, setIndex) => (
            <button
              key={setIndex}
              type="button"
              onClick={() => setActive(setIndex)}
              aria-label={`Show questions set ${setIndex + 1} of ${sets.length}`}
              aria-pressed={setIndex === active}
              className="group relative h-6 w-10 cursor-pointer"
            >
              <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden bg-white/20">
                {setIndex === active ? (
                  <span
                    key={`${active}-${cycle}`}
                    className="sgb-progress absolute inset-y-0 left-0 bg-brass"
                    style={{ animationDuration: `${INTERVAL}ms`, animationPlayState: paused ? "paused" : "running" }}
                  />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
