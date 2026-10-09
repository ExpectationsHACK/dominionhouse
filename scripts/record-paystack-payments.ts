/**
 * Records payments made on a Paystack payment page (outside this site)
 * against existing registrants, after confirming each one with Paystack.
 *
 *   npx tsx --conditions=react-server scripts/record-paystack-payments.ts             # dry run
 *   npx tsx --conditions=react-server scripts/record-paystack-payments.ts --commit    # records
 *
 * Credits what the payer chose to pay (Paystack's `requested_amount`), not the
 * fee they covered on top. Safe to run again: a reference already recorded is
 * skipped. Anyone this settles gets their ticket, emailed with the portal link;
 * nobody else is emailed. The `--conditions` flag and the alias below let the
 * site's server-only modules load outside Next.
 */
import "dotenv/config";
import Module from "node:module";

// Next.js resolves "server-only" itself; outside it, use Next's own empty copy.
const resolver = Module as unknown as { _resolveFilename: (request: string, ...rest: unknown[]) => string };
const resolve = resolver._resolveFilename;
resolver._resolveFilename = (request, ...rest) =>
  resolve(request === "server-only" ? "next/dist/compiled/server-only/empty.js" : request, ...rest);

// Links in the email must point at the live site, whatever .env says locally.
process.env.APP_URL = "https://dominionhouse.org";

const REFERENCES = [
  "T365134373432427",
  "T164114313846373",
];

async function main() {
  const commit = process.argv.includes("--commit");
  const { db } = await import("../src/lib/db");
  const { getTotals, issueTicket, sendTicketEmail, statusFor } = await import("../src/lib/registration");

  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key?.startsWith("sk_")) throw new Error("PAYSTACK_SECRET_KEY is not set.");

  for (const reference of REFERENCES) {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const body = await response.json();
    const tx = body.data;
    if (!body.status || tx?.status !== "success") {
      console.log(`${reference}: not a successful Paystack payment, skipped.`);
      continue;
    }

    const email = String(tx.customer?.email ?? "").toLowerCase().trim();
    const registrant = await db.registrant.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    if (!registrant) {
      console.log(`${reference}: no registrant with ${email}, skipped.`);
      continue;
    }
    if (await db.payment.findUnique({ where: { reference: tx.reference } })) {
      console.log(`${reference}: already recorded for ${registrant.firstName} ${registrant.lastName}, skipped.`);
      continue;
    }

    const creditKobo = Number(tx.requested_amount ?? tx.amount);
    const before = await getTotals(registrant.id);
    const after = { paid: before.paidKobo + creditKobo, balance: Math.max(0, before.dueKobo - before.paidKobo - creditKobo) };
    console.log(
      `${registrant.firstName} ${registrant.lastName}: credit NGN ${(creditKobo / 100).toLocaleString()} ` +
        `(paid NGN ${(tx.amount / 100).toLocaleString()} incl. NGN ${(tx.fees / 100).toLocaleString()} Paystack fee) on ${tx.paid_at.slice(0, 10)}; ` +
        `balance NGN ${(before.balanceKobo / 100).toLocaleString()} → NGN ${(after.balance / 100).toLocaleString()}`,
    );
    if (!commit) continue;

    await db.payment.create({
      data: {
        registrantId: registrant.id,
        reference: tx.reference,
        amountKobo: creditKobo,
        method: "PAYSTACK",
        status: "SUCCESS",
        channel: tx.channel ?? null,
        paidAt: new Date(tx.paid_at),
        gatewayRef: String(tx.id),
        gatewayRaw: tx,
        note: `Paid on the Paystack page "2027 FRESH FIRE CAMP - DH"; NGN ${(tx.fees / 100).toLocaleString()} Paystack fee paid on top, not credited.`,
      },
    });

    const totals = await getTotals(registrant.id);
    const status = statusFor(totals, registrant.status);
    if (status !== registrant.status) {
      await db.registrant.update({ where: { id: registrant.id }, data: { status } });
    }
    await db.auditLog.create({
      data: {
        actorLabel: "record-paystack-payments script",
        action: "payment.recorded",
        entity: "Registrant",
        entityId: registrant.id,
        meta: { reference: tx.reference, amountKobo: creditKobo, source: "Paystack payment page" },
      },
    });

    if (totals.isSettled) {
      const ticket = await issueTicket(registrant.id);
      await sendTicketEmail(registrant.id);
      const sent = await db.ticket.findUnique({ where: { id: ticket.id }, select: { emailSentAt: true } });
      console.log(`  → ticket ${ticket.code} issued; email ${sent?.emailSentAt ? "sent" : "NOT sent, check the admin outbox"}.`);
    } else {
      console.log(`  → recorded, status ${status}. No email sent.`);
    }
  }

  if (!commit) console.log("\nDry run, nothing written. Run again with --commit to record.");
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
