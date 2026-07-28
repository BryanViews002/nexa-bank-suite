import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { useThemeColors } from "@/hooks/useThemeColors";
import { currency, currencyCompact } from "@/lib/format";

export interface BalancePoint {
  date: string;
  balance: number;
}

interface BalanceChartProps {
  data: BalancePoint[];
  height?: number;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const value = payload?.[0]?.value;
  if (!active || value == null) return null;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-foreground">{currency(value)}</p>
    </div>
  );
}

export function BalanceChart({ data, height = 260 }: BalanceChartProps) {
  const gradientId = useId();
  const colors = useThemeColors(["primary", "chart-grid", "chart-axis", "card"]);

  if (!data?.length) return null;

  // Recharts' default domain starts at zero, which flattens any real balance
  // history into a straight line. Pad around the actual range instead.
  const values = data.map((d) => d.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max((max - min) * 0.15, max * 0.02, 1);

  const primary = colors.primary ?? "currentColor";

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} stopOpacity={0.28} />
              <stop offset="100%" stopColor={primary} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Horizontal rules only — vertical grid lines add noise to a time
              series without helping anyone read a value. */}
          <CartesianGrid stroke={colors["chart-grid"]} strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: colors["chart-axis"] }}
            tickMargin={12}
            minTickGap={24}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: colors["chart-axis"] }}
            tickFormatter={(value: number) => currencyCompact(value)}
            tickMargin={8}
            width={56}
            domain={[min - pad, max + pad]}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: colors["chart-axis"], strokeWidth: 1, strokeDasharray: "4 4" }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke={primary}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, fill: primary, stroke: colors.card, strokeWidth: 2 }}
            // Re-running the reveal on every filter change is distracting.
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BalanceChart;
