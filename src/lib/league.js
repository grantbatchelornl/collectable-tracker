import { base44 } from '@/api/base44Client';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export async function createLeague(user, { name, description, photo_url, is_private, category }) {
  const inviteCode = generateInviteCode();
  const league = await base44.entities.League.create({
    name,
    description: description || undefined,
    photo_url: photo_url || undefined,
    is_private: is_private || false,
    owner_id: user.id,
    owner_name: user.full_name || user.email,
    invite_code: inviteCode,
    member_count: 1,
    category: category || undefined,
  });
  await base44.entities.LeagueMember.create({
    league_id: league.id,
    league_name: name,
    user_id: user.id,
    user_name: user.full_name || user.email,
    user_photo: user.profile_photo || '',
    role: 'owner',
  });
  return league;
}

export async function joinLeague(user, inviteCode) {
  const leagues = await base44.entities.League.filter({ invite_code: inviteCode.trim().toUpperCase() });
  if (!leagues[0]) throw new Error('Invalid invite code');
  const league = leagues[0];
  const existing = await base44.entities.LeagueMember.filter({ league_id: league.id, user_id: user.id });
  if (existing[0]) throw new Error('Already a member');
  await base44.entities.LeagueMember.create({
    league_id: league.id,
    league_name: league.name,
    user_id: user.id,
    user_name: user.full_name || user.email,
    user_photo: user.profile_photo || '',
    role: 'member',
  });
  await base44.entities.League.update(league.id, { member_count: (league.member_count || 1) + 1 });
  return league;
}

export async function getLeagueMembers(leagueId) {
  return base44.entities.LeagueMember.filter({ league_id: leagueId }, '-created_date', 200);
}

export async function getUserLeagues(userId) {
  const memberships = await base44.entities.LeagueMember.filter({ user_id: userId });
  if (memberships.length === 0) return [];
  const leagueIds = memberships.map((m) => m.league_id);
  const allLeagues = await base44.entities.League.list('-created_date', 200);
  return allLeagues.filter((l) => leagueIds.includes(l.id));
}

export async function getPublicLeagues() {
  const leagues = await base44.entities.League.filter({ is_private: false }, '-member_count', 50);
  return leagues;
}

export async function getLeagueFeed(leagueId) {
  return base44.entities.LeagueActivity.filter({ league_id: leagueId }, '-created_date', 50);
}

export async function getLeagueChallenges(leagueId) {
  return base44.entities.LeagueChallenge.filter({ league_id: leagueId, status: 'active' }, '-created_date', 50);
}

export async function createChallenge(user, leagueId, leagueName, data) {
  return base44.entities.LeagueChallenge.create({
    league_id: leagueId,
    league_name: leagueName,
    title: data.title,
    description: data.description || undefined,
    category: data.category || undefined,
    metric: data.metric || undefined,
    start_date: data.start_date || undefined,
    end_date: data.end_date || undefined,
    prize: data.prize || undefined,
    status: 'active',
    created_by: user.id,
  });
}

export async function postLeagueActivity(leagueId, user, activityType, description, extra = {}) {
  return base44.entities.LeagueActivity.create({
    league_id: leagueId,
    user_id: user.id,
    user_name: user.full_name || user.email,
    user_photo: user.profile_photo || '',
    activity_type: activityType,
    description,
    ...extra,
  });
}

export async function getUserLeagueIds(userId) {
  const memberships = await base44.entities.LeagueMember.filter({ user_id: userId });
  return memberships.map((m) => m.league_id);
}