import { cn } from "@/lib/utils";

/**
 * Skeletons mirror the real layout they stand in for. A generic grey block
 * grid that doesn't match what loads causes a visible reflow the moment data
 * arrives, which reads worse than no skeleton at all.
 */
export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="surface p-5">
      <LoadingSkeleton className="h-3.5 w-24" />
      <LoadingSkeleton className="mt-3 h-8 w-36" />
      <LoadingSkeleton className="mt-4 h-12 w-full" />
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <LoadingSkeleton className="h-10 w-10 rounded-lg" />
          <LoadingSkeleton className="h-5 w-14 rounded-full" />
        </div>
        <LoadingSkeleton className="mt-4 h-4 w-20" />
        <LoadingSkeleton className="mt-1.5 h-3 w-16" />
        <LoadingSkeleton className="mt-3 h-7 w-28" />
      </div>
      <div className="border-t border-border px-5 py-3">
        <LoadingSkeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
          <LoadingSkeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <LoadingSkeleton className="h-3.5 w-24" />
            <LoadingSkeleton className="h-3 w-32" />
          </div>
          <LoadingSkeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-8 w-40 rounded-lg" />
      </div>
      <LoadingSkeleton className="mt-5 h-[260px] w-full rounded-lg" />
    </div>
  );
}

/** Full first-paint state for the overview tab. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <LoadingSkeleton className="h-7 w-56" />
        <LoadingSkeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <LoadingSkeleton className="h-3.5 w-24" />
          <LoadingSkeleton className="mt-3 h-11 w-56" />
          <LoadingSkeleton className="mt-5 h-16 w-full" />
        </div>
        <div className="grid gap-4">
          <StatCardSkeleton />
        </div>
      </div>

      <ChartSkeleton />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <LoadingSkeleton className="h-4 w-32" />
          <div className="mt-4">
            <TransactionListSkeleton />
          </div>
        </div>
        <div className="surface p-5">
          <LoadingSkeleton className="h-4 w-28" />
          <LoadingSkeleton className="mt-4 h-11 w-full" />
          <LoadingSkeleton className="mt-3 h-11 w-full" />
          <LoadingSkeleton className="mt-3 h-11 w-full" />
        </div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
