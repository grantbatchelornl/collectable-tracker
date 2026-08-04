import { formatCurrency } from '@/lib/format';

export default function RawGradedBreakdown({ rawValue, gradedValue, rawCount, gradedCount }) {
  const total = rawValue + gradedValue;
  if (total === 0) return null;

  const rawPercent = total > 0 ? (rawValue / total) * 100 : 0;
  const gradedPercent = total > 0 ? (gradedValue / total) * 100 : 0;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="font-semibold text-sm mb-3">Raw vs Graded</h3>
      <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-3">
        {rawPercent > 0 && (
          <div className="bg-primary" style={{ width: `${rawPercent}%` }} />
        )}
        {gradedPercent > 0 && (
          <div className="bg-gold" style={{ width: `${gradedPercent}%` }} />
        )}
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground">Raw ({rawCount})</p>
          <p className="font-semibold">{formatCurrency(rawValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Graded ({gradedCount})</p>
          <p className="font-semibold">{formatCurrency(gradedValue)}</p>
        </div>
      </div>
    </div>
  );
}