import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/format';

export default function PortfolioChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Need more pricing history to show trend
      </p>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(t) => formatDate(t)}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + v)}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            stroke="hsl(var(--border))"
            width={45}
          />
          <Tooltip
            labelFormatter={(t) => formatDate(t)}
            formatter={(v) => [formatCurrency(v), 'Total Value']}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#portfolioGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}