import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { BADGE_DEFINITIONS, BADGE_TYPES } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only Super Admin can manually award or revoke achievements
    if (user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Only Super Admins can manage achievements manually' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, badgeType, action, reason } = body;

    // Validate inputs
    if (!targetUserId) return Response.json({ error: 'Missing target user ID' }, { status: 400 });
    if (!BADGE_TYPES.includes(badgeType)) return Response.json({ error: 'Invalid badge type' }, { status: 400 });
    if (!['award', 'revoke'].includes(action)) return Response.json({ error: 'Invalid action (must be award or revoke)' }, { status: 400 });

    // Verify target user exists
    let targetUser;
    try {
      targetUser = await base44.asServiceRole.entities.User.get(targetUserId);
    } catch (e) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    const badgeDef = BADGE_DEFINITIONS.find((b) => b.type === badgeType);

    // Check for existing achievement (uniqueness — prevents duplicate awards)
    const existing = await base44.asServiceRole.entities.Achievement.filter({
      user_id: targetUserId,
      badge_type: badgeType,
    });

    if (action === 'award') {
      // Uniqueness: one-time achievements may only be awarded once
      if (existing.length > 0) {
        return Response.json({ error: 'Achievement already awarded to this user' }, { status: 400 });
      }
      const achievement = await base44.asServiceRole.entities.Achievement.create({
        user_id: targetUserId,
        badge_type: badgeType,
        badge_name: badgeDef.name,
        badge_icon: badgeDef.icon,
        badge_description: badgeDef.description,
      });
      // Notify the user
      await base44.asServiceRole.entities.Notification.create({
        recipient_id: targetUserId,
        type: 'achievement',
        title: `Achievement Awarded: ${badgeDef.name}`,
        body: badgeDef.description,
        icon: badgeDef.icon,
      });
      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'manual_achievement_award',
        target_type: 'achievement',
        target_id: achievement.id,
        target_name: `${targetUser.display_name || targetUser.email} - ${badgeDef.name}`,
        details: JSON.stringify({
          admin_id: user.id,
          admin_email: user.email,
          target_user_id: targetUserId,
          badge_type: badgeType,
          reason: reason || 'No reason provided',
        }),
      });
      return Response.json({ success: true, achievement });
    } else {
      // revoke
      if (existing.length === 0) {
        return Response.json({ error: 'Achievement not found for this user' }, { status: 404 });
      }
      await base44.asServiceRole.entities.Achievement.delete(existing[0].id);
      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'manual_achievement_revoke',
        target_type: 'achievement',
        target_id: existing[0].id,
        target_name: `${targetUser.display_name || targetUser.email} - ${badgeDef.name}`,
        details: JSON.stringify({
          admin_id: user.id,
          admin_email: user.email,
          target_user_id: targetUserId,
          badge_type: badgeType,
          reason: reason || 'No reason provided',
        }),
      });
      return Response.json({ success: true, revoked: true });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}