/**
 * App Capability Registry — frontend route validation for Collector AI.
 * Mirrors base44/shared/appCapabilities.ts for the browser runtime.
 */

export const VALID_ROUTES = [
  { pattern: '/', label: 'Home' },
  { pattern: '/collection', label: 'Collection' },
  { pattern: '/discover', label: 'Discover' },
  { pattern: '/add', label: 'Scan One Card' },
  { pattern: '/scan', label: 'Scan' },
  { pattern: '/binder-scan', label: 'Binder Page Scanner' },
  { pattern: '/bulk-scan', label: 'Bulk Scanner' },
  { pattern: '/collector-ai', label: 'Collector AI' },
  { pattern: '/leaderboards', label: 'Leaderboards' },
  { pattern: '/community', label: 'Community Rankings' },
  { pattern: '/league/:id', label: 'League Detail' },
  { pattern: '/goals', label: 'Collection Goals' },
  { pattern: '/timeline', label: 'Collection Timeline' },
  { pattern: '/conventions', label: 'Convention Mode' },
  { pattern: '/binders', label: 'My Binders' },
  { pattern: '/binder/:id', label: 'Binder Detail' },
  { pattern: '/binder-leaderboards', label: 'Binder Leaderboards' },
  { pattern: '/review-queue', label: 'AI Review Queue' },
  { pattern: '/time-machine', label: 'Time Machine' },
  { pattern: '/hall-of-fame', label: 'Hall of Fame' },
  { pattern: '/room-scanner', label: 'Room Scanner' },
  { pattern: '/founding-collectors', label: 'Founding Collectors' },
  { pattern: '/settings', label: 'Settings' },
  { pattern: '/collectible/:id', label: 'Collectible Detail' },
  { pattern: '/collectible/:id/edit', label: 'Edit Collectible' },
  { pattern: '/messages', label: 'Messages' },
  { pattern: '/chat/:userId', label: 'Chat' },
  { pattern: '/collector/:userId', label: 'Collector Profile' },
  { pattern: '/trade-binder/:userId', label: 'Trade Binder' },
  { pattern: '/watchlist', label: 'Wishlist' },
  { pattern: '/data-quality', label: 'Data Quality' },
  { pattern: '/profile', label: 'Profile' },
  { pattern: '/admin', label: 'Admin Dashboard' },
];

/**
 * Validates a route against the registry. Returns true if the route
 * matches a known pattern (with :param segments matching any value).
 */
export function isValidRoute(route) {
  if (!route || typeof route !== 'string') return false;
  if (route.startsWith('http') || route.includes('//')) return false;
  const routeParts = route.split('?')[0].split('/').filter(Boolean);
  return VALID_ROUTES.some((r) => {
    const rParts = r.pattern.split('/').filter(Boolean);
    if (rParts.length !== routeParts.length) return false;
    return rParts.every((p, i) => p.startsWith(':') || p === routeParts[i]);
  });
}