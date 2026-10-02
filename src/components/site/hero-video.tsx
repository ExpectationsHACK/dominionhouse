"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};

/** Which film to load, or none (reduced motion, data saver). Client-only. */
function chooseSource(): string | null {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  if (reduceMotion || saveData) return null;
  return window.matchMedia("(max-width: 767px)").matches
    ? "/video/hero-mobile.mp4"
    : "/video/hero-desktop.mp4";
}

/**
 * The homepage hero film: the last ten seconds of the aerial footage, a
 * 1080p cut for wide screens and a portrait crop for phones.
 *
 * The poster paints immediately (and is all a no-JS, reduced-motion or
 * data-saver visitor ever gets); the video is only chosen after mount, so a
 * phone never downloads the desktop file, and fades in once it can play.
 */
export function HeroVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Null on the server and in the first client render, so hydration matches.
  const src = useSyncExternalStore(noSubscribe, chooseSource, () => null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    // Autoplay policies check the muted *property*, which React doesn't
    // always reflect from the attribute on a freshly inserted element.
    video.muted = true;
    video.play().catch(() => {});
  }, [src]);

  return (
    <div aria-hidden="true" className={cn("absolute inset-0 overflow-hidden", className)}>
      <picture>
        <source media="(max-width: 767px)" srcSet="/video/hero-mobile.jpg" />
        {/* A plain poster, sized by CSS: next/image's wrapper fights object-cover here. */}
        <img
          src="/video/hero-desktop.jpg"
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </picture>
      {src ? (
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}
