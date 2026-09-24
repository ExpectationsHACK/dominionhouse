import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Admin tables always scroll inside themselves, the page never does. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-ink/12 bg-paper">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-ink/12 bg-bone px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-45",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "border-b border-ink/10 px-4 py-3 align-middle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-bone/70", className)}>{children}</tr>;
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center text-sm text-ink-45">
        {message}
      </td>
    </tr>
  );
}

/** Query-string pagination, keeps every filter in the URL, so links are shareable. */
export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) {
    return (
      <p className="px-1 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
        {total} {total === 1 ? "record" : "records"}
      </p>
    );
  }

  const link = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    query.set("page", String(target));
    return `${basePath}?${query.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-45">
        Page {page} of {pageCount} · {total} records
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={link(page - 1)}
            className="border border-ink/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] hover:border-ink"
          >
            Previous
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link
            href={link(page + 1)}
            className="border border-ink/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] hover:border-ink"
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
