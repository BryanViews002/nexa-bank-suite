import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** One sentence saying what to do next — not just "nothing here". */
  description: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Empty states are where most apps give themselves away. Each one names the
 * thing that's missing and offers the next step, rather than reporting a null
 * result back to the user.
 */
export function EmptyState({ icon: Icon, title, description, action, className, size = "md" }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "px-6 py-16" : "px-4 py-10",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 grid place-items-center rounded-full border border-border bg-muted/50 text-muted-foreground",
          size === "md" ? "h-12 w-12" : "h-10 w-10",
        )}
      >
        <Icon className={size === "md" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={1.75} aria-hidden="true" />
      </span>

      <p className={cn("font-medium text-foreground", size === "md" ? "text-base" : "text-sm")}>{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
