import {
  Zap,
  Box,
  CircleDollarSign,
  Layers,
  BookOpen,
  Trophy,
  Star,
  Disc,
  Package,
} from 'lucide-react';

const CATEGORY_ICONS = {
  pokemon: Zap,
  'pokémon': Zap,
  magic: Layers,
  'magic the gathering': Layers,
  funko: Box,
  'funko pop': Box,
  coin: CircleDollarSign,
  coins: CircleDollarSign,
  'sports card': Trophy,
  'sports cards': Trophy,
  lorcana: BookOpen,
  yugioh: Star,
  'yu-gi-oh': Star,
  comic: BookOpen,
  comics: BookOpen,
  figure: Package,
  figures: Package,
  vinyl: Disc,
  'vinyl record': Disc,
  'trading card': Layers,
};

const DEFAULT_ICON = Package;

export function getCategoryIcon(categoryName) {
  if (!categoryName) return DEFAULT_ICON;
  const normalized = categoryName.toLowerCase().trim();
  if (CATEGORY_ICONS[normalized]) return CATEGORY_ICONS[normalized];
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalized.includes(key)) return Icon;
  }
  return DEFAULT_ICON;
}