import { useMemo } from 'react';
import { TrendingUp, Award, ArrowDown, ArrowUp, DollarSign, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function BinderStatistics({ checklist, binder, completion, costEstimates }) {
  const stats = useMemo(() => {
    const owned = checklist.filter((i) => i.status === 'owned' && i.collectible);
    const missing = checklist.filter((i) => i.status === 'missing');

    const collectionValue = owned.reduce(
      (sum, i) => sum + (i.collectible?.estimated_value || 0),
      0
    );

    const graded = owned.filter((i) => i.collectible?.grading_company);
    const grades = graded
      .map((i) => parseFloat(i.collectible?.grade))
      .filter((g) => !isNaN(g));
    const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : null;

    const mostValuable = owned.length > 0
      ? owned.reduce((max, i) =>
          (i.collectible?.estimated_value || 0) > (max.collectible?.estimated_value || 0) ? i : max
        )
      : null;

    const costMap = {};
    if (costEstimates?.items) {
      costEstimates.items.forEach((e) => {
        costMap[(e.name || '').toLowerCase()] = e.estimated_price || 0;
      });
    }

    const missingWithCost = missing
      .map((i) => ({ ...i, cost: costMap[(i.name || '').toLowerCase()] || 0 }))
      .filter((i) => i.cost > 0);

    const cheapestMissing = missingWithCost.length > 0
      ? missingWithCost.reduce((min, i) => (i.cost < min.cost ? i : min))
      : null;

    const mostExpensiveMissing = missingWithCost.length > 0
      ? missingWithCost.reduce((max, i) => (i.cost > max.cost ? i : max))
      : null;

    return {
      collectionValue,
      avgGrade,
      gradedCount: graded.length,
      mostValuable,
      cheapestMissing,
      mostExpensiveMissing,
      duplicates: completion.duplicates,
    };
  }, [checklist, completion, costEstimates]);

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Binder Statistics</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox
          label="Collection Value"
          value={formatCurrency(stats.collectionValue)}
          icon={<DollarSign className="w-3 h-3" />}
        />
        <StatBox
          label="Average Grade"
          value={stats.avgGrade ? `${stats.avgGrade}` : '—'}
          sub={stats.gradedCount > 0 ? `${stats.gradedCount} graded` : 'No graded'}
          icon={<Award className="w-3 h-3" />}
        />
        <StatBox
          label="Most Valuable"
          value={stats.mostValuable ? formatCurrency(stats.mostValuable.collectible?.estimated_value || 0) : '—'}
          sub={stats.mostValuable?.collectible?.item_name}
          icon={<Star className="w-3 h-3" />}
        />
        <StatBox
          label="Duplicates"
          value={stats.duplicates > 0 ? `${stats.duplicates}` : 'None'}
          sub={stats.duplicates > 0 ? 'Trade candidates' : undefined}
        />
      </div>

      {(stats.cheapestMissing || stats.mostExpensiveMissing) && (
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">Missing Item Costs</p>
          {stats.cheapestMissing && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <ArrowDown className="w-3 h-3 text-gain flex-shrink-0" />
                <span className="truncate">{stats.cheapestMissing.name}</span>
              </div>
              <span className="font-semibold text-gain flex-shrink-0">{formatCurrency(stats.cheapestMissing.cost)}</span>
            </div>
          )}
          {stats.mostExpensiveMissing && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <ArrowUp className="w-3 h-3 text-loss flex-shrink-0" />
                <span className="truncate">{stats.mostExpensiveMissing.name}</span>
              </div>
              <span className="font-semibold text-loss flex-shrink-0">{formatCurrency(stats.mostExpensiveMissing.cost)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, sub, icon }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5">
      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
        {icon}
        <p className="text-[10px] font-medium">{label}</p>
      </div>
      <p className="text-sm font-bold truncate">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}