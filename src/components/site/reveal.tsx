"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Direction = "up" | "left" | "right" | "scale";

const HIDDEN_TRANSFORM: Record<Direction, string> = {
  up: "translateY(32px)",
  left: "translateX(-32px)",
  right: "translateX(32px)",
  scale: "scale(0.95)",
};

/**
 * Fades and slides content in the first time it scrolls into view.
 *
 * Renders fully visible on the server and on first paint, no-JS and slow
 * connections never lose content to a stuck "pending" state. Only once
 * mounted does it check whether it's already on screen: off-screen content
 * is hidden and then revealed by IntersectionObserver, on-screen content
 * (already above the fold) is left alone so nothing above the fold ever
 * flashes invisible.
 */
export function Reveal({
  children,
  as: Tag = "div",
  direction = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "visible">("idle");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("visible");
      return;
    }

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      setState("visible");
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hidden = state === "hidden";

  return (
    <Tag
      ref={ref}
      className={cn("duration-700 ease-[var(--ease-out-expo)]", hidden && "transition-[opacity,transform]", className)}
      style={
        hidden
          ? { opacity: 0, transform: HIDDEN_TRANSFORM[direction] }
          : state === "visible"
            ? { opacity: 1, transform: "none", transitionDelay: `${delay}ms` }
            : undefined
      }
    >
      {children}
    </Tag>
  );
}
