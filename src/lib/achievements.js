import { base44 } from '@/api/base44Client';

export const BADGE_DEFINITIONS = [
  { type: 'first_card', name: 'First Card', icon: '🎴', description: 'Added your first collectible' },
  { type: 'ten_cards', name: 'Collector', icon: '📦', description: 'Collected 10 items' },
  { type: 'fifty_cards', name: 'Serious Collector', icon: '🏆', description: 'Collected 50 items' },
  { type: 'first_friend', name: 'Friendly', icon: '🤝', description: 'Made your first friend' },
  { type: 'five_friends', name: 'Social Star', icon: '⭐', description: 'Connected with 5 collectors' },
  { type: 'first_trade', name: 'Trader', icon: '🔄', description: 'Completed your first trade' },
  { type: 'five_trades', name: 'Master Trader', icon: '💎', description: 'Completed 5 trades' },
  { type: 'valued_1k', name: 'Valued Collection', icon: '💰', description: 'Collection value over $1,000' },
  { type: 'valued_10k', name: 'Premium Collection', icon: '👑', description: 'Collection value over $10,000' },
  { type: 'public_collector', name: 'Open Book', icon: '🌐', description: 'Made items public' },
];

export async function checkAndAwardBadges(user) {
  if (!user?.id) return [];
  try {
    const [collectibles, follows, trades, existing] = await Promise.all([
      base44.entities.Collectible.list('-created_date', 200),
      base44.entities.Follow.filter({ following_id: user.id, status: 'active' }, '-created_date', 100),
      base44.entities.Trade.list('-created_date', 200),
      base44.entities.Achievement.filter({ user_id: user.id }, '-created_date', 50),
    ]);

    const awardedTypes = new Set(existing.map((a) => a.badge_type));
    const cardCount = collectibles.length;
    const friendCount = follows.length;
    const completedTrades = trades.filter(
      (t) =>
        (t.proposer_id === user.id || t.recipient_id === user.id) && t.status === 'accepted'
    ).length;
    const totalValue = collectibles.reduce((s, c) => s + (c.estimated_value || 0), 0);
    const hasPublic = collectibles.some((c) => c.privacy_status === 'public');

    const conditions = {
      first_card: cardCount >= 1,
      ten_cards: cardCount >= 10,
      fifty_cards: cardCount >= 50,
      first_friend: friendCount >= 1,
      five_friends: friendCount >= 5,
      first_trade: completedTrades >= 1,
      five_trades: completedTrades >= 5,
      valued_1k: totalValue >= 1000,
      valued_10k: totalValue >= 10000,
      public_collector: hasPublic,
    };

    const newBadges = [];
    for (const def of BADGE_DEFINITIONS) {
      if (conditions[def.type] && !awardedTypes.has(def.type)) {
        try {
          const badge = await base44.entities.Achievement.create({
            user_id: user.id,
            badge_type: def.type,
            badge_name: def.name,
            badge_icon: def.icon,
            badge_description: def.description,
          });
          newBadges.push(badge);
        } catch (err) {
          // already awarded or permission issue — skip
        }
      }
    }
    return [...existing, ...newBadges];
  } catch (err) {
    console.error('Failed to check badges:', err);
    return [];
  }
}

export async function getUserBadges(userId) {
  if (!userId) return [];
  try {
    return await base44.entities.Achievement.filter({ user_id: userId }, '-created_date', 50);
  } catch (err) {
    console.error('Failed to load badges:', err);
    return [];
  }
}