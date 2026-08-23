import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_TRANSITIONS = {
  pending: new Set(['accepted', 'rejected', 'cancelled']),
  accepted: new Set(['completed']),
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.is_suspended) return Response.json({ error: 'Your account is suspended.' }, { status: 403 });

    const body = await req.json();
    const tradeId = String(body.tradeId || '');
    const newStatus = String(body.status || '');
    if (!tradeId || !newStatus) return Response.json({ error: 'Missing tradeId or status' }, { status: 400 });

    const trade = await base44.asServiceRole.entities.Trade.get(tradeId).catch(() => null);
    if (!trade) return Response.json({ error: 'Trade not found' }, { status: 404 });

    const isProposer = trade.proposer_id === user.id;
    const isRecipient = trade.recipient_id === user.id;
    if (!isProposer && !isRecipient) return Response.json({ error: 'Not authorized for this trade' }, { status: 403 });

    const transitions = ALLOWED_TRANSITIONS[trade.status];
    if (!transitions || !transitions.has(newStatus)) {
      return Response.json({ error: `Invalid trade transition: ${trade.status} → ${newStatus}` }, { status: 409 });
    }

    if (['accepted', 'rejected', 'completed'].includes(newStatus) && !isRecipient) {
      return Response.json({ error: 'Only the recipient can perform this action' }, { status: 403 });
    }
    if (newStatus === 'cancelled' && !isProposer) {
      return Response.json({ error: 'Only the proposer can cancel this offer' }, { status: 403 });
    }

    if (newStatus === 'accepted' || newStatus === 'completed') {
      const offered = JSON.parse(trade.offered_items_json || '[]');
      const requested = JSON.parse(trade.requested_items_json || '[]');
      for (const item of [...offered, ...requested]) {
        const current = await base44.asServiceRole.entities.Collectible.get(item.id).catch(() => null);
        if (!current || current.is_deleted) {
          return Response.json({ error: 'A collectible in this trade is no longer available' }, { status: 409 });
        }
      }
    }

    const updated = await base44.asServiceRole.entities.Trade.update(tradeId, { status: newStatus });

    const notifyUserId = isProposer ? trade.recipient_id : trade.proposer_id;
    const actorProfiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: user.id });
    const actorName = actorProfiles[0]?.display_name || user.display_name || user.full_name || 'A collector';

    await base44.asServiceRole.entities.Notification.create({
      recipient_id: notifyUserId,
      type: 'trade_update',
      title: 'Trade Updated',
      body: `${actorName} marked the trade as ${newStatus}`,
      destination_route: '/messages',
      icon: '🔄',
    }).catch(() => null);

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      action: 'trade_status_changed',
      target_type: 'Trade',
      target_id: tradeId,
      target_name: trade.recipient_name || trade.proposer_name || 'Trade',
      previous_value: JSON.stringify({ status: trade.status }),
      new_value: JSON.stringify({ status: newStatus }),
      success: true,
    }).catch(() => null);

    return Response.json({ success: true, trade: updated });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to update trade' }, { status: 500 });
  }
}
