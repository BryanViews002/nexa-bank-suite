import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
  /** Stroke colour as a CSS colour value. Defaults to the brand accent. */
  stroke?: string;
  strokeWidth?: number;
  /** Draws a soft gradient beneath the line. */
  filled?: boolean;
  /** Marks the final point with a dot. */
  showEndDot?: boolean;
}

/**
 * A dependency-free trend line. Recharts is overkill at this size and ships a
 * container that fights small fixed-height parents, so the geometry is done by
 * hand. Renders in a normalised viewBox and stretches to fit its parent.
 */
export function Sparkline({
  data,
  className,
  stroke = "hsl(var(--primary))",
  strokeWidth = 2,
  filled = true,
  showEndDot = false,
}: SparklineProps) {
  const gradientId = useId();

  const geometry = useMemo(() => {
    const points = data.filter((n) => Number.isFinite(n));
    if (points.length < 2) return null;

    const W = 100;
    const H = 32;
    // Inset vertically so the stroke and end dot are never clipped.
    const pad = 3;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min;

    const toX = (i: number) => (i / (points.length - 1)) * W;
    // A flat series would divide by zero — park it on the centre line instead.
    const toY = (v: number) => (span === 0 ? H / 2 : H - pad - ((v - min) / span) * (H - pad * 2));

    const coords = points.map((v, i) => [toX(i), toY(v)] as const);

    // Catmull-Rom control points give a smooth curve without overshooting the
    // data the way a naive cubic through every point does.
    let line = `M ${coords[0][0]},${coords[0][1]}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i - 1] ?? coords[i];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] ?? p2;

      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;

      line += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
    }

    return {
      line,
      area: `${line} L ${W},${H} L 0,${H} Z`,
      end: coords[coords.length - 1],
      viewBox: `0 0 ${W} ${H}`,
    };
  }, [data]);

  if (!geometry) return null;

  return (
    <svg
      viewBox={geometry.viewBox}
      preserveAspectRatio="none"
      className={cn("h-full w-full overflow-visible", className)}
      aria-hidden="true"
    >
      {filled && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={geometry.area} fill={`url(#${gradientId})`} stroke="none" />
        </>
      )}

      <path
        d={geometry.line}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        // preserveAspectRatio="none" would stretch the stroke with the box.
        vectorEffect="non-scaling-stroke"
      />

      {showEndDot && (
        <circle
          cx={geometry.end[0]}
          cy={geometry.end[1]}
          r="2.5"
          fill={stroke}
          stroke="hsl(var(--card))"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

export default Sparkline;
