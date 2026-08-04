import { TrendingUp, TrendingDown, Package, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

function ChangePill({ value }) {
  if (value === 0)
    return <span className="text-sm font-medium text-muted-foreground">$0</span>;
  const isGain = value > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-sm font-semibold ${
        isGain ? 'text-gain' : 'text-loss'
      }`}
    >
      {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {isGain ? '+' : ''}
      {formatCurrency(value)}
    </span>
  );
}

export default function PortfolioSummary({
  totalValue,
  verifiedValue,
  manualValue,
  purchaseCost,
  changes,
  count,
  staleCount,
}) {
  const gainLoss = purchaseCost > 0 ? totalValue - purchaseCost : null;
  const gainLossPercent =
    purchaseCost > 0 ? (gainLoss / purchaseCost) * 100 : null;

  return (
    <div className="rounded-3xl bg-card border border-border p-5 holo-shimmer">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Total Collection Value
        </p>
        {staleCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] bg-gold/10 text-gold rounded-full px-1.5 py-0.5 font-medium">
            <AlertTriangle className="w-2.5 h-2.5" /> {staleCount} stale
          </span>
        )}
      </div>
      <p className="font-display text-4xl font-extrabold tracking-tight">
        {formatCurrency(totalValue)}
      </p>

      <div className="flex gap-4 mt-3">
        <div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Verified Sold
          </p>
          <p className="text-sm font-semibold text-gain">{formatCurrency(verifiedValue)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Manual Value</p>
          <p className="text-sm font-semibold text-muted-foreground">{formatCurrency(manualValue)}</p>
        </div>
      </div>

      {purchaseCost > 0 && gainLoss !== null && (
        <div className="flex gap-4 mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-[10px] text-muted-foreground">Purchase Cost</p>
            <p className="text-sm font-semibold">{formatCurrency(purchaseCost)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Est. Gain/Loss</p>
            <p className={`text-sm font-semibold ${gainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
              {gainLoss >= 0 ? '+' : ''}
              {formatCurrency(gainLoss)}
              {gainLossPercent !== null && (
                <span className="text-[10px] ml-1">
                  ({gainLossPercent >= 0 ? '+' : ''}
                  {gainLossPercent.toFixed(1)}%)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-4">
        {[
          { label: '1D', value: changes.day },
          { label: '1W', value: changes.week },
          { label: '1M', value: changes.month },
          { label: '1Y', value: changes.year },
        ].map((p) => (
          <div key={p.label} className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-0.5">{p.label}</p>
            <ChangePill value={p.value} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <Package className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {count} collectible{count !== 1 ? 's' : ''} in your collection
        </span>
      </div>
    </div>
  );
}