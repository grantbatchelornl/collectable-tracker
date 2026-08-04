import { base44 } from '@/api/base44Client';

export const XP_REWARDS = {
  ADD_COLLECTIBLE: 10,
  COMPLETE_BINDER: 100,
  SCAN_COLLECTIBLE: 5,
  COMPLETE_TRADE: 25,
  EARN_ACHIEVEMENT: 50,
  MAINTAIN_HEALTH: 15,
  DAILY_LOGIN: 5,
};

export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000, 75000, 100000];

export const LEVEL_TITLES = [
  'Novice Collector',
  'Casual Collector',
  'Active Collector',
  'Dedicated Collector',
  'Serious Collector',
  'Expert Collector',
  'Master Collector',
  'Elite Collector',
  'Legendary Collector',
  'Hall of Famer',
  'Mythic Collector',
  'Titan Collector',
  'Grandmaster Collector',
];

export function getLevelFromXP(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] || 'Collector';
}

export function getXPToNextLevel(xp) {
  const level = getLevelFromXP(xp);
  if (level >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[level] - xp;
}

export function getLevelProgress(xp) {
  const level = getLevelFromXP(xp);
  if (level >= LEVEL_THRESHOLDS.length) return 100;
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level];
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export async function awardXP(user, amount, reason) {
  if (!user || amount <= 0) return null;
  try {
    const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
    if (profiles.length === 0) return null;
    const profile = profiles[0];
    const newXP = (profile.xp || 0) + amount;
    const newLevel = getLevelFromXP(newXP);
    const oldLevel = profile.level || 1;
    const updated = await base44.entities.CollectorProfile.update(profile.id, {
      xp: newXP,
      level: newLevel,
      xp_to_next_level: getXPToNextLevel(newXP),
    });
    return {
      xp: newXP,
      level: newLevel,
      leveledUp: newLevel > oldLevel,
      newTitle: newLevel > oldLevel ? getLevelTitle(newLevel) : null,
    };
  } catch (e) {
    console.error('Failed to award XP:', e);
    return null;
  }
}