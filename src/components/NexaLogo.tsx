import { cn } from "@/lib/utils";

interface NexaLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: "h-7 w-7", radius: "rounded-[7px]", text: "text-[15px]" },
  md: { box: "h-8 w-8", radius: "rounded-lg", text: "text-[17px]" },
  lg: { box: "h-10 w-10", radius: "rounded-[11px]", text: "text-xl" },
} as const;

/**
 * The mark is an N drawn as a single continuous stroke that rises on its
 * diagonal — a ledger line moving up, which is the one thing a bank's logo
 * should say. Rendered as a gradient tile so it stays legible on any surface.
 */
export function NexaLogo({ size = "md", showText = true, className }: NexaLogoProps) {
  const s = SIZES[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden",
          s.box,
          s.radius,
          "bg-gradient-to-br from-primary to-primary-hover",
          "shadow-[0_1px_2px_hsl(224_40%_2%_/_0.3),inset_0_1px_0_hsl(0_0%_100%_/_0.25)]",
        )}
      >
        <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden="true">
          <path
            d="M10.5 22V11.2c0-.75.92-1.1 1.42-.55L21.5 21V10"
            fill="none"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {showText && (
        <span className={cn("font-semibold leading-none tracking-[-0.02em] text-foreground", s.text)}>Nexa</span>
      )}
    </span>
  );
}

export default NexaLogo;
