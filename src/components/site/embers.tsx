import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Sparks rising behind the Fresh Fire hero and the camp band. Pure CSS (the
 * `ember` keyframe in globals.css), fixed positions so the server and the
 * browser agree, fewer on phones, none for reduced motion.
 */
const EMBERS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 2 + ((i * 7) % 4),
  delay: ((i * 83) % 700) / 100,
  duration: 6 + ((i * 13) % 50) / 10,
  drift: ((i * 29) % 40) - 20,
}));

export function Embers({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("embers pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {EMBERS.map((ember, index) => (
        <span
          key={index}
          style={
            {
              left: `${ember.left}%`,
              width: ember.size,
              height: ember.size,
              animationDelay: `-${ember.delay}s`,
              animationDuration: `${ember.duration}s`,
              "--drift": `${ember.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
