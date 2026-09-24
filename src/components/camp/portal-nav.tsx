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
    <nav aria-label="Camp profile" className="-mx-5 mt-6 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-px bg-ink/12">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block bg-bone px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors",
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
