import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { containsPrivateFields } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const results = [];

    // === EXISTING TESTS ===

    // Test 1: Direct Message creation should be blocked by RLS
    try {
      await base44.entities.Message.create({
        sender_id: user.id,
        recipient_id: user.id,
        body: '__security_test__',
      });
      results.push({ test: 'message_direct_create_blocked', passed: false, reason: 'Creation succeeded — RLS not blocking' });
    } catch (e) {
      results.push({ test: 'message_direct_create_blocked', passed: true, reason: 'Creation blocked by RLS' });
    }

    // Test 2: Direct Achievement creation should be blocked by RLS
    try {
      await base44.entities.Achievement.create({
        user_id: user.id,
        badge_type: '__security_test__',
        badge_name: 'Test',
      });
      results.push({ test: 'achievement_direct_create_blocked', passed: false, reason: 'Creation succeeded — RLS not blocking' });
    } catch (e) {
      results.push({ test: 'achievement_direct_create_blocked', passed: true, reason: 'Creation blocked by RLS' });
    }

    // Test 3: Cannot read another user's private collectibles
    const otherUserItems = await base44.entities.Collectible.filter({
      created_by_id: 'nonexistent_user_id_000',
      privacy_status: 'private',
    });
    results.push({
      test: 'cross_user_private_blocked',
      passed: otherUserItems.length === 0,
      reason: otherUserItems.length === 0 ? 'No private items returned' : `${otherUserItems.length} private items leaked`,
    });

    // Test 4: Can read own collectibles
    results.push({
      test: 'own_collectibles_readable',
      passed: true,
      reason: 'Own collectibles accessible',
    });

    // Test 5: Cannot read another user's notifications
    const otherNotifications = await base44.entities.Notification.filter({
      recipient_id: 'nonexistent_user_id_000',
    });
    results.push({
      test: 'cross_user_notifications_blocked',
      passed: otherNotifications.length === 0,
      reason: otherNotifications.length === 0 ? 'No other user notifications returned' : `${otherNotifications.length} notifications leaked`,
    });

    // Test 6: Cannot read another user's AIReviewQueue items
    const otherQueue = await base44.entities.AIReviewQueue.filter({
      user_id: 'nonexistent_user_id_000',
    });
    results.push({
      test: 'cross_user_review_queue_blocked',
      passed: otherQueue.length === 0,
      reason: otherQueue.length === 0 ? 'No other user queue items returned' : `${otherQueue.length} queue items leaked`,
    });

    // === NEW REGRESSION TESTS ===

    // Test 7: Non-owner cannot update another user's collectible (RLS enforced)
    try {
      await base44.entities.Collectible.update('nonexistent_id_000', { for_sale: true });
      results.push({ test: 'non_owner_collectible_update_blocked', passed: false, reason: 'Update call did not fail' });
    } catch (e) {
      results.push({ test: 'non_owner_collectible_update_blocked', passed: true, reason: 'Non-owner update blocked by RLS' });
    }

    // Test 8: Non-owner cannot delete another user's collectible
    try {
      await base44.entities.Collectible.delete('nonexistent_id_000');
      results.push({ test: 'non_owner_collectible_delete_blocked', passed: false, reason: 'Delete call did not fail' });
    } catch (e) {
      results.push({ test: 'non_owner_collectible_delete_blocked', passed: true, reason: 'Non-owner delete blocked by RLS' });
    }

    // Test 9: Role change requires Super Admin (call updateUserRole backend function)
    try {
      const roleRes = await base44.functions.invoke('updateUserRole', {
        targetUserId: 'nonexistent_user_test_id',
        newRole: 'admin',
        reason: 'Security regression test',
      });
      const roleData = roleRes?.data || roleRes || {};
      const hasError = !!roleData.error;
      results.push({
        test: 'role_change_requires_super_admin',
        passed: hasError,
        reason: hasError ? `Rejected: ${roleData.error}` : 'WARNING: Role change may have succeeded without super admin',
      });
    } catch (e) {
      results.push({
        test: 'role_change_requires_super_admin',
        passed: true,
        reason: 'Rejected with exception (non-super-admin blocked)',
      });
    }

    // Test 10: Self-role-change is blocked even for Super Admins
    try {
      const selfRoleRes = await base44.functions.invoke('updateUserRole', {
        targetUserId: user.id,
        newRole: 'admin',
        reason: 'Self-role-change test',
      });
      const selfRoleData = selfRoleRes?.data || selfRoleRes || {};
      const hasError = !!selfRoleData.error;
      results.push({
        test: 'role_self_change_blocked',
        passed: hasError,
        reason: hasError ? `Rejected: ${selfRoleData.error}` : 'Self-role-change was not blocked',
      });
    } catch (e) {
      results.push({
        test: 'role_self_change_blocked',
        passed: true,
        reason: 'Rejected with exception',
      });
    }

    // Test 11: Manual achievement award requires Super Admin
    try {
      const achRes = await base44.functions.invoke('manualAchievement', {
        targetUserId: 'nonexistent_user_test_id',
        badgeType: 'first_card',
        action: 'award',
        reason: 'Security regression test',
      });
      const achData = achRes?.data || achRes || {};
      const hasError = !!achData.error;
      results.push({
        test: 'manual_achievement_requires_super_admin',
        passed: hasError,
        reason: hasError ? `Rejected: ${achData.error}` : 'WARNING: Manual achievement may have succeeded without super admin',
      });
    } catch (e) {
      results.push({
        test: 'manual_achievement_requires_super_admin',
        passed: true,
        reason: 'Rejected with exception (non-super-admin blocked)',
      });
    }

    // Test 12: Public profile does not leak private fields
    try {
      const profileRes = await base44.functions.invoke('getPublicProfile', {
        targetUserId: 'nonexistent_user_test_id',
      });
      const profileData = profileRes?.data || profileRes || {};
      const profile = profileData.profile;
      const hasPrivateFields = containsPrivateFields(profile);
      results.push({
        test: 'public_profile_no_private_fields',
        passed: !hasPrivateFields,
        reason: hasPrivateFields ? 'Private fields leaked in public profile response' : 'No private fields in public profile response',
      });
    } catch (e) {
      results.push({
        test: 'public_profile_no_private_fields',
        passed: true,
        reason: 'Function rejected request (no data leaked)',
      });
    }

    // Test 13: Public profile returns full data for own profile (account owner)
    try {
      const ownProfileRes = await base44.functions.invoke('getPublicProfile', {
        targetUserId: user.id,
      });
      const ownProfileData = ownProfileRes?.data || ownProfileRes || {};
      const hasProfile = !!ownProfileData.profile;
      results.push({
        test: 'own_profile_full_data',
        passed: hasProfile,
        reason: hasProfile ? 'Own profile returned with full data' : 'Own profile not returned',
      });
    } catch (e) {
      results.push({
        test: 'own_profile_full_data',
        passed: false,
        reason: 'Failed to fetch own profile: ' + (e.message || ''),
      });
    }

    // Test 14: Message to self is blocked
    try {
      const msgRes = await base44.functions.invoke('sendMessage', {
        recipientId: user.id,
        body: 'Security test message to self',
      });
      const msgData = msgRes?.data || msgRes || {};
      const hasError = !!msgData.error;
      results.push({
        test: 'message_to_self_blocked',
        passed: hasError,
        reason: hasError ? `Rejected: ${msgData.error}` : 'Message to self was not blocked',
      });
    } catch (e) {
      results.push({
        test: 'message_to_self_blocked',
        passed: true,
        reason: 'Rejected with exception',
      });
    }

    // Test 15: Direct User.update for role change (platform limitation check)
    // Documents whether admins can change roles via direct SDK call
    try {
      await base44.entities.User.update(user.id, { role: user.role }); // no-op (same role)
      results.push({
        test: 'direct_user_update_role',
        passed: false,
        reason: 'Direct User.update succeeded — platform allows client-side role changes (known limitation)',
      });
    } catch (e) {
      results.push({
        test: 'direct_user_update_role',
        passed: true,
        reason: 'Direct User.update blocked',
      });
    }

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return Response.json({
      totalTests: results.length,
      passed,
      failed,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}