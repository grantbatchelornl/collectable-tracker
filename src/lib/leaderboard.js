import { base44 } from '@/api/base44Client';
import { computeCollectorScore } from '@/lib/collectorScore';

export const LEADERBOARD_SECTIONS = [
  {
    key: 'overall',
    label: 'Overall',
    icon: '🌍',
    metrics: [
      { key: 'total_value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'collector_score', label: 'Collector Score', icon: '⭐', type: 'score' },
      { key: 'largest_collection', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'biggest_growth', label: 'Collection Growth', icon: '📈', type: 'currency' },
      { key: 'most_valuable_single', label: 'Most Valuable Item', icon: '💎', type: 'currency' },
    ],
  },
  {
    key: 'Pokémon',
    label: 'Pokémon',
    icon: '⚡',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'set_completion', label: 'Master Set Progress', icon: '🎯', type: 'count' },
    ],
  },
  {
    key: 'Magic: The Gathering',
    label: 'Magic',
    icon: '🃏',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'set_completion', label: 'Set Completion', icon: '🎯', type: 'count' },
    ],
  },
  {
    key: 'Disney Lorcana',
    label: 'Lorcana',
    icon: '✨',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
    ],
  },
  {
    key: 'Sports Cards',
    label: 'Sports Cards',
    icon: '⚾',
    metrics: [
      { key: 'overall_value', label: 'Overall Value', icon: '💰', type: 'currency' },
      { key: 'overall_count', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'baseball_value', label: 'Baseball', icon: '⚾', type: 'currency' },
      { key: 'football_value', label: 'Football', icon: '🏈', type: 'currency' },
      { key: 'basketball_value', label: 'Basketball', icon: '🏀', type: 'currency' },
      { key: 'hockey_value', label: 'Hockey', icon: '🏒', type: 'currency' },
      { key: 'soccer_value', label: 'Soccer', icon: '⚽', type: 'currency' },
    ],
  },
  {
    key: 'Funko Pop!',
    label: 'Funko',
    icon: '🎭',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'chase_count', label: 'Chase Collection', icon: '🔥', type: 'count' },
      { key: 'exclusive_count', label: 'Exclusive Collection', icon: '⭐', type: 'count' },
    ],
  },
  {
    key: 'Coins',
    label: 'Coins',
    icon: '🪙',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'gold_value', label: 'Gold Collection', icon: '🥇', type: 'currency' },
      { key: 'silver_value', label: 'Silver Collection', icon: '🥈', type: 'currency' },
    ],
  },
  {
    key: 'Sports Memorabilia',
    label: 'Memorabilia',
    icon: '🏆',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
    ],
  },
];

export const LEADERBOARD_TIMEFRAMES = [
  { key: 'all_time', label: 'All Time', icon: '∞' },
  { key: 'yearly', label: 'Yearly', icon: '📅' },
  { key: 'monthly', label: 'Monthly', icon: '🗓️' },
  { key: 'weekly', label: 'Weekly', icon: '📊' },
];

export const REACTIONS = [
  { key: 'congrats', label: 'Congrats!', icon: '🎉' },
  { key: 'nice', label: 'Nice pickup!', icon: '👌' },
  { key: 'fire', label: '', icon: '🔥' },
  { key: 'clap', label: '', icon: '👏' },
];

export async function getFriends(userId) {
  const [following, followers] = await Promise.all([
    base44.entities.Follow.filter({ follower_id: userId, status: 'active' }),
    base44.entities.Follow.filter({ following_id: userId, status: 'active' }),
  ]);
  const followingIds = new Set(following.map((f) => f.following_id));
  const followerIds = new Set(followers.map((f) => f.follower_id));
  return [...followingIds].filter((id) => followerIds.has(id));
}

function getEffectiveScope(profile) {
  if (profile.leaderboard_scope) return profile.leaderboard_scope;
  return profile.leaderboard_opt_in ? 'global_friends' : 'hidden';
}

function getTimeframeCutoff(timeframe) {
  if (timeframe === 'all_time') return 0;
  const now = Date.now();
  const durations = {
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    yearly: 365 * 24 * 60 * 60 * 1000,
  };
  return now - (durations[timeframe] || 0);
}

export async function getLeaderboard(sectionKey, metricKey, scope, eligibleIds, currentUserId, timeframe = 'all_time') {
  const profileRes = await base44.functions.invoke('getPublicProfiles', {});
  const allProfiles = profileRes.data?.profiles || profileRes.profiles || [];
  const profileMap = {};
  allProfiles.forEach((p) => { profileMap[p.user_id] = p; });

  let finalEligibleIds;
  if (scope === 'friends' || scope === 'league') {
    finalEligibleIds = new Set(eligibleIds || []);
    if (scope === 'friends') finalEligibleIds.add(currentUserId);
    if (scope === 'friends') {
      finalEligibleIds = new Set(
        allProfiles
          .filter((p) => finalEligibleIds.has(p.user_id) && getEffectiveScope(p) !== 'hidden')
          .map((p) => p.user_id)
      );
    }
  } else {
    finalEligibleIds = new Set(
      allProfiles
        .filter((p) => getEffectiveScope(p) === 'global_friends')
        .map((p) => p.user_id)
    );
  }

  const collectibles = await base44.entities.Collectible.filter(
    { privacy_status: 'public', is_deleted: false },
    '-estimated_value',
    2000
  );
  const verifiedOnly = collectibles.filter((c) => c.value_type === 'verified_sold' && (c.comparables_count || 0) >= 2);
  const cutoff = getTimeframeCutoff(timeframe);

  const userMap = {};
  const ensureUser = (userId) => {
    if (!userMap[userId]) {
      userMap[userId] = {
        userId, totalValue: 0, itemCount: 0, gradedCount: 0, maxValue: 0,
        weeklyGrowth: 0, chaseCount: 0, categories: {},
      };
    }
    return userMap[userId];
  };

  verifiedOnly.forEach((c) => {
    if (!finalEligibleIds.has(c.created_by_id)) return;
    if (cutoff > 0) {
      const itemDate = c.created_date ? new Date(c.created_date).getTime() : 0;
      if (itemDate < cutoff) return;
    }
    const u = ensureUser(c.created_by_id);
    u.totalValue += c.estimated_value || 0;
    u.itemCount++;
    if (c.grading_company) u.gradedCount++;
    u.maxValue = Math.max(u.maxValue, c.estimated_value || 0);
    if (c.is_chase) u.chaseCount++;

    const cat = c.category_name || 'Unknown';
    if (!u.categories[cat]) {
      u.categories[cat] = { value: 0, count: 0, sets: new Set(), chaseCount: 0, exclusiveCount: 0, goldValue: 0, silverValue: 0, sports: {} };
    }
    const catData = u.categories[cat];
    catData.value += c.estimated_value || 0;
    catData.count++;
    if (c.set_name) catData.sets.add(c.set_name);
    if (c.is_chase) catData.chaseCount++;
    if (c.is_exclusive) catData.exclusiveCount++;

    const comp = (c.composition || '').toLowerCase();
    if (comp.includes('gold')) catData.goldValue += c.estimated_value || 0;
    if (comp.includes('silver')) catData.silverValue += c.estimated_value || 0;

    const sport = c.sport || 'Unknown';
    if (!catData.sports[sport]) catData.sports[sport] = { value: 0, count: 0 };
    catData.sports[sport].value += c.estimated_value || 0;
    catData.sports[sport].count++;

    if (c.created_date && new Date(c.created_date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
      u.weeklyGrowth += c.estimated_value || 0;
    }
  });

  let entries = Object.values(userMap).filter((e) => finalEligibleIds.has(e.userId));

  if (sectionKey === 'overall' && metricKey === 'collector_score') {
    entries = entries.map((e) => {
      const score = computeCollectorScore(
        verifiedOnly.filter((c) => c.created_by_id === e.userId), [], [], []
      );
      return { ...e, scoreValue: score.score };
    });
  }

  const getMetricValue = (entry) => {
    if (sectionKey === 'overall') {
      switch (metricKey) {
        case 'total_value': return entry.totalValue;
        case 'collector_score': return entry.scoreValue || 0;
        case 'largest_collection': return entry.itemCount;
        case 'most_valuable_single': return entry.maxValue;
        case 'biggest_growth': return entry.weeklyGrowth;
        default: return entry.totalValue;
      }
    }
    const cat = entry.categories[sectionKey];
    if (!cat) return 0;
    switch (metricKey) {
      case 'value': case 'overall_value': return cat.value;
      case 'count': case 'overall_count': return cat.count;
      case 'set_completion': return cat.sets.size;
      case 'chase_count': return cat.chaseCount;
      case 'exclusive_count': return cat.exclusiveCount;
      case 'gold_value': return cat.goldValue;
      case 'silver_value': return cat.silverValue;
      default:
        if (metricKey.endsWith('_value')) {
          const sportName = metricKey.replace('_value', '');
          const sportKey = sportName.charAt(0).toUpperCase() + sportName.slice(1);
          return cat.sports[sportKey]?.value || cat.sports[sportName]?.value || 0;
        }
        return cat.value;
    }
  };

  entries = entries.map((e) => ({ ...e, metricValue: getMetricValue(e) }));
  entries = entries.filter((e) => e.metricValue > 0);
  entries.sort((a, b) => b.metricValue - a.metricValue);

  return entries.slice(0, 50).map((e, i) => {
    const profile = profileMap[e.userId];
    const lastRank = profile?.last_week_rank;
    return {
      ...e, rank: i + 1,
      displayName: profile?.display_name || 'Collector',
      username: profile?.username || '',
      profilePhoto: profile?.profile_photo || '',
      hideValue: profile?.hide_collection_value || false,
      hideItems: profile?.hide_individual_collectibles || false,
      rankChange: lastRank ? lastRank - (i + 1) : null,
      isNew: !lastRank,
    };
  });
}