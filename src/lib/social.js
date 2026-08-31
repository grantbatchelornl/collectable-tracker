import { supabase } from '@/lib/supabaseClient';

export async function syncCollectorProfile(user) {
  if (!user?.id) return null;

  const data = {
    id: user.id,
    display_name: user.display_name || user.full_name || '',
    username: user.username || null,
    bio: user.bio || '',
    profile_photo: user.profile_photo || '',
    show_public_value: user.privacy_show_public_value || user.show_public_value || false,
    has_completed_onboarding: Boolean(user.has_completed_onboarding),
  };

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(data, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;

  return profile;
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

export function getTradeFairness(offeredValue, requestedValue) {
  const diff = Math.abs(offeredValue - requestedValue);
  const max = Math.max(offeredValue, requestedValue);
  if (max === 0) return { label: 'No Value', color: 'muted', percent: 0 };
  const percent = (diff / max) * 100;
  if (percent <= 10) return { label: 'Fair Trade', color: 'gain', percent };
  if (percent <= 25) return { label: 'Slightly Unbalanced', color: 'gold', percent };
  return { label: 'Unbalanced', color: 'loss', percent };
}

export function getInitials(name) {
  if (!name) return 'C';
  return name.charAt(0).toUpperCase();
}