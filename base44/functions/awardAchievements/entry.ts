import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { BADGE_DEFINITIONS } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch user's own data using user-scoped token (RLS enforces ownership)
    const [collectibles, follows, trades, existing, profiles] = await Promise.all([
      base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 500),
      base44.entities.Follow.filter({ following_id: user.id, status: 'active' }, '-created_date', 100),
      base44.entities.Trade.list('-created_date', 200),
      base44.entities.Achievement.filter({ user_id: user.id }, '-created_date', 50),
      base44.entities.CollectorProfile.filter({ user_id: user.id }),
    ]);

    const awardedTypes = new Set(existing.map((a) => a.badge_type));
    const validCollectibles = collectibles.filter((c) => !c.is_deleted);
    const cardCount = validCollectibles.length;
    const friendCount = follows.length;
    const completedTrades = trades.filter(
      (t) => (t.proposer_id === user.id || t.recipient_id === user.id) && t.status === 'completed'
    ).length;
    const totalValue = validCollectibles.reduce((s, c) => s + (c.estimated_value || 0), 0);
    const hasPublic = validCollectibles.some((c) => c.privacy_status === 'public');
    const gradedCount = validCollectibles.filter((c) => c.grading_company).length;

    const categories = new Set(validCollectibles.map((c) => c.category_name).filter(Boolean));
    const categoryCounts = {};
    validCollectibles.forEach((c) => {
      if (c.category_name) categoryCounts[c.category_name] = (categoryCounts[c.category_name] || 0) + 1;
    });
    const maxCategoryCount = Math.max(0, ...Object.values(categoryCounts));

    const setCounts = {};
    validCollectibles.forEach((c) => {
      if (c.set_name) setCounts[c.set_name] = (setCounts[c.set_name] || 0) + 1;
    });
    const maxSetCount = Math.max(0, ...Object.values(setCounts));

    const profile = profiles[0];
    const scanCount = profile?.binder_scan_count || 0;

    const conditions = {
      first_card: cardCount >= 1,
      ten_cards: cardCount >= 10,
      fifty_cards: cardCount >= 50,
      hundred_cards: cardCount >= 100,
      category_diverse: categories.size >= 3,
      category_master: maxCategoryCount >= 10,
      valued_1k: totalValue >= 1000,
      valued_10k: totalValue >= 10000,
      valued_50k: totalValue >= 50000,
      set_builder: maxSetCount >= 5,
      first_trade: completedTrades >= 1,
      five_trades: completedTrades >= 5,
      ten_trades: completedTrades >= 10,
      first_grading: gradedCount >= 1,
      graded_collector: gradedCount >= 10,
      first_scan: scanCount >= 1,
      scanner_pro: scanCount >= 10,
      first_friend: friendCount >= 1,
      five_friends: friendCount >= 5,
      social_butterfly: friendCount >= 10,
      public_collector: hasPublic,
    };

    const newBadges = [];
    for (const def of BADGE_DEFINITIONS) {
      if (conditions[def.type] && !awardedTypes.has(def.type)) {
        try {
          const badge = await base44.asServiceRole.entities.Achievement.create({
            user_id: user.id,
            badge_type: def.type,
            badge_name: def.name,
            badge_icon: def.icon,
            badge_description: def.description,
          });
          await base44.asServiceRole.entities.Notification.create({
            recipient_id: user.id,
            type: 'achievement',
            title: `Achievement Unlocked: ${def.name}`,
            body: def.description,
            icon: def.icon,
          });
          newBadges.push(badge);
        } catch (err) {
          // already awarded — skip
        }
      }
    }
    return Response.json({ achievements: [...existing, ...newBadges] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}