import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse bg-ink/8", className)}
    />
  );
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-14 w-72" />
      <div className="grid gap-px bg-ink/12 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-paper p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-9 w-28" />
          </div>
        ))}
      </div>
      <div className="border border-ink/12 bg-paper">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="border-b border-ink/10 p-5 last:border-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
        ))}
      </div>
    </div>
  );
}
