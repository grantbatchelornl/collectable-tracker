import { base44 } from '@/api/base44Client';

const EARTH_RADIUS_MILES = 3959;

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export async function toggleConventionMode(userId, active, location, conventionName) {
  const profiles = await base44.entities.CollectorProfile.filter({ user_id: userId });
  if (profiles.length === 0) return null;
  return await base44.entities.CollectorProfile.update(profiles[0].id, {
    convention_mode_active: active,
    convention_lat: active ? location?.lat : null,
    convention_lng: active ? location?.lng : null,
    convention_name: active ? conventionName : null,
  });
}

export async function getNearbyCollectors(userId, maxMiles = 50) {
  const profileRes = await base44.functions.invoke('getPublicProfiles', {});
  const allProfiles = profileRes.data?.profiles || profileRes.profiles || [];
  const profiles = allProfiles.filter((p) => p.convention_mode_active);
  const myProfile = profiles.find((p) => p.user_id === userId);
  if (!myProfile || !myProfile.convention_lat) return [];

  const nearby = profiles.filter(
    (p) => p.user_id !== userId && p.convention_lat && p.convention_lng
  );

  const withDistance = nearby.map((p) => ({
    ...p,
    distance: calculateDistance(
      myProfile.convention_lat,
      myProfile.convention_lng,
      p.convention_lat,
      p.convention_lng
    ),
  }));

  return withDistance
    .filter((p) => p.distance <= maxMiles)
    .sort((a, b) => a.distance - b.distance);
}

export function generateTradeBinderQR(userId) {
  const url = `${window.location.origin}/trade-binder/${userId}`;
  return {
    url,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`,
  };
}