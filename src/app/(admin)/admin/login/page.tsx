import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./login-form";
import { HillContours } from "@/components/site/hill-contours";
import { Logo } from "@/components/site/logo";
import { Eyebrow } from "@/components/ui";
import { getAdminSession } from "@/lib/session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Staff sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");

  // Only shown while the seeded demo account still has its default password.
  const seeded = await db.adminUser.findUnique({
    where: { email: "admin@dominionhouse.org" },
    select: { id: true },
  });

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-5 py-16 text-white">
      <HillContours className="absolute inset-x-0 bottom-0 h-full w-full text-brass" lines={22} />

      <div className="relative w-full max-w-sm">
        <Logo className="h-12 w-auto" />
        <Eyebrow className="mt-5 text-brass">Dominion House</Eyebrow>
        <h1 className="display mt-4 text-5xl">Camp desk</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          The management system for Fresh Fire Camp Meeting 2027. Staff only.
        </p>

        <div className="mt-9 bg-paper p-6 text-ink">
          <AdminLoginForm />
        </div>

        {seeded ? (
          <p className="mt-5 border border-white/15 px-4 py-3 font-mono text-[11px] leading-relaxed text-white/45">
            Seeded account: admin@dominionhouse.org / DominionHouse2027!
            <br />
            Change this before going live.
          </p>
        ) : null}
      </div>
    </div>
  );
}
