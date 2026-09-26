"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/site/logo";

const SEEN_KEY = "dh-splash-seen";
/** How long the mark is on screen before the curtain lifts, in milliseconds. */
const SHOW_FOR = 1900;
const FADE_FOR = 600;

function subscribe() {
  return () => {};
}

/** Already shown this session, or the visitor asked for less motion: skip it. */
function shouldSkip() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The homepage's opening moment: the Dominion House mark draws in over the
 * house black, a line fills beneath it, then the curtain lifts.
 *
 * It plays once per visit (per browser session) and is skipped for anyone who
 * prefers reduced motion. The server always renders it, so the page never
 * flashes unstyled content behind it, and a CSS animation lifts it on its own,
 * so it can never trap someone whose JavaScript didn't load.
 */
export function SplashLoader() {
  const skip = useSyncExternalStore(subscribe, shouldSkip, () => false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (skip) return;

    const remember = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Private mode: it simply plays again next time.
      }
    }, SHOW_FOR);
    const unmount = window.setTimeout(() => setGone(true), SHOW_FOR + FADE_FOR);

    return () => {
      window.clearTimeout(remember);
      window.clearTimeout(unmount);
    };
  }, [skip]);

  if (skip || gone) return null;

  return (
    <div
      role="status"
      aria-label="Loading Dominion House"
      className="splash fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink"
    >
      <div className="splash-logo">
        <Logo className="h-24 w-auto sm:h-32" priority />
      </div>
      <p className="splash-word mt-6 font-mono text-[11px] uppercase text-white/70">
        Dominion House
      </p>
      <span aria-hidden="true" className="mt-8 block h-px w-40 overflow-hidden bg-white/15">
        <span className="splash-bar block h-full origin-left bg-brass" />
      </span>
    </div>
  );
}
