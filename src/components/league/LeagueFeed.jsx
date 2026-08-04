import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { formatCurrency, formatRelativeDate } from '@/lib/format';

const ACTIVITY_ICONS = {
  new_collectible: '📦',
  collection_growth: '📈',
  set_completion: '🎯',
  achievement: '🏆',
  trade: '🔄',
  weekly_gain: '🔥',
  challenge: '⚡',
};

const LEAGUE_REACTIONS = [
  { key: 'fire', label: '🔥' },
  { key: 'clap', label: '👏' },
  { key: 'heart', label: '😍' },
  { key: 'hundred', label: '💯' },
  { key: 'party', label: '🎉' },
];

export default function LeagueFeed({ activities, leagueId, user }) {
  const [reacted, setReacted] = useState({});

  const sendReaction = async (activity, reaction) => {
    const key = `${activity.id}-${reaction.key}`;
    if (reacted[key]) return;
    setReacted({ ...reacted, [key]: true });
    try {
      await base44.entities.Notification.create({
        recipient_id: activity.user_id,
        type: 'league_reaction',
        title: `${reaction.label} from ${user.full_name || user.email}`,
        body: `${user.full_name || user.email} reacted ${reaction.label} to your activity in the league!`,
        destination_route: `/league/${leagueId}`,
        icon: reaction.label,
      });
    } catch (e) {
      // non-critical
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
        <p className="text-xs text-muted-foreground mt-1">League activity appears here as members add collectibles, complete trades, and earn achievements.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div key={activity.id} className="rounded-2xl bg-card border border-border p-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
              {activity.user_photo ? (
                <Image src={activity.user_photo} fittingType="fill" className="w-full h-full" alt={activity.user_name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                  {activity.user_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">{ACTIVITY_ICONS[activity.activity_type] || '📢'}</span>
                <p className="text-sm font-medium truncate">{activity.user_name}</p>
                <span className="text-[10px] text-muted-foreground">{formatRelativeDate(activity.created_date)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
              {activity.collectible_photo && (
                <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <Image src={activity.collectible_photo} fittingType="fill" className="w-full h-full" alt={activity.collectible_name} />
                </div>
              )}
            </div>
            {activity.value > 0 && (
              <span className="text-xs font-bold text-primary flex-shrink-0">{formatCurrency(activity.value)}</span>
            )}
          </div>
          <div className="flex gap-1 mt-2 pt-2 border-t border-border">
            {LEAGUE_REACTIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => sendReaction(activity, r)}
                disabled={!!reacted[`${activity.id}-${r.key}`]}
                className={`flex-1 h-7 rounded-lg text-sm flex items-center justify-center transition-colors ${
                  reacted[`${activity.id}-${r.key}`] ? 'bg-primary/10' : 'hover:bg-accent'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}