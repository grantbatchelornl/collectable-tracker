import { base44 } from '@/api/base44Client';

export async function createNotification({
  recipientId,
  type,
  title,
  body,
  destinationRoute,
  destinationId,
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