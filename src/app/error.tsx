"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center bg-bone px-5 py-20 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <p className="eyebrow text-danger">Something broke</p>
        <h1 className="display mt-5 text-[clamp(2.5rem,9vw,6rem)]">
          That didn&apos;t work
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-70">
          The page failed to load. Try again, if it keeps happening, tell the camp desk at
          dominionhs@gmail.com and quote the reference below.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-ink-45">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="border border-ink bg-ink px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brass hover:border-brass"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-[13px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
