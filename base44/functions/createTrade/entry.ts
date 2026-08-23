import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MAX_ITEMS_PER_SIDE = 20;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_TRADES_PER_HOUR = 20;

function serializeTradeItem(item: any) {
  return {
    id: item.id,
    name: item.item_name,
    value: Number(item.estimated_value || 0),
    value_type: item.value_type || 'manual',
    confidence: item.value_confidence || 'low',
    photo: item.primary_photo_url || '',
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.is_suspended) return Response.json({ error: 'Your account is suspended.' }, { status: 403 });

    const body = await req.json();
    const recipientId = String(body.recipientId || '');
    const offeredItemIds = Array.isArray(body.offeredItemIds) ? [...new Set(body.offeredItemIds.map(String))] : [];
    const requestedItemIds = Array.isArray(body.requestedItemIds) ? [...new Set(body.requestedItemIds.map(String))] : [];
    const message = String(body.message || '').trim().slice(0, MAX_MESSAGE_LENGTH);
    const requestedCashAdjustment = Math.max(0, Number(body.cashAdjustment || 0));
    const originalTradeId = body.originalTradeId ? String(body.originalTradeId) : '';

    if (!recipientId) return Response.json({ error: 'Missing recipient' }, { status: 400 });
    if (recipientId === user.id) return Response.json({ error: 'You cannot trade with yourself' }, { status: 400 });
    if (!offeredItemIds.length || !requestedItemIds.length) {
      return Response.json({ error: 'A trade must contain items on both sides' }, { status: 400 });
    }
    if (offeredItemIds.length > MAX_ITEMS_PER_SIDE || requestedItemIds.length > MAX_ITEMS_PER_SIDE) {
      return Response.json({ error: `A trade may contain at most ${MAX_ITEMS_PER_SIDE} items per side` }, { status: 400 });
    }

    const recipient = await base44.asServiceRole.entities.User.get(recipientId).catch(() => null);
    if (!recipient) return Response.json({ error: 'Recipient not found' }, { status: 404 });
    if (recipient.is_suspended) return Response.json({ error: 'Recipient account is suspended' }, { status: 403 });

    const [myBlock, theirBlock] = await Promise.all([
      base44.asServiceRole.entities.UserBlock.filter({ blocker_id: user.id, blocked_id: recipientId }),
      base44.asServiceRole.entities.UserBlock.filter({ blocker_id: recipientId, blocked_id: user.id }),
    ]);
    if (myBlock.length || theirBlock.length) {
      return Response.json({ error: 'Trade unavailable between these accounts' }, { status: 403 });
    }

    const recentTrades = await base44.asServiceRole.entities.Trade.filter({ proposer_id: user.id }, '-created_date', MAX_TRADES_PER_HOUR);
    if (recentTrades.length >= MAX_TRADES_PER_HOUR) {
      const oldest = new Date(recentTrades[MAX_TRADES_PER_HOUR - 1].created_date || 0).getTime();
      if (oldest > Date.now() - 60 * 60 * 1000) {
        return Response.json({ error: 'Trade limit reached. Please wait before sending more offers.' }, { status: 429 });
      }
    }

    const [forwardFriend, reverseFriend] = await Promise.all([
      base44.asServiceRole.entities.Follow.filter({ follower_id: user.id, following_id: recipientId, status: 'active' }),
      base44.asServiceRole.entities.Follow.filter({ follower_id: recipientId, following_id: user.id, status: 'active' }),
    ]);
    const areFriends = forwardFriend.length > 0 || reverseFriend.length > 0;

    const offeredItems = [];
    for (const id of offeredItemIds) {
      const item = await base44.asServiceRole.entities.Collectible.get(id).catch(() => null);
      if (!item || item.is_deleted || item.created_by_id !== user.id) {
        return Response.json({ error: 'One or more offered items are invalid or not owned by you' }, { status: 403 });
      }
      offeredItems.push(item);
    }

    const requestedItems = [];
    for (const id of requestedItemIds) {
      const item = await base44.asServiceRole.entities.Collectible.get(id).catch(() => null);
      if (!item || item.is_deleted || item.created_by_id !== recipientId) {
        return Response.json({ error: 'One or more requested items are invalid' }, { status: 400 });
      }
      const visible = item.privacy_status === 'public' || (item.privacy_status === 'friends' && areFriends);
      if (!visible || !['trade', 'sell'].includes(item.trade_status)) {
        return Response.json({ error: 'One or more requested items are not currently available for trade' }, { status: 403 });
      }
      requestedItems.push(item);
    }

    if (originalTradeId) {
      const original = await base44.asServiceRole.entities.Trade.get(originalTradeId).catch(() => null);
      if (!original || ![original.proposer_id, original.recipient_id].includes(user.id) || ![original.proposer_id, original.recipient_id].includes(recipientId)) {
        return Response.json({ error: 'Invalid original trade for counter offer' }, { status: 403 });
      }
    }

    const offeredValue = offeredItems.reduce((sum, item) => sum + Number(item.estimated_value || 0), 0);
    const requestedValue = requestedItems.reduce((sum, item) => sum + Number(item.estimated_value || 0), 0);
    const cashDirection = offeredValue < requestedValue ? 'proposer_to_recipient' : 'recipient_to_proposer';

    const proposerProfiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: user.id });
    const recipientProfiles = await base44.asServiceRole.entities.CollectorProfile.filter({ user_id: recipientId });
    const proposerProfile = proposerProfiles[0];
    const recipientProfile = recipientProfiles[0];

    const trade = await base44.asServiceRole.entities.Trade.create({
      proposer_id: user.id,
      recipient_id: recipientId,
      proposer_name: proposerProfile?.display_name || user.display_name || user.full_name || '',
      recipient_name: recipientProfile?.display_name || recipient.display_name || '',
      proposer_photo: proposerProfile?.profile_photo || user.profile_photo || '',
      status: 'pending',
      message: message || undefined,
      offered_items_json: JSON.stringify(offeredItems.map(serializeTradeItem)),
      requested_items_json: JSON.stringify(requestedItems.map(serializeTradeItem)),
      offered_value: offeredValue,
      requested_value: requestedValue,
      cash_adjustment: Number.isFinite(requestedCashAdjustment) ? requestedCashAdjustment : 0,
      cash_direction: cashDirection,
      is_counter_offer: !!originalTradeId,
      original_trade_id: originalTradeId || undefined,
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_id: recipientId,
      type: 'trade_request',
      title: originalTradeId ? 'New Counter Offer' : 'New Trade Offer',
      body: `${proposerProfile?.display_name || user.display_name || user.full_name || 'A collector'} sent you a trade offer`,
      destination_route: '/messages',
      icon: '🔄',
    }).catch(() => null);

    await base44.asServiceRole.entities.AuditLog.create({
      user_id: user.id,
      action: 'trade_created',
      target_type: 'Trade',
      target_id: trade.id,
      target_name: recipientProfile?.display_name || recipient.display_name || 'Collector',
      success: true,
      details: JSON.stringify({ recipient_id: recipientId, offered_count: offeredItems.length, requested_count: requestedItems.length }),
    }).catch(() => null);

    return Response.json({ success: true, trade });
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to create trade' }, { status: 500 });
  }
}
