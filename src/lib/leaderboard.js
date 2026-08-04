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
      { key: 'most_valuable_single', label: 'Most Valuable Item', icon: '💎', type: 'currency' },
      { key: 'biggest_growth', label: 'Biggest Growth', icon: '📈', type: 'currency' },
    ],
  },
  {
    key: 'Pokémon',
    label: 'Pokémon',
    icon: '⚡',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
      { key: 'set_completion', label: 'Set Completion', icon: '🎯', type: 'count' },
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
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
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
    ],
  },
  {
    key: 'Coins',
    label: 'Coins',
    icon: '🪙',
    metrics: [
      { key: 'value', label: 'Collection Value', icon: '💰', type: 'currency' },
      { key: 'count', label: 'Largest Collection', icon: '📦', type: 'count' },
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

export async function getLeaderboard(sectionKey, metricKey, scope, friendIds, currentUserId) {
  const allProfiles = await base44.entities.CollectorProfile.filter({});
  const profileMap = {};
  allProfiles.forEach((p) => {
    profileMap[p.user_id] = p;
  });

  let eligibleIds;
  if (scope === 'friends') {
    const friendSet = new Set(friendIds);
    friendSet.add(currentUserId);
    eligibleIds = new Set(
      allProfiles
        .filter((p) => friendSet.has(p.user_id) && getEffectiveScope(p) !== 'hidden')
        .map((p) => p.user_id)
    );
  } else {
    eligibleIds = new Set(
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
  const verifiedOnly = collectibles.filter((c) => c.value_type === 'verified_sold');

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const userMap = {};

  const ensureUser = (userId) => {
    if (!userMap[userId]) {
      userMap[userId] = {
        userId,
        totalValue: 0,
        itemCount: 0,
        gradedCount: 0,
        maxValue: 0,
        weeklyGrowth: 0,
        chaseCount: 0,
        categories: {},
      };
    }
    return userMap[userId];
  };

  verifiedOnly.forEach((c) => {
    if (!eligibleIds.has(c.created_by_id)) return;
    const u = ensureUser(c.created_by_id);
    u.totalValue += c.estimated_value || 0;
    u.itemCount++;
    if (c.grading_company) u.gradedCount++;
    u.maxValue = Math.max(u.maxValue, c.estimated_value || 0);
    if (c.is_chase) u.chaseCount++;

    const cat = c.category_name || 'Unknown';
    if (!u.categories[cat]) {
      u.categories[cat] = { value: 0, count: 0, sets: new Set(), chaseCount: 0 };
    }
    u.categories[cat].value += c.estimated_value || 0;
    u.categories[cat].count++;
    if (c.set_name) u.categories[cat].sets.add(c.set_name);
    if (c.is_chase) u.categories[cat].chaseCount++;

    if (c.created_date && new Date(c.created_date).getTime() > weekAgo) {
      u.weeklyGrowth += c.estimated_value || 0;
    }
  });

  let entries = Object.values(userMap).filter((e) => eligibleIds.has(e.userId));

  if (sectionKey === 'overall' && metricKey === 'collector_score') {
    entries = entries.map((e) => {
      const score = computeCollectorScore(
        verifiedOnly.filter((c) => c.created_by_id === e.userId),
        [],
        [],
        []
      );
      return { ...e, scoreValue: score.score };
    });
  }

  const getMetricValue = (entry) => {
    if (sectionKey === 'overall') {
      switch (metricKey) {
        case 'total_value':
          return entry.totalValue;
        case 'collector_score':
          return entry.scoreValue || 0;
        case 'largest_collection':
          return entry.itemCount;
        case 'most_valuable_single':
          return entry.maxValue;
        case 'biggest_growth':
          return entry.weeklyGrowth;
        default:
          return entry.totalValue;
      }
    }
    const cat = entry.categories[sectionKey];
    if (!cat) return 0;
    switch (metricKey) {
      case 'value':
        return cat.value;
      case 'count':
        return cat.count;
      case 'set_completion':
        return cat.sets.size;
      case 'chase_count':
        return cat.chaseCount;
      default:
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
      ...e,
      rank: i + 1,
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