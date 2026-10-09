"use client";

import { useRef, useState } from "react";
import { CardCarousel } from "@/components/site/card-carousel";
import type { Testimony } from "@/lib/testimonies";

/**
 * Testimonies as portrait cards: the person, the camp it happened at, and one
 * line from their story. The full testimony opens in a dialog, so a long story
 * is there for anyone who wants it without stretching every card to fit.
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
            className="card-lift flex w-[82vw] flex-col overflow-hidden border border-white/12 bg-white/[0.04] sm:w-[360px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {/* Local files, already sized for these cards. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.name}
                draggable={false}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent"
              />
              <p className="absolute left-5 top-5 bg-brass px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
                {item.camp}
              </p>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="display text-3xl leading-none">{item.name}</p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-brass">
                  {item.title}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="text-[17px] leading-relaxed text-white/85">&ldquo;{item.quote}&rdquo;</p>
              <button
                type="button"
                onClick={() => show(item.id)}
                className="mt-auto self-start pt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-brass underline-offset-4 hover:underline"
              >
                Read the full story &rarr;
              </button>
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
                <h3 id="testimony-title" className="display mt-1 text-3xl leading-tight sm:text-4xl">
                  {open.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-ink-70">{open.name}</p>
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
