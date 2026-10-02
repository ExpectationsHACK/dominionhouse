import { Fragment } from "react";
import { cn } from "@/lib/utils";

type Word = string | { text: string; className?: string };

/**
 * A headline whose words rise in one after another on load. Pure CSS (the
 * `rise-in` keyframe), so it starts with first paint and needs no JS.
 * Each line is an array of words; lines break with <br>.
 */
export function StaggerWords({
  lines,
  step = 80,
  start = 0,
}: {
  lines: Word[][];
  /** Milliseconds between consecutive words. */
  step?: number;
  /** Milliseconds before the first word. */
  start?: number;
}) {
  let index = 0;

  return (
    <>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {line.map((word, wordIndex) => {
            const text = typeof word === "string" ? word : word.text;
            const className = typeof word === "string" ? undefined : word.className;
            const delay = start + index++ * step;
            return (
              <Fragment key={wordIndex}>
                {wordIndex > 0 ? " " : null}
                <span
                  className={cn("rise-in inline-block", className)}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {text}
                </span>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}
