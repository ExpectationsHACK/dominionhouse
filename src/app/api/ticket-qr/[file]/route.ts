import QRCode from "qrcode";
import { appUrl } from "@/lib/camp";

export const runtime = "nodejs";

/** A ticket's QR token: 24 characters from the readable alphabet in codes.ts. */
const FILE = /^([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{24})\.png$/;

/**
 * The ticket QR as a plain PNG, for email. Gmail and most mail apps won't show
 * an image embedded as a data: URL, but they all load an ordinary image link.
 * It draws the same URL the portal's QR does, and a QR never changes, so it
 * can be cached for good.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/ticket-qr/[file]">) {
  const { file } = await ctx.params;
  const match = FILE.exec(file);
  if (!match) return new Response("Not found", { status: 404 });

  const png = await QRCode.toBuffer(appUrl(`/t/${match[1]}`), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: { dark: "#0b0b0cff", light: "#ffffffff" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
