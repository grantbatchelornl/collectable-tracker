import { base44 } from '@/api/base44Client';

export async function syncCollectorProfile(user) {
  if (!user?.id) return;
  const data = {
    user_id: user.id,
    display_name: user.display_name || user.full_name || '',
    username: user.username || '',
    bio: user.bio || '',
    profile_photo: user.profile_photo || '',
    show_public_value: user.privacy_show_public_value || false,
  };
  try {
    const existing = await base44.entities.CollectorProfile.filter({ user_id: user.id });
    if (existing.length > 0) {
      await base44.entities.CollectorProfile.update(existing[0].id, data);
    } else {
      await base44.entities.CollectorProfile.create(data);
    }
  } catch (err) {
    console.error('Failed to sync collector profile:', err);
  }
}

export function parseTradeItems(jsonString) {
  if (!jsonString) return [];
  try {
    return JSON.parse(jsonString);
  } catch {
    return [];
  }
}

export function serializeTradeItems(items) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      item_name: item.item_name,
      primary_photo_url: item.primary_photo_url || '',
      estimated_value: item.estimated_value || 0,
      category_name: item.category_name || '',
    }))
  );
}

export function getInitials(name) {
  if (!name) return 'C';
  return name.charAt(0).toUpperCase();
}