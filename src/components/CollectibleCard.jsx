import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { TrendingUp, TrendingDown } from 'lucide-react';
import PrivacyBadge from './PrivacyBadge';
import { formatCurrency, formatRelativeDate } from '@/lib/format';

export default function CollectibleCard({ collectible, previousValue }) {
  const navigate = useNavigate();
  const change =
    previousValue != null ? (collectible.estimated_value || 0) - previousValue : null;

  return (
    <button
      onClick={() => navigate(`/collectible/${collectible.id}`)}
      className="text-left w-full group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm transition-transform group-active:scale-[0.97]">
        <div className="aspect-square overflow-hidden">
          <Image
            src={collectible.primary_photo_url}
            fittingType="fill"
            className="w-full h-full"
            alt={collectible.item_name}
          />
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <PrivacyBadge status={collectible.privacy_status} compact />
          {collectible.for_sale && (
            <div className="inline-flex items-center gap-0.5 bg-gold/90 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              For Sale
            </div>
          )}
        </div>
        <div className="p-3 space-y-0.5">
          <p className="font-semibold text-sm truncate">{collectible.item_name}</p>
          <p className="text-xs text-muted-foreground truncate">{collectible.category_name}</p>
          <div className="flex items-center justify-between pt-1.5">
            <p className="font-display font-bold text-base">{formatCurrency(collectible.estimated_value)}</p>
            {change != null && change !== 0 && (
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  change > 0 ? 'text-gain' : 'text-loss'
                }`}
              >
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change > 0 ? '+' : '-'}
                {formatCurrency(Math.abs(change))}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Updated {formatRelativeDate(collectible.updated_date)}
          </p>
        </div>
      </div>
    </button>
  );
}