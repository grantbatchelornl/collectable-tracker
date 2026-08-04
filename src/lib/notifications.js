import { base44 } from '@/api/base44Client';

export async function createNotification({
  recipientId,
  type,
  title,
  body,
  destinationRoute,
  destinationId,
  icon,
}) {
  if (!recipientId || !type || !title) return;
  try {
    await base44.entities.Notification.create({
      recipient_id: recipientId,
      type,
      title,
      body: body || undefined,
      destination_route: destinationRoute || undefined,
      destination_id: destinationId || undefined,
      read: false,
      icon: icon || undefined,
    });
  } catch (err) {
    console.error('Failed to create notification', err);
  }
}

export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  TRADE_REQUEST: 'trade_request',
  TRADE_UPDATE: 'trade_update',
  ACHIEVEMENT: 'achievement',
  PRICE_INCREASE: 'price_increase',
  PRICE_DECREASE: 'price_decrease',
  GRADE_WORTHINESS: 'grade_worthiness',
  WISHLIST_MATCH: 'wishlist_match',
  LEADERBOARD: 'leaderboard',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  SECURITY_ALERT: 'security_alert',
  COLLECTION_HEALTH: 'collection_health',
};

export async function checkPriceChangeNotifications(user, collectibles, pricingHistory, thresholds) {
  if (!user?.id) return;
  const increaseThreshold = thresholds?.price_increase_threshold || 10;
  const decreaseThreshold = thresholds?.price_decrease_threshold || 10;

  // Group by collectible_id — single pass instead of O(n²) filter per entry
  const historyByCollectible = {};
  (pricingHistory || []).forEach((h) => {
    if (!historyByCollectible[h.collectible_id]) {
      historyByCollectible[h.collectible_id] = [];
    }
    historyByCollectible[h.collectible_id].push(h);
  });

  const latestByCollectible = {};
  const secondLatest = {};
  Object.entries(historyByCollectible).forEach(([id, history]) => {
    const sorted = [...history].sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date)
    );
    if (sorted[0]) latestByCollectible[id] = sorted[0];
    if (sorted[1]) secondLatest[id] = sorted[1];
  });

  for (const c of collectibles) {
    const latest = latestByCollectible[c.id];
    const previous = secondLatest[c.id];
    if (!latest || !previous) continue;

    const change = latest.estimated_value - previous.estimated_value;
    if (Math.abs(change) < increaseThreshold) continue;

    if (change > 0) {
      await createNotification({
        recipientId: user.id,
        type: NOTIFICATION_TYPES.PRICE_INCREASE,
        title: `Price Increase: ${c.item_name}`,
        body: `Value increased by $${change.toFixed(2)} to $${latest.estimated_value.toFixed(2)}`,
        destinationRoute: `/collectible/${c.id}`,
        destinationId: c.id,
      });
    } else {
      await createNotification({
        recipientId: user.id,
        type: NOTIFICATION_TYPES.PRICE_DECREASE,
        title: `Price Decrease: ${c.item_name}`,
        body: `Value decreased by $${Math.abs(change).toFixed(2)} to $${latest.estimated_value.toFixed(2)}`,
        destinationRoute: `/collectible/${c.id}`,
        destinationId: c.id,
      });
    }
  }
}

export async function checkWishlistMatchNotifications(user, watchlistItems, forSaleCollectibles) {
  if (!user?.id || !watchlistItems?.length) return;

  for (const item of watchlistItems) {
    if (item.status !== 'active') continue;
    const match = forSaleCollectibles.find((c) => {
      if (c.for_sale !== true) return false;
      if (item.collectible_id && c.id === item.collectible_id) return true;
      if (item.item_name && c.item_name && c.item_name.toLowerCase().includes(item.item_name.toLowerCase())) return true;
      return false;
    });

    if (match) {
      const askingPrice = match.asking_price || match.estimated_value || 0;
      if (item.target_price > 0 && askingPrice <= item.target_price) {
        await createNotification({
          recipientId: user.id,
          type: NOTIFICATION_TYPES.WISHLIST_MATCH,
          title: `Wishlist Match: ${item.item_name}`,
          body: `Found for $${askingPrice.toFixed(2)} (target: $${item.target_price.toFixed(2)})`,
          destinationRoute: `/collectible/${match.id}`,
          destinationId: match.id,
        });
      }
    }
  }
}

export async function checkCollectionHealthNotification(user, collectibles, photos) {
  if (!user?.id) return;
  const missingPhotos = collectibles.filter((c) => !c.primary_photo_url).length;
  const staleItems = collectibles.filter((c) => c.is_stale).length;

  if (missingPhotos > 0 || staleItems > 0) {
    await createNotification({
      recipientId: user.id,
      type: NOTIFICATION_TYPES.COLLECTION_HEALTH,
      title: 'Collection Health Reminder',
      body: `${missingPhotos} items missing photos, ${staleItems} items with stale pricing. Visit Data Quality to improve your score.`,
      destinationRoute: '/data-quality',
    });
  }
}