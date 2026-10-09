import { ButtonLink } from "@/components/ui";
import { WHATSAPP_GROUP_URL } from "@/lib/church";

/** The WhatsApp mark, drawn inline so it needs no image request. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.37 9.37 0 0 1-1.44-5c0-5.19 4.23-9.42 9.43-9.42a9.36 9.36 0 0 1 6.66 2.76 9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.42 9.42m8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.7 5.84.7 12.1c0 2 .52 3.95 1.52 5.67L.6 23.25l5.6-1.47a11.33 11.33 0 0 0 5.84 1.6c6.25 0 11.35-5.1 11.35-11.36 0-3.03-1.18-5.88-3.33-8.02" />
    </svg>
  );
}

/** Shown once a registration is settled, paid in full, free, or pay-later. */
export function WhatsAppCta() {
  return (
    <div className="border border-[#25D366]/50 bg-[#25D366]/10 px-5 py-5">
      <p className="eyebrow text-ink-45">Stay in the loop</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-70">
        Join the Fresh Fire Camp Meeting WhatsApp group for updates, reminders and everything you
        need to know before you travel.
      </p>
      {/* WhatsApp green with dark text: white on #25D366 is too faint to read.
          Full width with tighter letters on phones, so icon and label stay on
          one line down to 320px screens. */}
      <ButtonLink
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        size="md"
        className="mt-4 w-full justify-center gap-2 whitespace-nowrap border-[#25D366] bg-[#25D366] px-3 tracking-[0.04em] text-ink hover:border-[#1ebe5a] hover:bg-[#1ebe5a] hover:text-ink sm:w-auto sm:gap-2.5 sm:px-5 sm:tracking-[0.1em]"
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0" />
        Join the WhatsApp group
      </ButtonLink>
    </div>
  );
}
