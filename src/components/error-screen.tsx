"use client";

import { useEffect, useState } from "react";
import { isStaleDeploymentError, reloadForNewDeployment } from "@/lib/stale-deploy";
import { cn } from "@/lib/utils";

/**
 * What every error boundary shows. A page left open across a deploy recovers
 * by itself (one silent reload); anything else gets a plain explanation, a
 * retry, and a reference the camp desk can look up.
 */
export function ErrorScreen({
  error,
  reset,
  eyebrow = "Something broke",
  title = "That didn't work",
  message = "The page failed to load. Try again, if it keeps happening, tell the camp desk at dominionhs@gmail.com and quote the reference below.",
  className,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  eyebrow?: string;
  title?: string;
  message?: React.ReactNode;
  className?: string;
}) {
  const stale = isStaleDeploymentError(error);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    // The reload replaces this page. If it was refused (one was tried moments
    // ago), the button below still forces one.
    if (stale && reloadForNewDeployment()) return;
    console.error(error);
  }, [error, stale]);

  function retry() {
    // A stale page can't recover in place: it needs the new build's files.
    if (stale) {
      setReloading(true);
      window.location.reload();
      return;
    }
    reset();
  }

  if (stale) {
    return (
      <Shell className={className}>
        <p className="eyebrow text-brass">Just a second</p>
        <h1 className="display mt-5 text-[clamp(2.5rem,9vw,6rem)]">Updating the page</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-70">
          The site was updated while you had this page open, loading the latest version now.
          Nothing you did went wrong, and nothing was charged.
        </p>
        <Actions onRetry={retry} retryLabel={reloading ? "Reloading…" : "Reload now"} />
      </Shell>
    );
  }

  return (
    <Shell className={className}>
      <p className="eyebrow text-danger">{eyebrow}</p>
      <h1 className="display mt-5 text-[clamp(2.5rem,9vw,6rem)]">{title}</h1>
      <div className="mt-6 max-w-md text-lg leading-relaxed text-ink-70">{message}</div>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-ink-45">Reference: {error.digest}</p>
      ) : null}
      <Actions onRetry={retry} retryLabel="Try again" />
    </Shell>
  );
}

function Shell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center bg-bone px-5 py-20 sm:px-8", className)}>
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </div>
  );
}

function Actions({ onRetry, retryLabel }: { onRetry: () => void; retryLabel: string }) {
  return (
    <div className="mt-9 flex flex-wrap items-center gap-3">
      {/* Home is always the way out, so it leads. A full page load, not a
          client-side hop, since the app may be the thing that's broken. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="inline-flex items-center gap-2 border border-ink bg-ink px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:border-brass hover:bg-brass hover:text-ink"
      >
        Go to the homepage &rarr;
      </a>
      <button
        type="button"
        onClick={onRetry}
        className="border border-ink/25 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-ink"
      >
        {retryLabel}
      </button>
    </div>
  );
}
