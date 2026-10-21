import { Highlight } from "@/components/site/motion";

/**
 * Wraps every occurrence of `word` in a string with a Highlight. Lives
 * outside motion.tsx ("use client") so Server Components can call it.
 */
export function highlightWord(text: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "i"));
  return parts.map((part, index) =>
    part.toLowerCase() === word.toLowerCase() ? <Highlight key={index}>{part}</Highlight> : part,
  );
}
