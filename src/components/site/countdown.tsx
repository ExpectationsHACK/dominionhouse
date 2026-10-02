"use client";

import { useEffect, useState } from "react";
import { remainingUntil, type Remaining } from "@/lib/countdown";
import { cn } from "@/lib/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One odometer wheel: a 0–9 strip slid so the current digit shows. */
function Digit({ value }: { value: number }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden text-center align-top">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-[var(--ease-out-expo)]"
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {DIGITS.map((digit) => (
          <span key={digit} className="block h-[1em] leading-none">
            {digit}
          </span>
        ))}
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
 * second and each digit rolls to its new value like an odometer.
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
        <div key={unit.label} aria-hidden="true" className="flex flex-col">
          <span
            className={cn(
              "display flex leading-none",
              numberClassName,
              index === 0 && accentDays && "text-brass",
            )}
          >
            <Wheels value={unit.value} pad={unit.pad} />
          </span>
          <span className={cn("eyebrow mt-2", labelClassName)}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
