import Link from "next/link";
import { HillContours } from "@/components/site/hill-contours";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-bone px-5 py-20 sm:px-8">
      <HillContours className="absolute inset-x-0 bottom-0 h-3/4 w-full text-ink" lines={12} />
      <div className="relative mx-auto w-full max-w-3xl">
        <p className="eyebrow text-ink-45">Error 404</p>
        <h1 className="display mt-5 text-[clamp(3rem,12vw,9rem)]">
          Nothing
          <br />
          here
        </h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-70">
          That page has moved, or it never existed. Neither is your fault.
        </p>
        <div className="mt-10 flex flex-wrap gap-6">
          {[
            { href: "/", label: "Home" },
            { href: "/camp", label: "Fresh Fire 2027" },
            { href: "/locations", label: "Find a campus" },
            { href: "/portal", label: "My camp profile" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4 hover:text-meridian"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
