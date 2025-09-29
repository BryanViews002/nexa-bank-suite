import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceChartProps {
  data: Array<{
    date: string;
    balance: number;
    change?: number;
  }>;
  height?: number;
}

export function BalanceChart({ data, height = 300 }: BalanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No balance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall trend
  const firstBalance = data[0]?.balance || 0;
  const lastBalance = data[data.length - 1]?.balance || 0;
  const overallChange = lastBalance - firstBalance;
  const changePercent = firstBalance > 0 ? ((overallChange / firstBalance) * 100).toFixed(1) : '0.0';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-success">
            Balance: ${payload[0].value.toLocaleString()}
          </p>
          {payload[0].payload.change && (
            <p className={`text-sm ${payload[0].payload.change >= 0 ? 'text-success' : 'text-error'}`}>
              Change: {payload[0].payload.change >= 0 ? '+' : ''}${payload[0].payload.change.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Balance Trend</CardTitle>
          <div className={`flex items-center gap-1 text-sm ${overallChange >= 0 ? 'text-success' : 'text-error'}`}>
            {overallChange >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>
              {overallChange >= 0 ? '+' : ''}${overallChange.toLocaleString()} ({changePercent}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}