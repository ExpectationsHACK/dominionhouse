import Image from "next/image";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

/**
 * The signature element of this build.
 *
 * One component, three lives: the registrant's portal, the ticket email (as
 * table HTML in lib/email/templates.ts) and the admin scan screen. Perforation
 * is a real repeating gradient, not a border-radius trick, it reads as a torn
 * stub at every size.
 */
export function TicketStub({
  name,
  category,
  registrationCode,
  ticketCode,
  qrDataUrl,
  campName,
  dates,
  venue,
  room,
  status = "VALID",
  className,
}: {
  name: string;
  category: string;
  registrationCode: string;
  ticketCode: string;
  qrDataUrl: string;
  campName: string;
  dates: string;
  venue: string;
  room?: { block: string; name: string; bedLabel?: string | null } | null;
  status?: "VALID" | "CHECKED_IN" | "REVOKED";
  className?: string;
}) {
  const revoked = status === "REVOKED";

  return (
    <article
      className={cn(
        "relative overflow-hidden border border-ink bg-ink text-white",
        revoked && "opacity-60",
        className,
      )}
    >
      <div className="px-6 pt-6 pb-5 sm:px-8 sm:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo className="h-6 w-auto" />
            <p className="eyebrow text-brass">Admit one</p>
          </div>
          <p className="eyebrow text-white/45">{campName}</p>
        </div>

        <h2 className="display mt-4 text-4xl sm:text-5xl">{name}</h2>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Cell label="Ticket" value={category} />
          <Cell label="Dates" value={dates} />
          <Cell label="Registration" value={registrationCode} mono />
          <Cell label="Venue" value={venue} className="col-span-2 sm:col-span-2" />
          {room ? (
            <Cell
              label="Room"
              value={`${room.block} ${room.name}${room.bedLabel ? ` · Bed ${room.bedLabel}` : ""}`}
            />
          ) : (
            <Cell label="Room" value="Not yet assigned" />
          )}
        </dl>
      </div>

      {/* the tear */}
      <div className="relative h-6" aria-hidden="true">
        <span className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bone" />
        <span className="absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-bone" />
        <span className="perforation absolute inset-x-6 top-1/2 h-3.5 -translate-y-1/2 text-white/40" />
      </div>

      <div className="flex flex-col items-center gap-4 bg-white px-6 pb-8 pt-2 text-ink sm:flex-row sm:items-center sm:gap-8 sm:px-8">
        <Image
          src={qrDataUrl}
          alt={`QR code for ticket ${ticketCode}`}
          width={132}
          height={132}
          unoptimized
          className="h-[132px] w-[132px] shrink-0 border border-ink/10"
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="eyebrow text-ink-45">Ticket number</p>
          <p className="mt-1 font-mono text-xl font-bold tracking-[0.16em]">{ticketCode}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-45">
            {status === "CHECKED_IN"
              ? "Already scanned in at the gate. Keep it for your room key."
              : revoked
                ? "This ticket has been revoked. Speak to the camp desk."
                : "Show this at the gate. One scan, one entry."}
          </p>
        </div>
      </div>

      {status !== "VALID" ? (
        <p className="border-t border-ink/10 bg-brass-soft px-6 py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink sm:px-8">
          {status === "CHECKED_IN" ? "Checked in" : "Revoked"}
        </p>
      ) : null}
    </article>
  );
}

function Cell({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="eyebrow text-white/40">{label}</dt>
      <dd className={cn("mt-1 text-sm font-medium", mono && "font-mono tracking-wide")}>{value}</dd>
    </div>
  );
}
