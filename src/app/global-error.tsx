"use client";

import { ErrorScreen } from "@/components/error-screen";
import "./globals.css";

/** Only when the root layout itself fails, so it brings its own <html>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <ErrorScreen error={error} reset={reset} className="min-h-dvh" />
      </body>
    </html>
  );
}
