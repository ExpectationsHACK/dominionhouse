import { customAlphabet } from "nanoid";
import { createHash, randomInt } from "crypto";

/** Unambiguous alphabet, no 0/O, 1/I/L. Codes get read aloud and typed by hand. */
const READABLE = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const nano = customAlphabet(READABLE, 6);

/** FFC27-4KQ8ZM, printed on the ticket and quoted in every email. */
export function registrationCode(): string {
  return `FFC27-${nano()}`;
}

/** TKT-FFC-27-D6D40, the human-readable ticket number. */
export function ticketCode(): string {
  return `TKT-FFC-27-${customAlphabet(READABLE, 5)()}`;
}

/** Opaque payload embedded in the QR. Not guessable, not sequential. */
export function qrPayload(): string {
  return customAlphabet(READABLE, 24)();
}

export function paymentReference(prefix = "DHC27"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${customAlphabet(READABLE, 6)()}`;
}

/** Six digits, cryptographically random, leading zeros preserved. */
export function loginCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCode(code: string): string {
  return createHash("sha256")
    .update(`${code}:${process.env.AUTH_SECRET ?? "dev"}`)
    .digest("hex");
}
