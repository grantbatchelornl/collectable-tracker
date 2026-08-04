const CATEGORY_THEMES = {
  pokemon: { bgGradient: 'bg-gradient-to-br from-blue-500 to-purple-600', badgeClass: 'bg-blue-500/80 text-white' },
  'pokémon': { bgGradient: 'bg-gradient-to-br from-blue-500 to-purple-600', badgeClass: 'bg-blue-500/80 text-white' },
  magic: { bgGradient: 'bg-gradient-to-br from-violet-600 to-indigo-800', badgeClass: 'bg-violet-600/80 text-white' },
  'magic the gathering': { bgGradient: 'bg-gradient-to-br from-violet-600 to-indigo-800', badgeClass: 'bg-violet-600/80 text-white' },
  funko: { bgGradient: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', badgeClass: 'bg-purple-500/80 text-white' },
  'funko pop': { bgGradient: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', badgeClass: 'bg-purple-500/80 text-white' },
  coin: { bgGradient: 'bg-gradient-to-br from-amber-400 to-yellow-600', badgeClass: 'bg-amber-500/80 text-white' },
  coins: { bgGradient: 'bg-gradient-to-br from-amber-400 to-yellow-600', badgeClass: 'bg-amber-500/80 text-white' },
  'sports card': { bgGradient: 'bg-gradient-to-br from-blue-800 to-slate-900', badgeClass: 'bg-blue-800/80 text-white' },
  'sports cards': { bgGradient: 'bg-gradient-to-br from-blue-800 to-slate-900', badgeClass: 'bg-blue-800/80 text-white' },
  lorcana: { bgGradient: 'bg-gradient-to-br from-cyan-500 to-blue-700', badgeClass: 'bg-cyan-600/80 text-white' },
  yugioh: { bgGradient: 'bg-gradient-to-br from-amber-600 to-red-700', badgeClass: 'bg-red-700/80 text-white' },
  'yu-gi-oh': { bgGradient: 'bg-gradient-to-br from-amber-600 to-red-700', badgeClass: 'bg-red-700/80 text-white' },
  comic: { bgGradient: 'bg-gradient-to-br from-red-500 to-orange-600', badgeClass: 'bg-red-500/80 text-white' },
  comics: { bgGradient: 'bg-gradient-to-br from-red-500 to-orange-600', badgeClass: 'bg-red-500/80 text-white' },
  figure: { bgGradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', badgeClass: 'bg-emerald-500/80 text-white' },
  figures: { bgGradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', badgeClass: 'bg-emerald-500/80 text-white' },
  vinyl: { bgGradient: 'bg-gradient-to-br from-pink-500 to-rose-600', badgeClass: 'bg-pink-500/80 text-white' },
  'vinyl record': { bgGradient: 'bg-gradient-to-br from-pink-500 to-rose-600', badgeClass: 'bg-pink-500/80 text-white' },
  'trading card': { bgGradient: 'bg-gradient-to-br from-indigo-500 to-blue-600', badgeClass: 'bg-indigo-500/80 text-white' },
};

const DEFAULT_THEME = {
  bgGradient: 'bg-gradient-to-br from-primary to-primary/40',
  badgeClass: 'bg-primary/80 text-primary-foreground',
};

export function getCategoryTheme(categoryName) {
  if (!categoryName) return DEFAULT_THEME;
  const normalized = categoryName.toLowerCase().trim();
  if (CATEGORY_THEMES[normalized]) return CATEGORY_THEMES[normalized];
  for (const [key, theme] of Object.entries(CATEGORY_THEMES)) {
    if (normalized.includes(key)) return theme;
  }
  return DEFAULT_THEME;
}