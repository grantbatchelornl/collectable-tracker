import { Image } from '@/components/ui/image';
import { Repeat, ArrowRight } from 'lucide-react';

export default function DuplicateSuggestions({ duplicates, onMarkForTrade, navigate }) {
  if (duplicates.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Repeat className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Duplicate Suggestions</h3>
      </div>

      <div className="space-y-2">
        {duplicates.map((item, idx) => (
          <div
            key={item.number || item.name || idx}
            className="flex items-center gap-3 rounded-lg border border-border p-2"
          >
            <div className="w-10 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
              {item.collectible?.primary_photo_url ? (
                <Image
                  src={item.collectible.primary_photo_url}
                  fittingType="fill"
                  className="w-full h-full"
                  alt={item.name}
                />
              ) : (
                <span className="text-[8px] text-muted-foreground text-center px-0.5">
                  {item.number || '?'}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">{item.number}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] bg-muted rounded-full px-1.5 py-0.5">
                  Own {item.owned}
                </span>
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[10px] bg-gain/10 text-gain rounded-full px-1.5 py-0.5 font-medium">
                  Keep {item.keep}
                </span>
                {item.trade > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">
                    Trade {item.trade}
                  </span>
                )}
              </div>
            </div>

            {item.trade > 0 && (
              <button
                onClick={() => onMarkForTrade(item)}
                className="text-[10px] font-medium text-primary border border-primary/30 rounded-lg px-2 py-1 hover:bg-primary/10 flex-shrink-0"
              >
                Mark for Trade
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}