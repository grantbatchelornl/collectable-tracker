import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight } from 'lucide-react';
import { formatCurrency, formatRelativeDate } from '@/lib/format';

export default function WishlistActivity({ items }) {
  const navigate = useNavigate();
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Wishlist Activity</h3>
        <button
          onClick={() => navigate('/watchlist')}
          className="text-xs text-primary font-medium flex items-center gap-0.5"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => navigate('/watchlist')}
            className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-accent text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{item.item_name}</p>
              <p className="text-[10px] text-muted-foreground">
                Target: {formatCurrency(item.target_price)} · {formatRelativeDate(item.created_date)}
              </p>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                item.status === 'active'
                  ? 'bg-primary/10 text-primary'
                  : item.status === 'acquired'
                  ? 'bg-gain/10 text-gain'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {item.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}