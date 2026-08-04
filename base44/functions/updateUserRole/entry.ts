import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ALLOWED_ROLES } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only Super Admin may change roles
    if (user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Only Super Admins can change user roles' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, newRole, reason } = body;

    // Validate inputs
    if (!targetUserId) return Response.json({ error: 'Missing target user ID' }, { status: 400 });
    if (!ALLOWED_ROLES.includes(newRole)) return Response.json({ error: 'Invalid role' }, { status: 400 });

    // Prevent self-modification (no self-promotion or self-demotion)
    if (targetUserId === user.id) {
      return Response.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    // Fetch target user
    let targetUser;
    try {
      targetUser = await base44.asServiceRole.entities.User.get(targetUserId);
    } catch (e) {
      return Response.json({ error: 'Target user not found' }, { status: 404 });
    }

    const previousRole = targetUser.role || 'user';

    // Prevent removing the last Super Admin
    if (previousRole === 'super_admin' && newRole !== 'super_admin') {
      const superAdmins = await base44.asServiceRole.entities.User.filter({ role: 'super_admin' });
      if (superAdmins.length <= 1) {
        return Response.json({ error: 'Cannot remove the last Super Admin' }, { status: 400 });
      }
    }

    // Perform the role update via service role (bypasses client RLS)
    const updatedUser = await base44.asServiceRole.entities.User.update(targetUserId, { role: newRole });

    // Record in audit log: acting admin, target, previous/new role, reason, success
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'role_change',
      target_type: 'user',
      target_id: targetUserId,
      target_name: targetUser.display_name || targetUser.email || targetUserId,
      details: JSON.stringify({
        acting_admin_id: user.id,
        acting_admin_email: user.email,
        target_user_email: targetUser.email,
        previous_role: previousRole,
        new_role: newRole,
        reason: reason || 'No reason provided',
        success: true,
      }),
    });

    return Response.json({
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        email: updatedUser.email,
        display_name: updatedUser.display_name,
      },
      previousRole,
      newRole,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}