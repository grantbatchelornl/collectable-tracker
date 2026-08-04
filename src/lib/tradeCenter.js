import { base44 } from '@/api/base44Client';

export async function getTradeBinder(userId) {
  const items = await base44.entities.Collectible.filter(
    { created_by_id: userId, is_deleted: false },
    '-estimated_value', 500
  );
  return items.filter((c) => c.trade_status === 'trade' || c.trade_status === 'sell');
}

export async function getPublicTradeBinders(currentUserId) {
  const items = await base44.entities.Collectible.filter(
    { is_deleted: false, privacy_status: 'public' },
    '-estimated_value', 1000
  );
  const tradeItems = items.filter((c) => c.trade_status === 'trade' || c.trade_status === 'sell');

  const byUser = {};
  tradeItems.forEach((c) => {
    if (c.created_by_id === currentUserId) return;
    if (!byUser[c.created_by_id]) byUser[c.created_by_id] = [];
    byUser[c.created_by_id].push(c);
  });

  const userIds = Object.keys(byUser);
  if (userIds.length === 0) return [];
  const profileRes = await base44.functions.invoke('getPublicProfiles', {});
  const allProfiles = profileRes.data?.profiles || profileRes.profiles || [];
  const profiles = allProfiles.filter((p) => userIds.includes(p.user_id));
  const profileMap = {};
  profiles.forEach((p) => { profileMap[p.user_id] = p; });

  return Object.entries(byUser).map(([userId, items]) => ({
    userId,
    displayName: profileMap[userId]?.display_name || 'Collector',
    profilePhoto: profileMap[userId]?.profile_photo || '',
    items,
    totalValue: items.reduce((s, i) => s + (i.estimated_value || 0), 0),
  }));
}

export async function getWishlistMatches(userId) {
  const wishlist = await base44.entities.Watchlist.filter({ user_id: userId, status: 'active' });
  if (wishlist.length === 0) return [];

  const items = await base44.entities.Collectible.filter(
    { is_deleted: false, privacy_status: 'public' },
    '-estimated_value', 1000
  );
  const tradeItems = items.filter((c) =>
    (c.trade_status === 'trade' || c.trade_status === 'sell') && c.created_by_id !== userId
  );

  const matches = [];
  wishlist.forEach((wish) => {
    const wishName = (wish.item_name || '').toLowerCase();
    if (!wishName) return;
    const matching = tradeItems.filter((c) => {
      const itemName = (c.item_name || '').toLowerCase();
      return itemName.includes(wishName) || wishName.includes(itemName);
    });
    if (matching.length > 0) {
      const byUser = {};
      matching.forEach((c) => {
        if (!byUser[c.created_by_id]) byUser[c.created_by_id] = [];
        byUser[c.created_by_id].push(c);
      });
      Object.entries(byUser).forEach(([sellerId, sellerItems]) => {
        matches.push({ wishlist: wish, sellerId, items: sellerItems });
      });
    }
  });
  return matches;
}

export async function findTradeMatches(userId) {
  const [myTradeItems, myWishlist] = await Promise.all([
    getTradeBinder(userId),
    base44.entities.Watchlist.filter({ user_id: userId, status: 'active' }),
  ]);

  if (myTradeItems.length === 0 || myWishlist.length === 0) return [];

  const items = await base44.entities.Collectible.filter(
    { is_deleted: false, privacy_status: 'public' },
    '-estimated_value', 1000
  );
  const theirTradeItems = items.filter((c) =>
    (c.trade_status === 'trade' || c.trade_status === 'sell') && c.created_by_id !== userId
  );

  const matches = [];
  myWishlist.forEach((wish) => {
    const wishName = (wish.item_name || '').toLowerCase();
    if (!wishName) return;
    theirTradeItems.forEach((theirItem) => {
      const itemName = (theirItem.item_name || '').toLowerCase();
      if (itemName.includes(wishName) || wishName.includes(itemName)) {
        matches.push({
          partnerId: theirItem.created_by_id,
          partnerItem: theirItem,
          wishlistItem: wish,
        });
      }
    });
  });

  const byPartner = {};
  matches.forEach((m) => {
    if (!byPartner[m.partnerId]) {
      byPartner[m.partnerId] = { partnerId: m.partnerId, theirItems: [], wishlistMatches: [] };
    }
    const existing = byPartner[m.partnerId].theirItems.find((i) => i.id === m.partnerItem.id);
    if (!existing) byPartner[m.partnerId].theirItems.push(m.partnerItem);
    const existingWish = byPartner[m.partnerId].wishlistMatches.find((w) => w.id === m.wishlistItem.id);
    if (!existingWish) byPartner[m.partnerId].wishlistMatches.push(m.wishlistItem);
  });

  Object.values(byPartner).forEach((match) => {
    match.myItems = myTradeItems;
  });

  return Object.values(byPartner);
}

export async function getAISuggestedTrades(userId, match) {
  const myItems = match.myItems.slice(0, 10);
  const theirItems = match.theirItems.slice(0, 10);

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a collectibles trade matching AI.

User A wants: ${match.wishlistMatches.map((w) => w.item_name).join(', ')}

User A has for trade:
${myItems.map((i) => `${i.item_name} ($${i.estimated_value || 0})`).join('\n')}

User B has for trade:
${theirItems.map((i) => `${i.item_name} ($${i.estimated_value || 0})`).join('\n')}

Suggest the best fair trade between User A and User B.
Pick 1-3 specific items from each side that create the fairest exchange.
Calculate value difference and suggest cash adjustment if needed.
Rate fairness from 0-100%.

Return as JSON.`,
    response_json_schema: {
      type: 'object',
      properties: {
        user_a_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        user_b_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        user_a_total: { type: 'number' },
        user_b_total: { type: 'number' },
        cash_adjustment: { type: 'number' },
        cash_direction: { type: 'string' },
        fairness: { type: 'number' },
        explanation: { type: 'string' }
      }
    }
  });
  return response;
}

export function calculateFairness(valueA, valueB) {
  if (valueA === 0 && valueB === 0) return 0;
  const max = Math.max(valueA, valueB);
  const diff = Math.abs(valueA - valueB);
  return Math.max(0, Math.round(100 - (diff / max) * 100));
}

export function calculateCashAdjustment(valueA, valueB) {
  if (valueA > valueB) return { amount: valueA - valueB, direction: 'a_to_b' };
  if (valueB > valueA) return { amount: valueB - valueA, direction: 'b_to_a' };
  return { amount: 0, direction: 'none' };
}

export async function sendTradeOffer(user, partnerId, partnerName, offeredItems, requestedItems, message) {
  const offeredValue = offeredItems.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const requestedValue = requestedItems.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const cash = calculateCashAdjustment(offeredValue, requestedValue);

  const trade = await base44.entities.Trade.create({
    proposer_id: user.id,
    recipient_id: partnerId,
    proposer_name: user.full_name || user.email,
    recipient_name: partnerName,
    status: 'pending',
    message: message || undefined,
    offered_items_json: JSON.stringify(offeredItems.map((i) => ({
      id: i.id, name: i.item_name, value: i.estimated_value, photo: i.primary_photo_url,
    }))),
    requested_items_json: JSON.stringify(requestedItems.map((i) => ({
      id: i.id, name: i.item_name, value: i.estimated_value, photo: i.primary_photo_url,
    }))),
    offered_value: offeredValue,
    requested_value: requestedValue,
    cash_adjustment: cash.amount,
    cash_direction: cash.amount === 0 ? 'proposer_to_recipient' : (cash.direction === 'a_to_b' ? 'proposer_to_recipient' : 'recipient_to_proposer'),
  });

  await base44.entities.Notification.create({
    recipient_id: partnerId,
    type: 'trade_request',
    title: 'New Trade Offer!',
    body: `${user.full_name || user.email} proposed a trade with you`,
    destination_route: '/messages',
    icon: '🔄',
  });

  return trade;
}