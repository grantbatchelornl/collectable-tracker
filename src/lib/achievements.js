import { base44 } from '@/api/base44Client';

export const BADGE_DEFINITIONS = [
  { type: 'first_card', name: 'First Card', icon: '🎴', description: 'Added your first collectible', category: 'collection' },
  { type: 'ten_cards', name: 'Collector', icon: '📦', description: 'Collected 10 items', category: 'collection' },
  { type: 'fifty_cards', name: 'Serious Collector', icon: '🏆', description: 'Collected 50 items', category: 'collection' },
  { type: 'hundred_cards', name: 'Centurion', icon: '💯', description: 'Collected 100 items', category: 'collection' },
  { type: 'category_diverse', name: 'Diversified', icon: '🌈', description: 'Items in 3+ categories', category: 'category' },
  { type: 'category_master', name: 'Category Master', icon: '👑', description: '10+ items in one category', category: 'category' },
  { type: 'valued_1k', name: 'Valued Collection', icon: '💰', description: 'Collection value over $1,000', category: 'value' },
  { type: 'valued_10k', name: 'Premium Collection', icon: '👑', description: 'Collection value over $10,000', category: 'value' },
  { type: 'valued_50k', name: 'Elite Portfolio', icon: '💎', description: 'Collection value over $50,000', category: 'value' },
  { type: 'set_builder', name: 'Set Builder', icon: '🧩', description: '5+ cards from the same set', category: 'set_completion' },
  { type: 'first_trade', name: 'Trader', icon: '🔄', description: 'Completed your first trade', category: 'trades' },
  { type: 'five_trades', name: 'Master Trader', icon: '💎', description: 'Completed 5 trades', category: 'trades' },
  { type: 'ten_trades', name: 'Trade Veteran', icon: '🏅', description: 'Completed 10 trades', category: 'trades' },
  { type: 'first_grading', name: 'Graded', icon: '🎖️', description: 'First professionally graded item', category: 'grading' },
  { type: 'graded_collector', name: 'Graded Collector', icon: '⭐', description: '10+ graded items', category: 'grading' },
  { type: 'first_scan', name: 'Scanner', icon: '📷', description: 'Used the binder scanner', category: 'scanner' },
  { type: 'scanner_pro', name: 'Scanner Pro', icon: '🔬', description: 'Scanned 10 binder pages', category: 'scanner' },
  { type: 'first_friend', name: 'Friendly', icon: '🤝', description: 'Made your first friend', category: 'community' },
  { type: 'five_friends', name: 'Social Star', icon: '⭐', description: 'Connected with 5 collectors', category: 'community' },
  { type: 'social_butterfly', name: 'Social Butterfly', icon: '🦋', description: 'Connected with 10 collectors', category: 'community' },
  { type: 'public_collector', name: 'Open Book', icon: '🌐', description: 'Made items public', category: 'community' },
];

export async function checkAndAwardBadges(user) {
  if (!user?.id) return [];
  try {
    const response = await base44.functions.invoke('awardAchievements', {});
    return response.data.achievements || [];
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