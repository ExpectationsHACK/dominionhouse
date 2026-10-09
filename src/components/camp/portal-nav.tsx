"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/ticket", label: "Ticket" },
  { href: "/portal/payments", label: "Payments" },
  { href: "/portal/room", label: "Room" },
  { href: "/portal/schedule", label: "Schedule" },
] as const;

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Camp profile" className="mt-6">
      {/* Phones: two rows (three tabs, then two) so every tab is in view; a
          sideways-scrolling row hid the last two off screen. One row from sm. */}
      <ul className="flex flex-wrap gap-px bg-ink/12 sm:flex-nowrap">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href} className="grow basis-[calc(33.333%-1px)] sm:grow-0 sm:basis-auto">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block bg-bone px-3 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors sm:px-5",
                  active ? "bg-ink text-white" : "text-ink-45 hover:bg-paper hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
