import { Star, BadgeCheck, ArrowLeftRight } from 'lucide-react';

function Stars({ rating, size = 'sm' }) {
  const sizeClass = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sizeClass} ${s <= Math.round(rating) ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function ReputationBadge({ profile }) {
  const score = profile?.trade_reputation_score || 0;
  const count = profile?.trade_review_count || 0;
  const verified = profile?.is_verified_trader;
  const totalTrades = profile?.total_completed_trades || 0;

  if (count === 0 && !verified && totalTrades === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-gold" />
          <p className="text-sm font-medium">Trader Reputation</p>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>
      {count > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <Stars rating={score} size="md" />
            <span className="text-lg font-bold">{score.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({count} {count === 1 ? 'review' : 'reviews'})</span>
          </div>
          {totalTrades > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeftRight className="w-3 h-3" />
              {totalTrades} completed {totalTrades === 1 ? 'trade' : 'trades'}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          {totalTrades > 0 ? `${totalTrades} completed ${totalTrades === 1 ? 'trade' : 'trades'} · No reviews yet` : 'No reviews yet'}
        </p>
      )}
    </div>
  );
}