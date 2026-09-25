"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site/logo";
import { Arrow } from "@/components/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/locations", label: "Locations" },
  { href: "/vision", label: "Vision" },
  { href: "/events", label: "Events" },
  { href: "/camp", label: "Fresh Fire 27" },
  { href: "/give", label: "Give" },
] as const;

export function SiteHeader({ signedInFirstName }: { signedInFirstName?: string }) {
  const pathname = usePathname();

  // The menu belongs to the route it was opened on, so navigating away closes
  // it as a consequence of the render rather than needing an effect.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const open = openOnPath === pathname;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/12 bg-bone/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Dominion House, home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <Logo className="h-9 w-auto" priority />
          <span className="display text-xl leading-none">Dominion House</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-5 xl:gap-7 lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors",
                  active ? "text-ink" : "text-ink-45 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/portal"
            className="hidden text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-45 transition-colors hover:text-ink sm:block"
          >
            {signedInFirstName ? `Hi, ${signedInFirstName}` : "My camp"}
          </Link>
          <Link
            href="/camp/register"
            className="hidden items-center gap-2 border border-ink bg-ink px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brass hover:border-brass sm:inline-flex"
          >
            Register <Arrow />
          </Link>

          <button
            type="button"
            onClick={() => setOpenOnPath(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-10 w-10 items-center justify-center border border-ink/20 lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="relative block h-3 w-4">
              <span
                className={cn(
                  "absolute left-0 h-[1.5px] w-4 bg-ink transition-transform duration-200",
                  open ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-3 h-[1.5px] w-4 bg-ink transition-transform duration-200",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <>
          {/* Dims the page beneath the menu; a tap on it closes the menu. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpenOnPath(null)}
            className="absolute inset-x-0 top-full -z-10 h-dvh bg-ink/40 lg:hidden"
          />
          {/* The header (4rem) plus this panel come to at most 80% of the screen height;
              anything longer scrolls inside it. */}
          <div
            id="mobile-nav"
            className="max-h-[calc(80dvh-4rem)] overflow-y-auto border-t border-ink/12 bg-bone lg:hidden"
          >
          <nav aria-label="Mobile" className="mx-auto max-w-[1400px] px-5 py-2 sm:px-8">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="display flex items-center justify-between border-b border-ink/10 py-3 text-xl"
              >
                {item.label}
                <Arrow className="h-4 w-4 text-ink-45" />
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 pb-2">
              <Link
                href="/camp/register"
                className="flex items-center justify-center gap-2 border border-ink bg-ink px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white"
              >
                Register for camp <Arrow />
              </Link>
              <Link
                href="/portal"
                className="flex items-center justify-center gap-2 border border-ink/25 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em]"
              >
                {signedInFirstName ? (
                  <>
                    Hi, {signedInFirstName} <Arrow /> Check your camp profile
                  </>
                ) : (
                  <>
                    My camp profile <Arrow />
                  </>
                )}
              </Link>
            </div>
          </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
