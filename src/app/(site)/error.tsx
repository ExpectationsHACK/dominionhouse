"use client";

import { ErrorScreen } from "@/components/error-screen";

/** Inside the site layout, so the header and footer stay put around the error. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen error={error} reset={reset} className="min-h-[70svh]" />;
}
