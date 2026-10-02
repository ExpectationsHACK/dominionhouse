"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_TILT = 8; // degrees

/**
 * A link card that leans toward the cursor, as if pressed from that corner,
 * and lifts a touch. Mouse only: touch has no hover to lean toward, and
 * reduced motion is honoured by the global transition clamp.
 */
export function TiltCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);

  function onMove(event: React.PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px, y: py });
  }

  return (
    <Link
      href={href}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt(null)}
      className={cn("group block will-change-transform", className)}
      style={{
        transform: tilt
          ? `perspective(900px) rotateX(${-tilt.y * MAX_TILT * 2}deg) rotateY(${tilt.x * MAX_TILT * 2}deg) translateY(-4px)`
          : "perspective(900px)",
        transition: tilt ? "transform 80ms linear" : "transform 600ms var(--ease-out-expo)",
      }}
    >
      {children}
    </Link>
  );
}
