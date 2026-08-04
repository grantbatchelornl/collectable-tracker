import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/format';
import { Sparkles, ChevronRight, Heart } from 'lucide-react';

export default function TradeMatchCard({ match, onOpenTrade }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Potential Trade Match</p>
      </div>

      {match.wishlistMatches && match.wishlistMatches.length > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-2">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
            <Heart className="w-3 h-3" /> You Want
          </p>
          <p className="text-xs font-medium">{match.wishlistMatches.map((w) => w.item_name).join(', ')}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">They Have</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {match.theirItems.slice(0, 5).map((item) => (
            <div key={item.id} className="w-16 flex-shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                {item.primary_photo_url ? (
                  <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                )}
              </div>
              <p className="text-[9px] truncate mt-1">{item.item_name}</p>
              <p className="text-[9px] text-muted-foreground">{formatCurrency(item.estimated_value)}</p>
            </div>
          ))}
        </div>
      </div>

      {match.myItems && match.myItems.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">You Can Offer</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {match.myItems.slice(0, 5).map((item) => (
              <div key={item.id} className="w-16 flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                  {item.primary_photo_url ? (
                    <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                  )}
                </div>
                <p className="text-[9px] truncate mt-1">{item.item_name}</p>
                <p className="text-[9px] text-muted-foreground">{formatCurrency(item.estimated_value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onOpenTrade}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
      >
        Open Trade Window <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}