import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { Arrow } from "@/components/ui";
import { CAMPUSES, CHURCH, CONTACT_EMAIL, COUNTRY_COUNT, HEAD_CAMPUS } from "@/lib/church";

const COLUMNS = [
  {
    heading: "Visit",
    links: [
      { href: "/locations", label: "All campuses" },
      { href: "/locations#lagos", label: "Lagos" },
      { href: "/locations", label: "Plan a visit" },
    ],
  },
  {
    heading: "Fresh Fire 27",
    links: [
      { href: "/camp", label: "Overview" },
      { href: "/camp/register", label: "Register" },
      { href: "/camp/payment", label: "Make a payment" },
      { href: "/portal", label: "My camp profile" },
    ],
  },
  {
    heading: "The house",
    links: [
      { href: "/vision", label: "Our vision" },
      { href: "/vision#pillars", label: "The seven pillars" },
      { href: "/events", label: "What's on" },
      { href: "/give", label: "Give" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo className="h-14 w-auto" />
            <p className="display mt-5 text-5xl sm:text-6xl">
              Dominion
              <br />
              House
            </p>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] text-brass">
              {CHURCH.strapline}
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
              A new frontier church raising kingdom leaders, {CAMPUSES.length} campuses across{" "}
              {COUNTRY_COUNT} countries, reaching the world one person and one community at a time.
            </p>
            <Link
              href="/camp/register"
              className="mt-7 inline-flex items-center gap-2 border border-brass bg-brass px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-white hover:border-white"
            >
              Register for Fresh Fire 27 <Arrow />
            </Link>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <p className="eyebrow text-brass">{column.heading}</p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/65 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-white/12 pt-6">
          <p className="eyebrow text-white/40">Legacy Center</p>
          <address className="mt-2 text-sm not-italic text-white/60">
            {HEAD_CAMPUS.address}
          </address>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/60">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="transition-colors hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
            {HEAD_CAMPUS.phones.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="transition-colors hover:text-white"
              >
                {phone}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
            © {new Date().getFullYear()} Dominion House
          </p>
          <Link
            href="/admin"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-white"
          >
            Staff sign-in
          </Link>
        </div>
      </div>
    </footer>
  );
}
