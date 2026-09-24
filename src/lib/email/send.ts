import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";

const API_KEY = process.env.RESEND_API_KEY?.trim() ?? "";
const FROM = process.env.EMAIL_FROM?.trim() || "Dominion House <camp@dominionhouse.org>";

export const emailMode: "live" | "console" = API_KEY ? "live" : "console";

const resend = API_KEY ? new Resend(API_KEY) : null;

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  template: string;
  registrantId?: string | null;
};

/**
 * Every send is written to EmailLog first, so the admin outbox is a complete
 * record whether or not the provider is configured. In console mode nothing
 * leaves the building, the log row plus a terminal line is the delivery.
 */
export async function sendEmail(args: SendArgs) {
  const log = await db.emailLog.create({
    data: {
      to: args.to,
      subject: args.subject,
      template: args.template,
      registrantId: args.registrantId ?? null,
      status: "QUEUED",
    },
  });

  if (!resend) {
    console.info(`[email:console] → ${args.to}, ${args.subject}`);
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date(), providerId: "console" },
    });
    return { ok: true as const, id: log.id };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });

    if (result.error) throw new Error(result.error.message);

    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date(), providerId: result.data?.id ?? null },
    });
    return { ok: true as const, id: log.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email failure";
    await db.emailLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: message },
    });
    console.error(`[email:failed] ${args.to}, ${message}`);
    return { ok: false as const, id: log.id, error: message };
  }
}
