import { TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/format';

export default function TopMovers({ gainers, losers }) {
  const navigate = useNavigate();
  const hasGainers = gainers.length > 0;
  const hasLosers = losers.length > 0;

  if (!hasGainers && !hasLosers) return null;

  const renderMover = (mover) => {
    const c = mover.collectible;
    return (
      <button
        key={c.id}
        onClick={() => navigate(`/collectible/${c.id}`)}
        className="w-40 flex-shrink-0 text-left"
      >
        <div className="rounded-2xl bg-card border border-border p-3">
          <p className="font-semibold text-sm truncate">{c.item_name}</p>
          <p className="text-xs text-muted-foreground truncate">{c.category_name}</p>
          <div className="flex items-center justify-between pt-1.5">
            <p className="font-display font-bold text-sm">{formatCurrency(c.estimated_value)}</p>
            <span
              className={`text-xs font-semibold flex items-center gap-0.5 ${
                mover.change > 0 ? 'text-gain' : 'text-loss'
              }`}
            >
              {mover.change > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {mover.change > 0 ? '+' : ''}
              {mover.percent.toFixed(1)}%
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {hasGainers && (
        <section>
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gain" /> Top Gainers
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {gainers.map(renderMover)}
          </div>
        </section>
      )}
      {hasLosers && (
        <section>
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-loss" /> Top Losers
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {losers.map(renderMover)}
          </div>
        </section>
      )}
    </div>
  );
}