import { base44 } from '@/api/base44Client';
import { computeCollectorScore } from '@/lib/collectorScore';

export const LEADERBOARD_CATEGORIES = [
  { key: 'overall_value', label: 'Overall Value', icon: '💰' },
  { key: 'Pokémon', label: 'Pokémon', icon: '⚡' },
  { key: 'Magic: The Gathering', label: 'Magic', icon: '🃏' },
  { key: 'Disney Lorcana', label: 'Lorcana', icon: '✨' },
  { key: 'Sports Cards', label: 'Sports Cards', icon: '⚾' },
  { key: 'Funko Pop!', label: 'Funko', icon: '🎭' },
  { key: 'Coins', label: 'Coins', icon: '🪙' },
  { key: 'Sports Memorabilia', label: 'Sports Memorabilia', icon: '🏆' },
  { key: 'collector_score', label: 'Collector Score', icon: '⭐' },
  { key: 'graded_collection', label: 'Graded Collection', icon: '🎖️' },
];

const CATEGORY_KEYS = [
  'Pokémon',
  'Magic: The Gathering',
  'Disney Lorcana',
  'Sports Cards',
  'Funko Pop!',
  'Coins',
  'Sports Memorabilia',
];

export async function getLeaderboard(categoryKey) {
  const profiles = await base44.entities.CollectorProfile.filter({ leaderboard_opt_in: true });
  const optInUserIds = new Set(profiles.map((p) => p.user_id));
  const profileMap = {};
  profiles.forEach((p) => { profileMap[p.user_id] = p; });

  const collectibles = await base44.entities.Collectible.filter(
    { privacy_status: 'public', is_deleted: false },
    '-estimated_value',
    1000
  );

  const verifiedOnly = collectibles.filter((c) => c.value_type === 'verified_sold');

  const userMap = {};
  verifiedOnly.forEach((c) => {
    if (!optInUserIds.has(c.created_by_id)) return;
    if (!userMap[c.created_by_id]) {
      userMap[c.created_by_id] = {
        userId: c.created_by_id,
        totalValue: 0,
        itemCount: 0,
        gradedCount: 0,
        categories: {},
      };
    }
    const u = userMap[c.created_by_id];
    u.totalValue += c.estimated_value || 0;
    u.itemCount++;
    if (c.grading_company) u.gradedCount++;
    const cat = c.category_name || 'Unknown';
    if (!u.categories[cat]) u.categories[cat] = { value: 0, count: 0 };
    u.categories[cat].value += c.estimated_value || 0;
    u.categories[cat].count++;
  });

  let entries = Object.values(userMap);

  if (categoryKey === 'overall_value') {
    entries.sort((a, b) => b.totalValue - a.totalValue);
  } else if (categoryKey === 'collector_score') {
    entries = entries.map((e) => {
      const score = computeCollectorScore(
        verifiedOnly.filter((c) => c.created_by_id === e.userId),
        [],
        [],
        []
      );
      return { ...e, scoreValue: score.score };
    });
    entries.sort((a, b) => (b.scoreValue || 0) - (a.scoreValue || 0));
  } else if (categoryKey === 'graded_collection') {
    entries.sort((a, b) => b.gradedCount - a.gradedCount);
  } else if (CATEGORY_KEYS.includes(categoryKey)) {
    entries = entries.filter((e) => e.categories[categoryKey]);
    entries.sort((a, b) => (b.categories[categoryKey]?.value || 0) - (a.categories[categoryKey]?.value || 0));
  }

  return entries.slice(0, 50).map((e, i) => ({
    ...e,
    rank: i + 1,
    displayName: profileMap[e.userId]?.display_name || 'Collector',
    username: profileMap[e.userId]?.username || '',
    profilePhoto: profileMap[e.userId]?.profile_photo || '',
    scoreValue: e.scoreValue || 0,
  }));
}