import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatCurrency } from '@/lib/format';
import { REACTIONS } from '@/lib/leaderboard';
import { Crown, Medal, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

export default function LeaderboardEntry({ entry, isMe, isFriend, metricType }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reacted, setReacted] = useState(null);

  const sendReaction = async (reaction) => {
    if (reacted) return;
    setReacted(reaction.key);
    try {
      await base44.entities.Notification.create({
        recipient_id: entry.userId,
        type: 'leaderboard_reaction',
        title: `${reaction.icon} ${reaction.label || ''}from ${user.full_name || user.email}`.trim(),
        body: `${user.full_name || user.email} reacted ${reaction.icon} to your leaderboard ranking!`,
        destination_route: '/leaderboards',
        icon: reaction.icon,
      });
    } catch (e) {
      // non-critical
    }
  };

  const displayValue = () => {
    if (entry.hideValue && !isMe) return 'Hidden';
    if (metricType === 'score') return `${entry.metricValue} pts`;
    if (metricType === 'count') return `${entry.metricValue}`;
    return formatCurrency(entry.metricValue);
  };

  return (
    <div
      className={`rounded-2xl border p-3 transition-colors ${
        isMe ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 text-center flex-shrink-0">
          {entry.rank === 1 && <Crown className="w-5 h-5 text-gold mx-auto" />}
          {entry.rank === 2 && <Medal className="w-5 h-5 text-muted-foreground mx-auto" />}
          {entry.rank === 3 && <Medal className="w-5 h-5 text-orange-500 mx-auto" />}
          {entry.rank > 3 && <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>}
        </div>
        <div className="w-5 flex-shrink-0 text-center">
          {entry.rankChange != null && entry.rankChange > 0 && (
            <span className="text-[10px] text-gain font-bold flex items-center">
              <TrendingUp className="w-3 h-3" />{entry.rankChange}
            </span>
          )}
          {entry.rankChange != null && entry.rankChange < 0 && (
            <span className="text-[10px] text-loss font-bold flex items-center">
              <TrendingDown className="w-3 h-3" />{Math.abs(entry.rankChange)}
            </span>
          )}
          {entry.rankChange != null && entry.rankChange === 0 && (
            <Minus className="w-3 h-3 text-muted-foreground mx-auto" />
          )}
          {entry.isNew && entry.rank > 1 && (
            <Sparkles className="w-3 h-3 text-primary mx-auto" />
          )}
        </div>
        <button
          onClick={() => !entry.hideItems && navigate(`/collector/${entry.userId}`)}
          className="w-9 h-9 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0"
        >
          {entry.profilePhoto ? (
            <Image src={entry.profilePhoto} fittingType="fill" className="w-full h-full" alt={entry.displayName} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
              {entry.displayName?.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">
            {entry.displayName}
            {isMe && <span className="text-xs text-primary ml-1">(You)</span>}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            @{entry.username || 'collector'} · {entry.itemCount} items
            {entry.weeklyGrowth > 0 && (
              <span className="text-gain"> · +{formatCurrency(entry.weeklyGrowth)}</span>
            )}
          </p>
        </div>
        <span className="text-sm font-bold flex-shrink-0">{displayValue()}</span>
      </div>
      {isFriend && !isMe && (
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-border">
          {REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => sendReaction(r)}
              disabled={!!reacted}
              className={`flex-1 h-7 rounded-lg text-xs font-medium flex items-center justify-center gap-0.5 transition-colors ${
                reacted === r.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 hover:bg-accent'
              }`}
            >
              {r.icon} {r.label && <span className="hidden sm:inline">{r.label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}