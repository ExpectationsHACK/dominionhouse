"use client";

import { useEffect, useState } from "react";
import { remainingUntil, type Remaining } from "@/lib/countdown";
import { cn } from "@/lib/utils";

/**
 * One flip-clock digit: when it changes, the new figure flips down into
 * place (the `flip-in` keyframe). Keyed by value, so only digits that
 * actually changed flip.
 */
function Digit({ value }: { value: number }) {
  return (
    <span className="flip-digit relative inline-block h-[1em] w-[0.6em] text-center align-top">
      <span key={value} className="flip-in block h-[1em] leading-none">
        {value}
      </span>
    </span>
  );
}

function Wheels({ value, pad }: { value: number; pad: number }) {
  return (
    <>
      {String(value)
        .padStart(pad, "0")
        .split("")
        .map((char, index, all) => (
          // Keyed from the right, so a day count losing a digit doesn't remount the rest.
          <Digit key={all.length - index} value={Number(char)} />
        ))}
    </>
  );
}

/**
 * A live countdown to camp. The server renders the moment it was built (so
 * the page is never empty and hydration matches); once mounted it ticks every
 * second and each digit that changes flips over like a flip clock.
 */
export function Countdown({
  target,
  initial,
  className,
  numberClassName,
  labelClassName,
  accentDays = true,
}: {
  target: string;
  initial: Remaining;
  className?: string;
  numberClassName?: string;
  labelClassName?: string;
  accentDays?: boolean;
}) {
  const [left, setLeft] = useState(initial);

  useEffect(() => {
    const tick = () => setLeft(remainingUntil(target));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const units = [
    { label: "Days", value: left.days, pad: 2 },
    { label: "Hrs", value: left.hours, pad: 2 },
    { label: "Min", value: left.minutes, pad: 2 },
    { label: "Sec", value: left.seconds, pad: 2 },
  ];

  return (
    <div className={cn("flex items-end gap-4 sm:gap-6", className)}>
      <span className="sr-only">
        {left.days} days, {left.hours} hours and {left.minutes} minutes to go
      </span>
      {units.map((unit, index) => (
        // Each label centred under its own figures; the left pad offsets the
        // letter-spacing trailing the last letter, so it centres by eye too.
        <div key={unit.label} aria-hidden="true" className="flex flex-col items-center">
          <span
            className={cn(
              "display flex leading-none",
              numberClassName,
              index === 0 && accentDays && "text-brass",
            )}
          >
            <Wheels value={unit.value} pad={unit.pad} />
          </span>
          <span className={cn("eyebrow mt-2 pl-[0.18em]", labelClassName)}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
