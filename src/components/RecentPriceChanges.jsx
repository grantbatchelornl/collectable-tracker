import { Image } from '@/components/ui/image';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatRelativeDate } from '@/lib/format';

export default function RecentPriceChanges({ changes }) {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="font-semibold text-sm mb-3">Recent Pricing Changes</h3>
      <div className="space-y-2">
        {changes.slice(0, 5).map((change) => (
          <div key={change.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {change.photo && (
                <Image src={change.photo} fittingType="fill" className="w-full h-full" alt={change.name} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{change.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatRelativeDate(change.date)}</p>
            </div>
            <div className="text-right">
              <p
                className={`text-xs font-semibold flex items-center gap-0.5 justify-end ${
                  change.change >= 0 ? 'text-gain' : 'text-loss'
                }`}
              >
                {change.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change.change >= 0 ? '+' : ''}
                {formatCurrency(change.change)}
              </p>
              <p className="text-[10px] text-muted-foreground">{formatCurrency(change.newValue)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}