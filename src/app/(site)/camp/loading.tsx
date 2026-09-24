import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24" role="status" aria-label="Loading">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-32 w-full max-w-2xl" />
      <Skeleton className="mt-8 h-5 w-full max-w-xl" />
      <div className="mt-14 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-bone p-7">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-4 h-10 w-32" />
            <Skeleton className="mt-4 h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
