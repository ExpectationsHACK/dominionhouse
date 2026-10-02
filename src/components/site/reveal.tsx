"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "left" | "right" | "scale";

const HIDDEN_TRANSFORM: Record<Direction, string> = {
  up: "translateY(32px)",
  left: "translateX(-32px)",
  right: "translateX(32px)",
  scale: "scale(0.95)",
};

const DURATION = 700;

/**
 * Fades and slides content in the first time it scrolls into view.
 *
 * Renders fully visible on the server and on first paint, so no-JS and slow
 * connections never lose content to a stuck "pending" state. Only once
 * mounted does it check whether it's already on screen: off-screen content
 * is hidden and then revealed by IntersectionObserver, on-screen content is
 * left alone so nothing above the fold ever flashes invisible.
 *
 * Once the entrance has played, every inline style is dropped, so a card
 * that is itself a Reveal keeps its own hover transform (card-lift, tilt).
 */
export function Reveal({
  children,
  as: Tag = "div",
  direction = "up",
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  direction?: Direction;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "entering" | "done">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("entering");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (state !== "entering") return;
    const timer = window.setTimeout(() => setState("done"), delay + DURATION + 50);
    return () => window.clearTimeout(timer);
  }, [state, delay]);

  const motion: CSSProperties | undefined =
    state === "hidden"
      ? { opacity: 0, transform: HIDDEN_TRANSFORM[direction] }
      : state === "entering"
        ? { opacity: 1, transitionDelay: `${delay}ms` }
        : undefined;

  return (
    <Tag
      ref={ref}
      className={cn(
        state !== "idle" && state !== "done" && "transition-[opacity,transform] duration-700 ease-[var(--ease-out-expo)]",
        className,
      )}
      style={motion ? { ...style, ...motion } : style}
    >
      {children}
    </Tag>
  );
}
