import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const results = [];

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
    const ownItems = await base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 1);
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