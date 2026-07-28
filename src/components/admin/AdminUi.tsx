import { ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AdminStatusBadge({ value }: { value: string | boolean }) {
  const label = typeof value === "boolean" ? (value ? "Yes" : "No") : value.replaceAll("_", " ");
  const tone =
    value === "APPROVED" || value === "RESOLVED_CUSTOMER" || value === "ACTIVE" || value === true
      ? "border-credit/30 bg-credit/10 text-credit"
      : value === "REJECTED" || value === "CLOSED" || value === "RESOLVED_MERCHANT" || value === false
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : value === "PENDING" || value === "OPEN" || value === "URGENT" || value === "ACCOUNT_LOCKED"
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-border bg-muted/50 text-muted-foreground";

  return (
    <span className={cn("inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold uppercase", tone)}>
      {label}
    </span>
  );
}

export function AdminFailure({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-destructive/30 bg-destructive/10", compact ? "p-4" : "p-6")}>
      <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium">Request failed</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm mt-4">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

export function AdminEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-12 text-center">
      <Inbox className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function AdminTableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border" aria-busy="true">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid h-14 border-b border-border last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, column) => (
            <div key={column} className="flex items-center px-3">
              <span className="h-3 w-full max-w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 0} className="btn btn-secondary btn-sm">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1} className="btn btn-secondary btn-sm">
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}
