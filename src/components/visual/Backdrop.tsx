import { cn } from "@/lib/utils";

interface BackdropProps {
  className?: string;
  /** Adds a second, lower glow to fill a very tall hero. */
  tall?: boolean;
}

/**
 * Ambient page backdrop: a masked grid plus two soft brand glows.
 *
 * Deliberately static. A cursor-tracking spotlight is the single most
 * recognisable "generated landing page" tell, and it costs a mousemove
 * listener plus a repaint per frame for decoration nobody asked for.
 */
export function Backdrop({ className, tall = false }: BackdropProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {/* Grid, faded out toward the edges so it never ends on a hard line. */}
      <div className="bg-grid mask-fade absolute inset-0 opacity-[0.55]" />

      {/* Primary glow, offset from centre — a perfectly centred glow reads as
          a default, an offset one reads as composed. */}
      <div
        className="absolute -top-[22rem] left-1/2 h-[42rem] w-[64rem] -translate-x-[55%] rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            "radial-gradient(closest-side, hsl(var(--primary) / 0.30), hsl(var(--primary) / 0.06), transparent)",
        }}
      />

      {tall && (
        <div
          className="absolute left-[62%] top-[46rem] h-[34rem] w-[48rem] rounded-full opacity-40 blur-[130px]"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--primary) / 0.20), transparent)",
          }}
        />
      )}

      {/* Settles the top edge into the background colour behind the nav bar. */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </div>
  );
}

export default Backdrop;
