import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { binder_id, snapshot, collection_value, total_items, graded_items } = body;

    if (!binder_id) return Response.json({ error: 'Missing binder_id' }, { status: 400 });

    // Fetch the binder — RLS enforces ownership
    const binder = await base44.entities.CollectionBinder.get(binder_id);
    if (!binder) return Response.json({ error: 'Binder not found' }, { status: 404 });

    // Already completed — don't re-process
    if (binder.completion_date) {
      return Response.json({ already_completed: true, completion_date: binder.completion_date });
    }

    const completionDate = new Date().toISOString().split('T')[0];

    // Record completion date + snapshot on the binder
    await base44.entities.CollectionBinder.update(binder.id, {
      completion_date: completionDate,
      completion_snapshot: snapshot ? JSON.stringify(snapshot) : undefined,
      last_milestone_notified: 100,
      completion_percent: 100,
      owned_count: total_items || binder.owned_count,
    });

    // Award completion achievement badge (requires service role — Achievement RLS is system_only)
    let achievementId = null;
    try {
      const achievement = await base44.asServiceRole.entities.Achievement.create({
        user_id: user.id,
        badge_type: 'binder_completion',
        badge_name: `${binder.name} — Complete`,
        badge_icon: '🏆',
        badge_description: `Completed the ${binder.name} binder with ${total_items || binder.target_count || 0} items on ${completionDate}.`,
      });
      achievementId = achievement.id;
    } catch (e) {
      // non-critical — achievement may already exist
    }

    // Create Hall of Fame entry (binder stays in My Binders)
    try {
      await base44.asServiceRole.entities.HallOfFame.create({
        user_id: user.id,
        entry_type: binder.binder_type === 'master' ? 'completed_binder' : 'custom_binder_100',
        title: binder.name,
        description: `Completed ${binder.franchise || ''} ${binder.set_name || ''} with ${total_items || 0} items. Collection value: $${(collection_value || 0).toLocaleString()}.`,
        binder_id: binder.id,
        achievement_id: achievementId,
        photo_url: binder.cover_photo_url,
        completion_date: completionDate,
        metric_value: collection_value || 0,
      });
    } catch (e) {
      // non-critical
    }

    // Send notification
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_id: user.id,
        type: 'binder_complete',
        title: `🏆 ${binder.name} Complete!`,
        body: `Congratulations! You've completed your ${binder.name} binder. It's been added to your Hall of Fame.`,
        destination_route: `/binder/${binder.id}`,
        destination_id: binder.id,
        icon: '🏆',
      });
    } catch (e) {
      // non-critical
    }

    return Response.json({
      success: true,
      completion_date: completionDate,
      achievement_id: achievementId,
      collection_value: collection_value || 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}