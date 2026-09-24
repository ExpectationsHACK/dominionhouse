"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/generated/prisma/enums";

type NavItem = { href: string; label: string; roles?: AdminRole[] };

const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Camp",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/registrants", label: "Registrants" },
      { href: "/admin/payments", label: "Payments", roles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] },
      { href: "/admin/rooms", label: "Rooms" },
      { href: "/admin/tickets", label: "Tickets" },
      { href: "/admin/check-in", label: "Check-in" },
    ],
  },
  {
    heading: "Programme",
    items: [
      { href: "/admin/schedule", label: "Schedule" },
      { href: "/admin/announcements", label: "Announcements" },
    ],
  },
  {
    heading: "Church",
    items: [
      { href: "/admin/visitors", label: "Visitors" },
      { href: "/admin/content", label: "Website content", roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    heading: "System",
    items: [
      { href: "/admin/emails", label: "Email outbox" },
      { href: "/admin/settings", label: "Settings", roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/users", label: "Staff", roles: ["SUPER_ADMIN"] },
    ],
  },
];

export function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-b border-white/12 px-5 py-3.5 text-left lg:hidden"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-brass">Menu</span>
        <span className="text-sm font-semibold text-white">
          {visible.flatMap((s) => s.items).find((item) => item.href === pathname)?.label ?? "Camp desk"}
        </span>
      </button>

      <nav
        aria-label="Admin"
        className={cn("px-3 pb-6 pt-4 lg:block", open ? "block" : "hidden")}
      >
        {visible.map((section) => (
          <div key={section.heading} className="mb-6 last:mb-0">
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
              {section.heading}
            </p>
            <ul className="space-y-px">
              {section.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-brass font-semibold text-ink"
                          : "text-white/65 hover:bg-white/8 hover:text-white",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
