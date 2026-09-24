import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { requireRegistrant } from "@/lib/auth";
import { campDateRange } from "@/lib/dates";
import { CATEGORY_LABEL } from "@/lib/pricing";
import { ticketQrDataUrl } from "@/lib/registration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INK = "#0b0b0c";
const BLUE = "#21a1ff";

export async function GET() {
  const registrant = await requireRegistrant();
  const ticket = registrant.ticket;

  if (!ticket) return new Response("No ticket yet.", { status: 404 });
  if (ticket.status === "REVOKED") return new Response("This ticket has been revoked.", { status: 403 });

  const [qr, logoBytes] = await Promise.all([
    ticketQrDataUrl(ticket.qrPayload),
    readFile(path.join(process.cwd(), "public", "dominion-house-logo.png")),
  ]);
  const logo = `data:image/png;base64,${logoBytes.toString("base64")}`;

  const room = registrant.roomAssignment
    ? `${registrant.roomAssignment.room.block} ${registrant.roomAssignment.room.name}${
        registrant.roomAssignment.bedLabel ? ` · Bed ${registrant.roomAssignment.bedLabel}` : ""
      }`
    : "Not yet assigned";

  const rows: [string, string][] = [
    ["Ticket", CATEGORY_LABEL[registrant.category]],
    ["Dates", campDateRange(registrant.camp.startsAt, registrant.camp.endsAt)],
    ["Registration", registrant.registrationCode],
    ["Venue", registrant.camp.venue],
    ["Room", room],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: INK,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "72px 72px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={64} height={57} alt="" />
              <div style={{ display: "flex", marginLeft: 20, fontSize: 30, letterSpacing: 6, color: BLUE }}>
                ADMIT ONE
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: "#8a8a92" }}>
              {registrant.camp.name.toUpperCase()}
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 56, fontSize: 96, fontWeight: 800, lineHeight: 1 }}>
            {`${registrant.firstName} ${registrant.lastName}`.toUpperCase()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
            {rows.map(([label, value]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", marginBottom: 26 }}>
                <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#8a8a92" }}>
                  {label.toUpperCase()}
                </div>
                <div style={{ display: "flex", marginTop: 6, fontSize: 38 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            background: "#ffffff",
            color: INK,
            padding: "56px 72px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={420} height={420} alt="" />
          <div style={{ display: "flex", marginTop: 32, fontSize: 24, letterSpacing: 4, color: "#74747c" }}>
            TICKET NUMBER
          </div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 56, fontWeight: 700, letterSpacing: 6 }}>
            {ticket.code}
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: "#74747c" }}>
            Show this at the gate. One scan, one entry.
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1740,
      headers: {
        "Content-Disposition": `attachment; filename="${ticket.code}.png"`,
        "Cache-Control": "private, no-store",
      },
    },
  );
}
