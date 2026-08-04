import { useState } from 'react';
import { Image } from '@/components/ui/image';
import { Star, Check, Loader2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { DIFFICULTY_LABELS, wishlistSingleItem } from '@/lib/binderChecklist';

export default function MissingList({ missingItems, binder, user, onWishlisted }) {
  const [individualLoading, setIndividualLoading] = useState({});
  const [wishlistedNames, setWishlistedNames] = useState({});

  const handleWishlistOne = async (item) => {
    setIndividualLoading((prev) => ({ ...prev, [item.name]: true }));
    try {
      await wishlistSingleItem(binder, user, item);
      setWishlistedNames((prev) => ({ ...prev, [item.name]: true }));
      onWishlisted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIndividualLoading((prev) => ({ ...prev, [item.name]: false }));
    }
  };

  if (missingItems.length === 0) {
    return (
      <div className="rounded-2xl bg-gain/5 border border-gain/20 p-4 text-center">
        <Check className="w-6 h-6 text-gain mx-auto mb-1" />
        <p className="text-sm font-medium text-gain">All items collected!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4 text-loss" />
        <h3 className="font-semibold text-sm">Missing List ({missingItems.length})</h3>
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {missingItems.map((item, idx) => {
          const diff = DIFFICULTY_LABELS[item.difficulty] || DIFFICULTY_LABELS.moderate;
          const isWishlisted = wishlistedNames[item.name] || item.status === 'wishlisted';
          const isLoading = individualLoading[item.name];

          return (
            <div
              key={item.number || item.name || idx}
              className="flex items-center gap-2.5 rounded-lg border border-border p-2"
            >
              {/* Picture */}
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

              {/* Name + Number */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">{item.number}</p>
              </div>

              {/* Price */}
              {item.estimated_price > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold">{formatCurrency(item.estimated_price)}</p>
                </div>
              )}

              {/* Difficulty */}
              <span className={`text-[9px] font-medium rounded-full px-1.5 py-0.5 flex-shrink-0 ${diff.class}`}>
                {diff.label}
              </span>

              {/* Wishlist button */}
              <button
                onClick={() => !isWishlisted && handleWishlistOne(item)}
                disabled={isWishlisted || isLoading}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                ) : isWishlisted ? (
                  <Star className="w-4 h-4 text-gold fill-gold" />
                ) : (
                  <Star className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}