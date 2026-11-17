import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { adminSignOut } from "../login/actions";
import { requireAdmin } from "@/lib/auth";
import { requireActiveCamp } from "@/lib/camp";
import { BOOTCAMP, bootcampPhase } from "@/lib/bootcamp";
import { campDateRange, daysUntil } from "@/lib/dates";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  const camp = await requireActiveCamp();
  const phase = bootcampPhase();
  const bootcampStatus =
    phase === "upcoming" ? `${daysUntil(BOOTCAMP.startsAt)} days out` : phase === "running" ? "running now" : "finished";

  return (
    <div className="flex min-h-dvh flex-col bg-bone lg:flex-row">
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3 border-b border-white/12 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo className="h-7 w-auto" />
            <span className="display text-lg leading-none">DH Global Admin</span>
          </Link>
        </div>

        <AdminNav role={admin.role} />

        <div className="border-t border-white/12 px-5 py-4 lg:sticky lg:bottom-0 lg:bg-ink">
          <p className="text-sm font-semibold">{admin.name}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
            {admin.role.replace("_", " ").toLowerCase()}
          </p>
          <form action={adminSignOut} className="mt-3">
            <button
              type="submit"
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 underline underline-offset-4 transition-colors hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-ink/12 bg-paper px-5 py-3.5 sm:px-8">
          <p className="text-sm font-semibold">DH Global Admin</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-45">
            <Link href="/admin/camp" className="hover:text-ink">
              {camp.name} · {campDateRange(camp.startsAt, camp.endsAt)} ·{" "}
              <span className="text-brass">{daysUntil(camp.startsAt)}</span> days out
            </Link>
            <Link href="/admin/bootcamp" className="hover:text-ink">
              Bootcamp · {BOOTCAMP.dateLabel} ·{" "}
              <span className="text-brass">{bootcampStatus}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="px-5 py-7 sm:px-8 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
