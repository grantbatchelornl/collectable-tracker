import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, DollarSign, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

export default function CompletionCost({ costEstimates, estimating, onEstimate, binder }) {
  if (estimating) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center py-6">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm font-medium">Estimating costs...</p>
        <p className="text-xs text-muted-foreground">AI is checking market prices</p>
      </div>
    );
  }

  if (!costEstimates) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Estimated Completion Cost</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Get AI-powered market estimates for all missing items.
        </p>
        <Button onClick={onEstimate} size="sm" className="w-full">
          <DollarSign className="w-4 h-4" /> Estimate Costs
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Estimated Completion Cost</h3>
        </div>
        <button onClick={onEstimate} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/50 p-2">
          <DollarSign className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Est. Total</p>
          <p className="font-display text-sm font-bold">{formatCurrency(costEstimates.total_estimated_cost || 0)}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <BarChart3 className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Median</p>
          <p className="font-display text-sm font-bold">{formatCurrency(costEstimates.total_median_cost || 0)}</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2">
          <TrendingDown className="w-3.5 h-3.5 text-gain mx-auto mb-0.5" />
          <p className="text-[10px] text-muted-foreground">Lowest</p>
          <p className="font-display text-sm font-bold">{formatCurrency(costEstimates.lowest_market_price || 0)}</p>
        </div>
      </div>

      {binder?.cost_estimates_date && (
        <p className="text-[10px] text-muted-foreground text-center">
          Updated {formatDate(binder.cost_estimates_date)}
        </p>
      )}
    </div>
  );
}