"use client";

import { useRef, useState } from "react";
import { CardCarousel } from "@/components/site/card-carousel";
import type { Testimony } from "@/lib/testimonies";

/**
 * Testimonies as quote cards: a line from the story up top, the person below
 * with their photo as a round profile picture. The full testimony opens in a
 * dialog, so a long story is there without stretching every card to fit.
 */
export function TestimonyStories({ items }: { items: Testimony[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((item) => item.id === openId) ?? null;

  function show(id: string) {
    setOpenId(id);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <CardCarousel label="Fresh Fire testimonies" tone="dark">
        {items.map((item) => (
          <article
            key={item.id}
            className="card-lift flex w-[82vw] flex-col border border-white bg-white text-ink p-6 sm:w-[380px] sm:p-7"
          >
            <span
              aria-hidden="true"
              className="display text-6xl leading-[0.6] text-brass"
            >
              &ldquo;
            </span>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-meridian">
              {item.title}
            </p>
            {/* The testimony itself, trimmed to a few lines; the rest is a tap away. */}
            <p className="mt-3 line-clamp-7 text-[16px] leading-relaxed text-ink-70">
              {item.story.join(" ")}
            </p>
            <button
              type="button"
              onClick={() => show(item.id)}
              className="mt-5 self-start text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0b78c9] underline-offset-4 hover:underline"
            >
              Read the full story &rarr;
            </button>

            <div className="mt-auto pt-6">
              <div className="flex items-center gap-4 border-t border-ink/12 pt-5">
                {/* Local files, already sized; shown as a profile photo. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 shrink-0 rounded-full border-2 border-meridian object-cover object-top"
                />
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-tight">
                    {item.name}
                  </p>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
                    {item.camp}
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </CardCarousel>

      <dialog
        ref={dialogRef}
        onClose={() => setOpenId(null)}
        // A click on the dimmed backdrop (the dialog element itself) closes it.
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        aria-labelledby="testimony-title"
        className="m-auto max-h-[88dvh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto bg-paper p-0 text-ink backdrop:bg-ink/70"
      >
        {open ? (
          <div className="p-6 sm:p-9">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={open.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass">
                  {open.camp}
                </p>
                <h3
                  id="testimony-title"
                  className="display mt-1 text-3xl leading-tight sm:text-4xl"
                >
                  {open.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-ink-70">
                  {open.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center text-2xl leading-none text-ink-45 hover:text-ink"
              >
                &times;
              </button>
            </div>

            <div className="mt-7 space-y-4 border-t border-ink/12 pt-6 text-[16px] leading-relaxed text-ink-70">
              {open.story.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
