import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Sparkles, Clock, Star, DollarSign, TrendingUp, BookOpen } from 'lucide-react';
import {
  getCategorySets, getCategoryColor, estimateOwnership,
} from '@/lib/masterBinderIndex';
import SetLibraryCard from './SetLibraryCard';

const SECTIONS = [
  { key: 'featured',        label: 'Featured',         icon: Star,       color: 'text-gold' },
  { key: 'trending',        label: 'Trending',          icon: Flame,      color: 'text-orange-500' },
  { key: 'newest',          label: 'Newest Releases',    icon: Clock,      color: 'text-blue-500' },
  { key: 'most_collected',  label: 'Most Collected',     icon: BookOpen,   color: 'text-primary' },
  { key: 'most_valuable',   label: 'Most Valuable',      icon: DollarSign, color: 'text-gain' },
  { key: 'fastest_growing', label: 'Fastest Growing',    icon: TrendingUp, color: 'text-purple-500' },
  { key: 'az',              label: 'Every Set A–Z',      icon: BookOpen,   color: 'text-muted-foreground' },
];

export default function CategoryLibrary({ categoryKey, category, collectibles, favorites, onBack, onOpenSet, onToggleFav }) {
  const colors = getCategoryColor(categoryKey);
  const sectionsData = SECTIONS.map(s => ({
    ...s,
    sets: getCategorySets(categoryKey, s.key),
  })).filter(s => s.sets && s.sets.length > 0);

  return (
    <div className="space-y-5">
      {/* Category Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.gradient} h-28 flex items-center px-4`}
      >
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <button onClick={onBack} className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-5xl drop-shadow-lg">{category.icon}</span>
          <div>
            <h2 className="font-display text-xl font-bold text-white drop-shadow">{category.label} Library</h2>
            <p className="text-white/70 text-xs">{category.sets.length} sets available</p>
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      {sectionsData.map((section) => {
        const Icon = section.icon;
        const isHorizontal = ['featured', 'trending', 'newest', 'fastest_growing'].includes(section.key);

        return (
          <section key={section.key} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${section.color}`} />
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">{section.sets.length}</span>
            </div>
            {isHorizontal ? (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                {section.sets.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="w-36 flex-shrink-0">
                    <SetLibraryCard
                      entry={entry}
                      isFavorite={favorites.includes(entry.id)}
                      ownership={estimateOwnership(entry, collectibles)}
                      onToggleFavorite={() => onToggleFav(entry.id)}
                      onOpen={() => onOpenSet(entry)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {section.sets.map((entry) => (
                  <SetLibraryCard
                    key={entry.id}
                    entry={entry}
                    isFavorite={favorites.includes(entry.id)}
                    ownership={estimateOwnership(entry, collectibles)}
                    onToggleFavorite={() => onToggleFav(entry.id)}
                    onOpen={() => onOpenSet(entry)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}