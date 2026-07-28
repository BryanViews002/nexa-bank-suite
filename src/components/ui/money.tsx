import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { currency, splitCurrency } from "@/lib/format";

/**
 * Counts from the previous value to the next one. Kept here rather than in a
 * generic hook because the only thing we animate is money, and the easing is
 * tuned for it: fast start, long settle, so the final digits are readable.
 */
function useCountUp(target: number, duration = 700, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target);
  // The animation reads its own output as a start point. Holding it in a ref
  // keeps it out of the effect's dependencies, which would otherwise restart
  // the animation on every frame it renders.
  const currentRef = useRef(enabled ? 0 : target);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    const from = currentRef.current;
    const delta = target - from;
    if (delta === 0) return;

    let start: number | undefined;

    const step = (now: number) => {
      if (start === undefined) start = now;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const next = from + delta * eased;

      currentRef.current = next;
      setValue(next);

      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, enabled]);

  return value;
}

interface BalanceDisplayProps {
  value: number;
  className?: string;
  size?: "md" | "lg" | "xl";
  /** Animate from zero on mount and between updates. */
  animate?: boolean;
}

const BALANCE_SIZES = {
  md: { unit: "text-3xl", cents: "text-lg" },
  lg: { unit: "text-4xl sm:text-5xl", cents: "text-2xl sm:text-3xl" },
  xl: { unit: "text-5xl sm:text-6xl", cents: "text-3xl sm:text-4xl" },
} as const;

/**
 * A headline balance. Cents render smaller and dimmer than dollars — the
 * detail that most separates a real banking UI from a formatted number, since
 * it puts the magnitude first and the precision second.
 */
export function BalanceDisplay({ value, className, size = "lg", animate = true }: BalanceDisplayProps) {
  const animated = useCountUp(value, 700, animate);
  const { unit, cents, sign } = splitCurrency(animate ? animated : value);
  const s = BALANCE_SIZES[size];

  return (
    <span
      className={cn("tabular inline-flex items-baseline font-semibold tracking-[-0.03em]", className)}
      // Screen readers get the settled value, not whatever frame we're on.
      aria-label={currency(value)}
    >
      <span aria-hidden="true" className={s.unit}>
        {sign}
        {unit}
      </span>
      <span aria-hidden="true" className={cn("ml-0.5 text-muted-foreground", s.cents)}>
        .{cents}
      </span>
    </span>
  );
}

interface AmountProps {
  value: number;
  /** Force the sign treatment instead of deriving it from the value. */
  credit?: boolean;
  showSign?: boolean;
  className?: string;
}

/**
 * An inline transaction amount. Credits get the positive colour; debits stay
 * in the default text colour rather than red — a normal statement is mostly
 * outflows, and painting them all red reads as a list of failures.
 */
export function Amount({ value, credit, showSign = true, className }: AmountProps) {
  const isCredit = credit ?? value > 0;
  const magnitude = Math.abs(value);

  return (
    <span
      className={cn("tabular font-medium", isCredit ? "text-credit" : "text-foreground", className)}
    >
      {showSign && (isCredit ? "+" : "−")}
      {currency(magnitude)}
    </span>
  );
}

export default BalanceDisplay;
