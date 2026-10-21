"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const PHONE = "(max-width: 767px)";

/** Re-pick the film when the window crosses the phone width (resize, rotation). */
function subscribe(onChange: () => void) {
  const list = window.matchMedia(PHONE);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/** Which film to load, or none (reduced motion, data saver). Client-only. */
function chooseSource(name: string): string | null {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const saveData = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData;
  if (reduceMotion || saveData) return null;
  return mediaUrl(
    `/video/${name}-${window.matchMedia(PHONE).matches ? "mobile" : "desktop"}.mp4`,
  );
}

/**
 * A full-bleed hero film, from public/video/<name>-desktop.mp4 (wide screens)
 * and <name>-mobile.mp4 (a portrait crop for phones), each with a .jpg poster.
 * "hero" is the homepage's aerial footage, "camp-hero" the Fresh Fire page's.
 *
 * The poster paints immediately (and is all a no-JS, reduced-motion or
 * data-saver visitor ever gets); the video is only chosen after mount, so a
 * phone never downloads the desktop file, and fades in once it can play.
 */
export function HeroVideo({
  name = "hero",
  className,
}: {
  name?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const drift = useRef<HTMLDivElement>(null);
  // Null on the server and in the first client render, so hydration matches.
  const src = useSyncExternalStore(
    subscribe,
    () => chooseSource(name),
    () => null,
  );
  // Which file has buffered enough to show; a swapped-in one fades in afresh.
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const ready = readySrc !== null && readySrc === src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    // Autoplay policies check the muted *property*, which React doesn't
    // always reflect from the attribute on a freshly inserted element.
    video.muted = true;
    video.play().catch(() => {});
  }, [src]);

  // #2 Parallax: the film drifts at a quarter of the scroll speed while the
  // hero is on screen, so it reads as sitting deeper than the page. Written
  // straight to the DOM; nothing for reduced motion.
  useEffect(() => {
    const node = drift.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = node.parentElement?.offsetHeight ?? window.innerHeight;
      if (window.scrollY > height) return;
      node.style.transform = `translate3d(0, ${Math.round(window.scrollY * 0.25)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-0 overflow-hidden", className)}
    >
      <div ref={drift} className="absolute inset-0 will-change-transform">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={mediaUrl(`/video/${name}-mobile.jpg`)}
          />
          {/* A plain poster, sized by CSS: next/image's wrapper fights object-cover here. */}
          <img
            src={mediaUrl(`/video/${name}-desktop.jpg`)}
            alt=""
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </picture>
        {src ? (
          <video
            key={src}
            ref={videoRef}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setReadySrc(src)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              ready ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
