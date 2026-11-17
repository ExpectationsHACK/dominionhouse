"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui";

/** Copies text (e.g. every email, comma separated) for pasting into Bcc. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      disabled={!text}
      className={buttonClass({ variant: "outline", size: "sm" })}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy these:", text);
        }
      }}
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
