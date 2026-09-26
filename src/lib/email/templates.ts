import { appUrl, CAMP_NAME } from "@/lib/camp";
import { formatKobo } from "@/lib/money";

const INK = "#0b0b0c";
const BONE = "#eef7ff";
const BRASS = "#21a1ff";

/**
 * Every field below that comes from a registration form (names, room notes,
 * announcement text) is free text a person typed, and every template here
 * builds its HTML with plain string interpolation, no JSX escaping to fall
 * back on. Run it through this before it goes anywhere near a template
 * literal, or a crafted name becomes a link, an image, or a broken layout in
 * someone's inbox.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(inner: string, preheader: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${BONE};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BONE};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(11,11,12,.12);">
<tr><td style="background:${INK};padding:20px 28px;">
  <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${BRASS};font-family:ui-monospace,Menlo,monospace;">Dominion House</div>
  <div style="font-size:22px;font-weight:800;letter-spacing:-.02em;text-transform:uppercase;color:#fff;line-height:1.05;margin-top:4px;">${CAMP_NAME}</div>
</td></tr>
<tr><td style="padding:32px 28px;">${inner}</td></tr>
<tr><td style="padding:20px 28px;background:${BONE};border-top:1px solid rgba(11,11,12,.12);font-size:12px;color:#5c5c63;line-height:1.6;">
  Dominion House &middot; ${CAMP_NAME}<br>
  Questions? Reply to this email and the camp desk will pick it up.
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="background:${INK};"><a href="${href}" style="display:inline-block;padding:14px 22px;color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${label} &rarr;</a></td>
  </tr></table>`;
}

function h(text: string) {
  return `<h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;letter-spacing:-.02em;font-weight:800;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#2f2f35;">${text}</p>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(11,11,12,.1);font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#74747c;font-family:ui-monospace,Menlo,monospace;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid rgba(11,11,12,.1);font-size:15px;text-align:right;font-weight:600;">${value}</td>
  </tr>`;
}

function table(rows: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">${rows}</table>`;
}

// ── templates ────────────────────────────────────────────────────────────────

export function registrationReceivedEmail(args: {
  firstName: string;
  registrationCode: string;
  category: string;
  amountDue: number;
  paymentUrl: string;
  portalUrl: string;
}) {
  const firstName = escapeHtml(args.firstName);
  const registrationCode = escapeHtml(args.registrationCode);
  return {
    subject: `You're registered for ${CAMP_NAME}, ${args.registrationCode}`,
    html: shell(
      h(`You're registered, ${firstName}.`) +
        p(
          `Your registration for ${CAMP_NAME} is complete and your place is held. Keep your registration number, you'll be asked for it at the camp desk.`,
        ) +
        table(
          row("Registration no.", registrationCode) +
            row("Ticket type", args.category) +
            row("Camp fee", formatKobo(args.amountDue)) +
            row("Paid so far", formatKobo(0)) +
            row("Balance", formatKobo(args.amountDue)),
        ) +
        p(
          `<strong>Your ticket will be emailed to you once your payment is complete</strong>, that is, when your balance reaches zero. Until then you can pay in full, or start with a part-payment and clear the rest before camp.`,
        ) +
        button(args.paymentUrl, "Make a payment") +
        p(
          `Or <a href="${args.portalUrl}" style="color:${INK};font-weight:600;">open your camp profile</a> to see your balance, payments, room and schedule. <span style="color:#74747c;font-size:13px;">To sign in on another device, use the email address and phone number you registered with, no password needed.</span>`,
        ),
      `You're registered, ${args.registrationCode}. Balance ${formatKobo(args.amountDue)}.`,
    ),
  };
}

export function paymentReceiptEmail(args: {
  firstName: string;
  amountPaid: number;
  totalPaid: number;
  amountDue: number;
  balance: number;
  reference: string;
  portalUrl: string;
}) {
  const settled = args.balance <= 0;
  const firstName = escapeHtml(args.firstName);
  const reference = escapeHtml(args.reference);
  return {
    subject: settled
      ? `Payment received, you're paid in full`
      : `Payment received, ${formatKobo(args.balance)} left to go`,
    html: shell(
      h(settled ? `Paid in full. Thank you, ${firstName}.` : `Payment received, ${firstName}.`) +
        p(
          settled
            ? `Your ${CAMP_NAME} balance is cleared. Your ticket is on its way in a separate email, keep it, it's your entry.`
            : `Here's where your camp account stands after this payment.`,
        ) +
        table(
          row("This payment", formatKobo(args.amountPaid)) +
            row("Reference", reference) +
            row("Total paid", formatKobo(args.totalPaid)) +
            row("Camp fee", formatKobo(args.amountDue)) +
            row("Balance", settled ? "Cleared" : formatKobo(args.balance)),
        ) +
        button(args.portalUrl, settled ? "Open my camp profile" : "Pay the balance"),
      `Payment of ${formatKobo(args.amountPaid)} received.`,
    ),
  };
}

export function ticketEmail(args: {
  firstName: string;
  lastName: string;
  ticketCode: string;
  category: string;
  registrationCode: string;
  qrDataUrl: string;
  portalUrl: string;
  room?: { block: string; name: string; bedLabel?: string | null } | null;
}) {
  const firstName = escapeHtml(args.firstName);
  const lastName = escapeHtml(args.lastName);
  const room = args.room
    ? {
        block: escapeHtml(args.room.block),
        name: escapeHtml(args.room.name),
        bedLabel: args.room.bedLabel ? escapeHtml(args.room.bedLabel) : null,
      }
    : null;

  const stub = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${INK};margin:24px 0;">
  <tr><td style="background:${INK};color:#fff;padding:18px 22px;">
    <img src="${appUrl("/dominion-house-logo.png")}" width="24" height="24" alt="Dominion House" style="display:block;border:0;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.24em;color:${BRASS};text-transform:uppercase;margin-top:8px;">Admit one</div>
    <div style="font-size:24px;font-weight:800;letter-spacing:-.02em;text-transform:uppercase;line-height:1.05;margin-top:6px;">${firstName} ${lastName}</div>
    <div style="font-size:13px;color:#b9b9c0;margin-top:6px;">${args.category} &middot; ${args.registrationCode}</div>
  </td></tr>
  <tr><td style="padding:0;height:1px;background:repeating-linear-gradient(to right, ${INK} 0 6px, transparent 6px 12px);"></td></tr>
  <tr><td style="padding:22px;text-align:center;background:#fff;">
    <img src="${args.qrDataUrl}" width="180" height="180" alt="Ticket QR code" style="display:block;margin:0 auto;border:0;">
    <div style="font-family:ui-monospace,Menlo,monospace;font-size:18px;letter-spacing:.14em;margin-top:14px;font-weight:700;">${args.ticketCode}</div>
    <div style="font-size:12px;color:#74747c;margin-top:6px;">Show this at the gate. One scan, one entry.</div>
  </td></tr>
  ${
    room
      ? `<tr><td style="padding:16px 22px;background:${BONE};border-top:1px solid rgba(11,11,12,.12);font-size:14px;">
          <span style="font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#74747c;">Your room</span><br>
          <strong style="font-size:16px;">${room.block} &middot; ${room.name}${room.bedLabel ? ` &middot; Bed ${room.bedLabel}` : ""}</strong>
        </td></tr>`
      : ""
  }
</table>`;

  return {
    subject: `Your ${CAMP_NAME} ticket, ${args.ticketCode}`,
    html: shell(
      h(`Here's your ticket, ${firstName}.`) +
        p(`You're paid in full and confirmed for ${CAMP_NAME}. This is your entry, save it to your phone.`) +
        stub +
        button(args.portalUrl, "Open my camp profile") +
        p(
          `<span style="color:#74747c;font-size:13px;">Your profile has your schedule, room and payment history. Sign in any time with the email address and phone number you registered with.</span>`,
        ),
      `Ticket ${args.ticketCode}, ${CAMP_NAME}`,
    ),
  };
}

export function roomAssignedEmail(args: {
  firstName: string;
  block: string;
  room: string;
  bedLabel?: string | null;
  roommates: string[];
  portalUrl: string;
}) {
  const firstName = escapeHtml(args.firstName);
  const block = escapeHtml(args.block);
  const room = escapeHtml(args.room);
  const bedLabel = args.bedLabel ? escapeHtml(args.bedLabel) : null;
  const roommates = args.roommates.map(escapeHtml);

  return {
    subject: `Your camp room, ${args.block} ${args.room}`,
    html: shell(
      h(`You've got a room, ${firstName}.`) +
        p(`Accommodation for ${CAMP_NAME} has been assigned.`) +
        table(
          row("Block", block) +
            row("Room", room) +
            (bedLabel ? row("Bed", bedLabel) : "") +
            row("Sharing with", roommates.length ? roommates.join(", ") : "No one yet"),
        ) +
        button(args.portalUrl, "See my room"),
      `Room ${args.block} ${args.room} assigned.`,
    ),
  };
}

export function announcementEmail(args: { title: string; body: string; portalUrl: string }) {
  const title = escapeHtml(args.title);
  return {
    subject: args.title,
    html: shell(
      h(title) +
        args.body
          .split(/\n{2,}/)
          .map((para) => p(escapeHtml(para).replace(/\n/g, "<br>")))
          .join("") +
        button(args.portalUrl, "Open my camp profile"),
      args.body.slice(0, 120),
    ),
  };
}
