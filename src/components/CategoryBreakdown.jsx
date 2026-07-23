import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/format';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(239 84% 67%)',
  'hsl(280 65% 60%)',
  'hsl(38 92% 50%)',
];

export default function CategoryBreakdown({ data }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="font-semibold text-sm mb-3">Value by Category</h3>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={56}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.slice(0, 5).map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="font-medium flex-shrink-0 ml-2">{formatCurrency(d.value)}</span>
            </div>
          ))}
          {data.length > 5 && (
            <p className="text-[10px] text-muted-foreground">+{data.length - 5} more</p>
          )}
        </div>
      </div>
    </div>
  );
}