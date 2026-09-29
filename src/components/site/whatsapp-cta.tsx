import { Arrow, ButtonLink } from "@/components/ui";
import { WHATSAPP_GROUP_URL } from "@/lib/church";

/** Shown once a registration is settled, paid in full, free, or pay-later. */
export function WhatsAppCta() {
  return (
    <div className="border border-meridian/40 bg-brass-soft px-5 py-5">
      <p className="eyebrow text-ink-45">Stay in the loop</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-70">
        Join the Fresh Fire Camp Meeting WhatsApp group for updates, reminders and everything you
        need to know before you travel.
      </p>
      <ButtonLink
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        size="md"
        className="mt-4"
      >
        Join the WhatsApp group <Arrow />
      </ButtonLink>
    </div>
  );
}
