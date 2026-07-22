import { useState, useEffect } from 'react';
import { getUserBadges, BADGE_DEFINITIONS } from '@/lib/achievements';

export default function AchievementBadges({ userId, earnedOnly = false }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getUserBadges(userId).then((b) => {
      setBadges(b);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return null;
  if (earnedOnly && badges.length === 0) return null;

  const earnedTypes = new Set(badges.map((b) => b.badge_type));
  const allBadges = earnedOnly
    ? BADGE_DEFINITIONS.filter((def) => earnedTypes.has(def.type))
    : BADGE_DEFINITIONS.map((def) => ({ ...def, earned: earnedTypes.has(def.type) }));

  if (allBadges.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        🏅 Badges ({badges.length})
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {allBadges.map((badge) => (
          <div
            key={badge.type}
            className={`flex flex-col items-center text-center p-2 rounded-xl ${
              badge.earned ? 'bg-accent' : 'opacity-30 grayscale'
            }`}
          >
            <div className="text-2xl mb-1">{badge.icon}</div>
            <p className="text-[10px] font-medium leading-tight">{badge.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}