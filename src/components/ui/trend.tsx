import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { percent } from "@/lib/format";

interface TrendBadgeProps {
  /** Change as a ratio, e.g. 0.024 for +2.4%. */
  value: number;
  label?: string;
  className?: string;
  /** Renders without the tinted pill background. */
  bare?: boolean;
}

/**
 * Direction indicator for a change over time. Uses an arrow as well as colour
 * so it still reads for colour-blind users and in greyscale print.
 */
export function TrendBadge({ value, label, className, bare = false }: TrendBadgeProps) {
  const flat = !Number.isFinite(value) || Math.abs(value) < 0.0005;
  const up = value > 0;

  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  const tone = flat
    ? "text-muted-foreground"
    : up
      ? "text-credit"
      : "text-muted-foreground";

  const pill = flat
    ? "bg-muted"
    : up
      ? "bg-credit-muted"
      : "bg-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[13px] font-medium",
        !bare && "rounded-full px-2 py-0.5",
        !bare && pill,
        tone,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
      <span className="tabular">{flat ? "0%" : percent(Math.abs(value))}</span>
      {label && <span className="font-normal text-muted-foreground">{label}</span>}
    </span>
  );
}

export default TrendBadge;
