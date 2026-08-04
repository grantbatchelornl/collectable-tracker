export const BINDER_CATEGORIES = [
  {
    key: 'pokemon',
    label: 'Pokémon',
    icon: '⚡',
    color: 'bg-yellow-500/10 border-yellow-500/30',
    sets: ['Base Set', 'Jungle', 'Fossil', 'Scarlet & Violet', 'Prismatic Evolutions', 'Crown Zenith', 'Chaos Rising'],
  },
  {
    key: 'magic',
    label: 'Magic',
    icon: '🔮',
    color: 'bg-purple-500/10 border-purple-500/30',
    sets: ['Foundations', 'Modern Horizons', 'Bloomburrow', 'Duskmourn'],
  },
  {
    key: 'lorcana',
    label: 'Lorcana',
    icon: '✨',
    color: 'bg-cyan-500/10 border-cyan-500/30',
    sets: ['The First Chapter', 'Floodborn', "Ursula's Return"],
  },
  {
    key: 'sports',
    label: 'Sports Cards',
    icon: '⚾',
    color: 'bg-orange-500/10 border-orange-500/30',
    sets: ['1989 Upper Deck Baseball', '1986 Fleer Basketball', '2000 Bowman Chrome Football'],
  },
  {
    key: 'funko',
    label: 'Funko',
    icon: '🎭',
    color: 'bg-pink-500/10 border-pink-500/30',
    sets: ['Marvel', 'Disney', 'Harry Potter', 'Anime'],
    supportsSeries: true,
  },
  {
    key: 'coins',
    label: 'Coins',
    icon: '🪙',
    color: 'bg-amber-500/10 border-amber-500/30',
    sets: ['State Quarters', 'Morgan Dollars', 'American Silver Eagles'],
  },
  {
    key: 'memorabilia',
    label: 'Sports Memorabilia',
    icon: '🏆',
    color: 'bg-red-500/10 border-red-500/30',
    sets: ['Super Bowl Programs', 'Signed Baseball Collection'],
  },
];

export function getCategoryConfig(key) {
  return BINDER_CATEGORIES.find((c) => c.key === key) || BINDER_CATEGORIES[0];
}