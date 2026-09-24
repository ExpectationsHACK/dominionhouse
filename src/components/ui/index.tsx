import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ── buttons ──────────────────────────────────────────────────────────────────

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 border px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-45";

const BUTTON_VARIANTS = {
  solid: "border-ink bg-ink text-white hover:bg-brass hover:border-brass",
  outline: "border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white",
  brass: "border-brass bg-brass text-ink hover:bg-ink hover:border-ink hover:text-white",
  inverse: "border-white bg-white text-ink hover:bg-brass hover:border-brass",
  ghost: "border-transparent bg-transparent text-ink hover:bg-ink/6",
  danger: "border-danger bg-danger text-white hover:bg-ink hover:border-ink",
} as const;

const BUTTON_SIZES = {
  sm: "px-4 py-2.5 text-[11px]",
  md: "",
  lg: "px-8 py-4.5 text-sm",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

type ButtonLook = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function buttonClass({ variant = "solid", size = "md" }: ButtonLook = {}) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size]);
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & ButtonLook) {
  return <button className={cn(buttonClass({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonLook) {
  return <Link className={cn(buttonClass({ variant, size }), className)} {...props} />;
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="square" />
    </svg>
  );
}

/** The mirror of Arrow, for going back. */
export function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("h-3.5 w-3.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M14 8H3M7 12L3 8l4-4" strokeLinecap="square" />
    </svg>
  );
}

// ── surfaces ─────────────────────────────────────────────────────────────────

export function Panel({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section className={cn("border border-ink/12 bg-paper", className)} {...props}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  action,
  description,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/12 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-45">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow text-ink-45", className)}>{children}</p>;
}

// ── status ───────────────────────────────────────────────────────────────────

const TONES = {
  neutral: "border-ink/15 bg-ink/5 text-ink-70",
  success: "border-success/30 bg-success-soft text-success",
  warn: "border-warn/30 bg-warn-soft text-warn",
  danger: "border-danger/30 bg-danger-soft text-danger",
  brand: "border-meridian/25 bg-meridian-soft text-meridian",
  brass: "border-brass/40 bg-brass-soft text-ink",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const REGISTRATION_TONE: Record<string, Tone> = {
  PENDING: "warn",
  PARTIALLY_PAID: "brass",
  PAID: "success",
  CANCELLED: "danger",
  WAITLISTED: "neutral",
};

export const REGISTRATION_LABEL: Record<string, string> = {
  PENDING: "Unpaid",
  PARTIALLY_PAID: "Part paid",
  PAID: "Paid in full",
  CANCELLED: "Cancelled",
  WAITLISTED: "Waitlisted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={REGISTRATION_TONE[status] ?? "neutral"}>
      {REGISTRATION_LABEL[status] ?? status}
    </Badge>
  );
}

// ── feedback ─────────────────────────────────────────────────────────────────

export function Notice({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border px-4 py-3 text-sm", TONES[tone], className)} role="status">
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-ink/20 px-6 py-14 text-center">
      <p className="display text-2xl">{title}</p>
      {description ? <p className="max-w-sm text-sm text-ink-45">{description}</p> : null}
      {action}
    </div>
  );
}

// ── data ─────────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "brand" | "brass" | "plain";
}) {
  return (
    <div
      className={cn(
        "border border-ink/12 p-5",
        tone === "brand" && "bg-meridian text-white border-meridian",
        tone === "brass" && "bg-brass-soft border-brass/40",
        (!tone || tone === "plain") && "bg-paper",
      )}
    >
      <p
        className={cn(
          "eyebrow",
          tone === "brand" ? "text-brass" : "text-ink-45",
        )}
      >
        {label}
      </p>
      <p className="display mt-3 text-4xl">{value}</p>
      {hint ? (
        <p className={cn("mt-2 text-xs", tone === "brand" ? "text-white/60" : "text-ink-45")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Meter({ percent, tone = "ink" }: { percent: number; tone?: "ink" | "brass" }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-1.5 w-full bg-ink/10"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Payment progress"
    >
      <div
        className={cn("h-full transition-[width] duration-500", tone === "brass" ? "bg-brass" : "bg-ink")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-3 last:border-0">
      <span className="eyebrow text-ink-45">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
