/**
 * App Capability Registry — the structured source of truth for Collector AI.
 * Both collectorAIChat and collectorAIExecute import from this module.
 */

export const VALID_ROUTES: { pattern: string; label: string; description: string; auth?: string }[] = [
  { pattern: '/', label: 'Home', description: 'Dashboard with portfolio summary, quick actions, and recent activity' },
  { pattern: '/collection', label: 'Collection', description: 'Browse and filter all your collectibles' },
  { pattern: '/add', label: 'Scan One Card', description: 'Add a single collectible via photo + AI identification' },
  { pattern: '/scan', label: 'Scan', description: 'Scan landing page with all scanner options' },
  { pattern: '/binder-scan', label: 'Binder Page Scanner', description: 'Scan a binder page to detect multiple cards' },
  { pattern: '/bulk-scan', label: 'Bulk Scanner', description: 'Upload multiple card images and import in batch' },
  { pattern: '/collector-ai', label: 'Collector AI', description: 'AI assistant chat' },
  { pattern: '/leaderboards', label: 'Leaderboards', description: 'Collector rankings' },
  { pattern: '/community', label: 'Community Rankings', description: 'Community rankings page' },
  { pattern: '/goals', label: 'Collection Goals', description: 'Your collection goals' },
  { pattern: '/timeline', label: 'Collection Timeline', description: 'Timeline of your collection activity' },
  { pattern: '/conventions', label: 'Convention Mode', description: 'Find collectors near you at conventions' },
  { pattern: '/binders', label: 'My Binders', description: 'Browse all your binders' },
  { pattern: '/binder/:id', label: 'Binder Detail', description: 'View a specific binder with checklist progress' },
  { pattern: '/binder-leaderboards', label: 'Binder Leaderboards', description: 'Binder completion rankings' },
  { pattern: '/review-queue', label: 'AI Review Queue', description: 'Review low-confidence AI identifications' },
  { pattern: '/time-machine', label: 'Time Machine', description: 'View collection value over time' },
  { pattern: '/hall-of-fame', label: 'Hall of Fame', description: 'Completed binder Hall of Fame' },
  { pattern: '/room-scanner', label: 'Room Scanner', description: 'Scan a room of collectibles' },
  { pattern: '/founding-collectors', label: 'Founding Collectors', description: 'Founding collector program' },
  { pattern: '/settings', label: 'Settings', description: 'App settings' },
  { pattern: '/collectible/:id', label: 'Collectible Detail', description: 'View a specific collectible' },
  { pattern: '/collectible/:id/edit', label: 'Edit Collectible', description: 'Edit a collectible' },
  { pattern: '/messages', label: 'Messages', description: 'Your conversations and trade offers' },
  { pattern: '/chat/:userId', label: 'Chat', description: 'Chat with a specific user' },
  { pattern: '/collector/:userId', label: 'Collector Profile', description: 'View a public collector profile' },
  { pattern: '/trade-binder/:userId', label: 'Trade Binder', description: 'View a user trade binder' },
  { pattern: '/watchlist', label: 'Wishlist', description: 'Your watchlist items' },
  { pattern: '/data-quality', label: 'Data Quality', description: 'Collection health and data quality issues' },
  { pattern: '/profile', label: 'Profile', description: 'Your collector profile' },
  { pattern: '/admin', label: 'Admin Dashboard', description: 'Admin tools (admin/super_admin only)', auth: 'admin' },
];

export const PROFILE_UPDATABLE_FIELDS = [
  'display_name', 'bio', 'favorite_categories', 'favorite_sets', 'favorite_franchises',
  'favorite_athletes', 'favorite_teams', 'favorite_characters', 'goals',
  'risk_tolerance', 'budget', 'leaderboard_opt_in', 'leaderboard_scope',
  'hide_collection_value', 'hide_individual_collectibles', 'hide_purchase_prices',
  'price_increase_threshold', 'price_decrease_threshold', 'health_reminder_enabled',
  'vacation_mode', 'ai_enabled', 'ai_response_detail', 'ai_collector_level',
  'ai_recommendation_style', 'ai_enable_recommendations', 'ai_enable_binder_suggestions',
  'ai_enable_trade_suggestions', 'ai_enable_grading_suggestions', 'ai_enable_health_suggestions',
  'ai_include_purchase_price', 'ai_include_manual_values', 'ai_save_history',
];

export const COLLECTIBLE_UPDATABLE_FIELDS = [
  'item_name', 'character_athlete_name', 'brand', 'product_line', 'set_name', 'set_number',
  'card_number', 'year', 'team', 'variant', 'edition', 'parallel', 'serial_number',
  'language', 'franchise', 'has_autograph', 'grading_company', 'grade', 'box_condition',
  'item_condition', 'authentication_company', 'country', 'denomination', 'mint_mark',
  'composition', 'sport', 'is_rookie', 'has_patch', 'item_type', 'is_game_used',
  'is_exclusive', 'has_sticker', 'is_chase', 'is_boxed', 'box_number', 'series',
  'estimated_value', 'low_value', 'high_value', 'value_locked', 'for_sale', 'asking_price',
  'trade_status', 'privacy_status', 'notes', 'acquisition_source', 'seller_name',
  'purchase_date', 'memory', 'why_special', 'memory_date', 'memory_shared',
  'is_favorite', 'showcase_order',
];

export const BINDER_UPDATABLE_FIELDS = [
  'name', 'description', 'icon', 'color', 'cover_photo_url', 'privacy_status',
  'sorting', 'view_mode', 'is_showcased',
];

export const ACTIONS_REQUIRING_CONFIRMATION = [
  'delete_collectible', 'delete_binder', 'remove_multiple_records',
  'change_privacy_to_public', 'send_message', 'send_trade_proposal',
  'accept_trade', 'cancel_trade', 'complete_trade',
  'change_email', 'change_password', 'export_data', 'delete_account',
  'change_role', 'admin_action',
];

export const AI_CAPABILITY_DESCRIPTION = `
## App Capability Registry

### Pages & Navigation (valid routes only)
${VALID_ROUTES.map(r => `- "${r.label}" → route: ${r.pattern}${r.auth ? ` (requires ${r.auth})` : ''} — ${r.description}`).join('\n')}

### Scanner Types
- Scan One Card (/add): Single collectible via photo + AI identification
- Binder Page Scanner (/binder-scan): Scan a binder page, detect multiple cards
- Bulk Scanner (/bulk-scan): Upload multiple card images, batch process
- Room Scanner (/room-scanner): Scan a room of collectibles

### Supported Collectible Categories
Pokémon, Magic: The Gathering, Disney Lorcana, Sports Cards, Funko Pop!, Coins, and more (see CollectibleCategory entity).

### Binder Features
- Custom Binders: User-created binders with AI-generated or manual checklists
- Master Binders: Per-set binders sourced from official Pokémon TCG API
- Binder Library: Browse and create binders from the catalog
- Completion tracking, missing list, duplicate suggestions, cost estimates
- 100% completion triggers celebration + Hall of Fame promotion

### Trade Features
- Trade Binder: Shows items marked as trade/sell
- Trade proposals between collectors
- Trade reviews and reputation scores

### Completed-Sale Pricing System
- All values based on verified completed sales only
- PricingHistory entity tracks value over time
- SoldComparable entity stores individual sale records
- Value Lock prevents AI from updating a value
- Stale pricing flagged when data is insufficient

### Collection Health
- Data Quality page shows items with missing photos, stale pricing, low confidence
- Health reminders can be toggled in Settings

### Achievements & Leaderboards
- Badges auto-awarded by backend function (awardAchievements)
- Leaderboards: opt-in, with privacy scope controls
- XP and leveling system

### Privacy & Permissions
- Collectible privacy: private, friends, public
- Binder privacy: private, friends, public
- Profile fields: owner+admin only (filtered via getPublicProfile)
- RLS enforced on all entities

### Collector AI Write Actions
Collector AI can perform these write actions for the authenticated user:
- update_profile: Update CollectorProfile fields (display_name, bio, favorites, goals, risk_tolerance, AI settings, notification preferences, privacy)
- update_collectible: Update Collectible fields (details, notes, memory, acquisition info, trade_status, is_favorite, showcase_order)
- update_binder: Update CollectionBinder fields (name, description, icon, color, cover, privacy, sorting, view_mode, is_showcased)
- add_to_wishlist: Add items to Watchlist
- mark_for_trade: Set trade_status on collectibles
- toggle_favorite: Toggle is_favorite on a collectible
- toggle_showcase: Set showcase_order on a collectible
- refresh_pricing: Trigger pricing refresh on a collectible
- delete_binder: Soft-delete a user-owned binder

### Actions Always Requiring Explicit Confirmation (even with auto-confirm enabled)
${ACTIONS_REQUIRING_CONFIRMATION.map(a => `- ${a}`).join('\n')}

### Prohibited Actions
- Modifying another user's data
- Deleting the official Master Binder template
- Changing account email, password, or login methods
- Performing admin/super_admin actions (unless authorized)
- Sending messages or trade proposals without explicit confirmation
`;