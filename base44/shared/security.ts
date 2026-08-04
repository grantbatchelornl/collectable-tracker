// Shared security constants and helpers used across backend functions.
// Extracted here to avoid duplication per platform guidelines.

export const ALLOWED_ROLES = ['user', 'admin', 'super_admin'];

// Fields on CollectorProfile that are safe to expose to other users.
export const PUBLIC_PROFILE_FIELDS = [
  'display_name', 'username', 'profile_photo', 'bio',
  'favorite_categories', 'favorite_sets', 'favorite_franchises',
  'favorite_athletes', 'favorite_teams', 'favorite_characters',
  'show_public_value', 'is_verified_trader',
  'trade_reputation_score', 'trade_review_count', 'total_completed_trades',
  'xp', 'level', 'leaderboard_opt_in', 'leaderboard_scope',
  'hide_collection_value', 'hide_individual_collectibles', 'hide_purchase_prices',
];

// Fields that must NEVER be exposed to other users.
export const PRIVATE_PROFILE_FIELDS = [
  'budget', 'goals', 'risk_tolerance', 'last_week_rank',
  'price_increase_threshold', 'price_decrease_threshold',
  'health_reminder_enabled', 'binder_scan_count', 'dashboard_widgets',
  'vacation_mode', 'convention_mode_active', 'convention_lat',
  'convention_lng', 'convention_name',
  'ai_enabled', 'ai_response_detail', 'ai_collector_level',
  'ai_recommendation_style', 'ai_enable_recommendations',
  'ai_enable_binder_suggestions', 'ai_enable_trade_suggestions',
  'ai_enable_grading_suggestions', 'ai_enable_health_suggestions',
  'ai_include_purchase_price', 'ai_include_manual_values', 'ai_save_history',
];

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

export const BADGE_TYPES = BADGE_DEFINITIONS.map((b) => b.type);

// Strip a CollectorProfile down to only public-safe fields.
export function filterPublicProfile(profile) {
  if (!profile) return null;
  const publicProfile = {};
  const allowed = ['id', 'user_id', 'created_date', 'updated_date', ...PUBLIC_PROFILE_FIELDS];
  for (const field of allowed) {
    if (field in profile) {
      publicProfile[field] = profile[field];
    }
  }
  return publicProfile;
}

// Check if an object contains any known private profile fields.
export function containsPrivateFields(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return PRIVATE_PROFILE_FIELDS.some((f) => f in obj);
}