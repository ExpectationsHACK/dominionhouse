import type { Metadata } from "next";
import Link from "next/link";
import { VisitForm } from "./visit-form";
import { HillContours } from "@/components/site/hill-contours";
import { Eyebrow, Notice } from "@/components/ui";
import {
  CAMPUSES,
  COUNTRY_COUNT,
  INTERNATIONAL_CAMPUSES,
  LAGOS_CAMPUSES,
  type Campus,
} from "@/lib/church";

export const metadata: Metadata = {
  title: "Locations",
  description:
    "Dominion House gathers at nine lighthouses across Nigeria, the United Kingdom, Canada and Trinidad. Find the one nearest you and tell us you're coming.",
};

type SearchParams = Promise<{ campus?: string }>;

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { campus } = await searchParams;
  const preselected = CAMPUSES.find((item) => item.slug === campus)?.name ?? "";

  return (
    <>
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink/12 bg-meridian text-white">
        <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={16} />
        <div className="relative mx-auto max-w-[1400px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
          <Eyebrow className="text-brass">
            {CAMPUSES.length} lighthouses · {COUNTRY_COUNT} countries
          </Eyebrow>
          <h1 className="display mt-5 text-[clamp(2.5rem,9vw,7.5rem)]">
            Find your
            <br />
            lighthouse
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
            Come as you are. Tell us you&apos;re coming and someone from that lighthouse will be looking
            out for you, no forms at the door, no spotlight.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_440px]">
        <div className="space-y-14">
          <CampusGroup
            heading="Lagos, Nigeria"
            count={LAGOS_CAMPUSES.length}
            campuses={LAGOS_CAMPUSES}
          />
          <CampusGroup
            heading="International"
            count={INTERNATIONAL_CAMPUSES.length}
            campuses={INTERNATIONAL_CAMPUSES}
          />

          <Notice tone="neutral" title="When we gather">
            Sunday Worship Experience at 10:00 AM, and Night of Encounters on Thursdays at 6:00 PM.
            Some lighthouses vary, so call or email yours to confirm before you set out.{" "}
            <Link href="/events" className="font-semibold underline underline-offset-4">
              See the full week
            </Link>
            .
          </Notice>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-ink/12 bg-paper p-6 sm:p-7">
            <Eyebrow>Let us know</Eyebrow>
            <h2 className="display mt-3 text-3xl">We&apos;ll look out for you</h2>
            <div className="mt-6">
              <VisitForm defaultCampus={preselected} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function CampusGroup({
  heading,
  count,
  campuses,
}: {
  heading: string;
  count: number;
  campuses: Campus[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/12 pb-3">
        <h2 className="display text-3xl">{heading}</h2>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
          {count} {count === 1 ? "lighthouse" : "lighthouses"}
        </p>
      </div>

      <ul className="mt-6 grid gap-px bg-ink/12 sm:grid-cols-2">
        {campuses.map((campus) => (
          <li key={campus.slug} className="flex flex-col bg-bone p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="display text-2xl">{campus.name}</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass">
                {campus.country}
              </span>
            </div>

            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-70">
              {campus.address}
            </address>

            <dl className="mt-5 space-y-2 border-t border-ink/12 pt-4 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <dt className="eyebrow text-ink-45">Email</dt>
                <dd className="min-w-0">
                  <a
                    href={`mailto:${campus.email}`}
                    className="break-all underline underline-offset-4 hover:text-meridian"
                  >
                    {campus.email}
                  </a>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <dt className="eyebrow text-ink-45">Phone</dt>
                <dd>
                  {campus.phones.length === 0 ? (
                    <span className="text-ink-45">Use email for this lighthouse</span>
                  ) : (
                    campus.phones.map((phone, index) => (
                      <span key={phone}>
                        {index > 0 ? <span className="text-ink-45"> · </span> : null}
                        <a
                          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                          className="whitespace-nowrap underline underline-offset-4 hover:text-meridian"
                        >
                          {phone}
                        </a>
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `Dominion House ${campus.name}, ${campus.address}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex text-[11px] font-semibold uppercase tracking-[0.1em] underline underline-offset-4"
            >
              Open in maps
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
