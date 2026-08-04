import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { filterPublicProfile } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) return Response.json({ error: 'Missing target user ID' }, { status: 400 });

    // If viewing own profile, return full profile (account owner sees everything)
    const isOwnProfile = targetUserId === user.id;

    // Fetch full profile using service role (bypasses RLS to read all fields)
    const profiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: targetUserId });
    const fullProfile = profiles[0] || null;

    // For other users: strip to public fields ONLY — do not return private fields
    const profile = isOwnProfile ? fullProfile : filterPublicProfile(fullProfile);

    // Check friendship (mutual follows with status='active') and block status
    let isFriend = false;
    let iBlockedThem = false;
    let theyBlockedMe = false;

    if (!isOwnProfile) {
      const [myFollow, theirFollow, myBlock, theirBlock] = await Promise.all([
        base44.asServiceRole.entities.Follow.filter({
          follower_id: user.id,
          following_id: targetUserId,
          status: 'active',
        }),
        base44.asServiceRole.entities.Follow.filter({
          follower_id: targetUserId,
          following_id: user.id,
          status: 'active',
        }),
        base44.asServiceRole.entities.UserBlock.filter({
          blocker_id: user.id,
          blocked_id: targetUserId,
        }),
        base44.asServiceRole.entities.UserBlock.filter({
          blocker_id: targetUserId,
          blocked_id: user.id,
        }),
      ]);
      isFriend = myFollow.length > 0 && theirFollow.length > 0;
      iBlockedThem = myBlock.length > 0;
      theyBlockedMe = theirBlock.length > 0;
    }

    return Response.json({
      profile,
      isFriend,
      iBlockedThem,
      theyBlockedMe,
      isOwnProfile,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}