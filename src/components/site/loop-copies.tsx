import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * A carousel's cards followed by two copies of them, so the row can keep
 * moving on screens wide enough to show every card at once: useAutoAdvance
 * jumps back by one set whenever the row settles inside the first copy. Two,
 * because on a wide screen one copy can end before the row reaches it.
 *
 * The copies are hidden from screen readers (they get each card once) and
 * marked `data-loop-copy` so the jump knows where a set ends.
 */
export function loopCopies(children: ReactNode): ReactNode[] {
  const cards = Children.toArray(children);
  const copies = [...cards, ...cards].map((card, index) =>
    isValidElement(card)
      ? cloneElement(card as ReactElement<Record<string, unknown>>, {
          key: `loop-copy-${index}`,
          "aria-hidden": true,
          "data-loop-copy": "",
        })
      : card,
  );
  return [...cards, ...copies];
}
