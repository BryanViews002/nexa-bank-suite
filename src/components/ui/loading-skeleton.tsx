import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="nexa-card">
      <div className="space-y-4">
        <LoadingSkeleton className="h-6 w-3/4" />
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              <LoadingSkeleton className="h-8 w-full" />
              <LoadingSkeleton className="h-8 w-full" />
              <LoadingSkeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="nexa-card">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <LoadingSkeleton className="h-6 w-1/3" />
          <LoadingSkeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-4">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4">
              <LoadingSkeleton className="h-8 w-full" />
              <LoadingSkeleton className="h-8 w-full" />
              <LoadingSkeleton className="h-8 w-full" />
              <LoadingSkeleton className="h-8 w-full" />
              <LoadingSkeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuickActionSkeleton() {
  return (
    <div className="nexa-card">
      <LoadingSkeleton className="h-6 w-2/3 mb-4" />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-10 w-full" />
        </div>
        <LoadingSkeleton className="h-10 w-full" />
        <LoadingSkeleton className="h-10 w-full" />
      </div>
    </div>
  );
}