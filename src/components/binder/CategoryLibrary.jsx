import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Clock, Star, DollarSign, TrendingUp, BookOpen, Loader2, Calendar } from 'lucide-react';
import {
  getCategorySets, getCategoryColor, estimateOwnership,
} from '@/lib/masterBinderIndex';
import { fetchCategorySetsDynamic } from '@/lib/binderSetGenerator';
import SetLibraryCard from './SetLibraryCard';

const SECTIONS = [
  { key: 'featured',        label: 'Featured',         icon: Star,       color: 'text-gold' },
  { key: 'trending',        label: 'Trending',          icon: Flame,      color: 'text-orange-500' },
  { key: 'newest',          label: 'Newest Releases',   icon: Clock,     color: 'text-blue-500' },
  { key: 'all_chronological', label: 'All Sets (Chronological)', icon: Calendar, color: 'text-primary' },
  { key: 'most_collected',  label: 'Most Collected',    icon: BookOpen,   color: 'text-primary' },
  { key: 'most_valuable',   label: 'Most Valuable',     icon: DollarSign, color: 'text-gain' },
];

export default function CategoryLibrary({ categoryKey, category, collectibles, favorites, onBack, onOpenSet, onToggleFav }) {
  const colors = getCategoryColor(categoryKey);
  const [dynamicSets, setDynamicSets] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDynamicSets(null);
    setFetching(true);
    fetchCategorySetsDynamic(categoryKey)
      .then((sets) => {
        if (!cancelled) setDynamicSets(sets);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => { cancelled = true; };
  }, [categoryKey]);

  // Use dynamic (merged) sets if available, otherwise static
  const allSets = dynamicSets || getCategorySets(categoryKey, 'az');

  // Sort chronologically (oldest to newest)
  const chronological = [...allSets].sort((a, b) => {
    const dateA = a.releaseDate || `${a.year || '9999'}-01-01`;
    const dateB = b.releaseDate || `${b.year || '9999'}-01-01`;
    return dateA.localeCompare(dateB);
  });

  const sectionsData = SECTIONS.map(s => {
    let sets;
    switch (s.key) {
      case 'featured':
        sets = allSets.filter(x => x.featured).sort((a, b) => b.popularity - a.popularity);
        break;
      case 'trending':
        sets = allSets.filter(x => x.trending || x.popularity >= 80).sort((a, b) => b.popularity - a.popularity);
        break;
      case 'newest':
        sets = [...chronological].reverse().slice(0, 12);
        break;
      case 'all_chronological':
        sets = chronological;
        break;
      case 'most_collected':
        sets = [...allSets].sort((a, b) => b.popularity - a.popularity);
        break;
      case 'most_valuable':
        sets = [...allSets].sort((a, b) => b.estimatedValue - a.estimatedValue);
        break;
      default:
        sets = allSets;
    }
    return { ...s, sets };
  }).filter(s => s.sets && s.sets.length > 0);

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
            <p className="text-white/70 text-xs flex items-center gap-1">
              {fetching ? (
                <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Fetching latest sets...</>
              ) : (
                <>{allSets.length} sets · sorted by release date</>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      {sectionsData.map((section) => {
        const Icon = section.icon;
        const isHorizontal = ['featured', 'trending', 'newest'].includes(section.key);

        return (
          <section key={section.key} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${section.color}`} />
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <span className="text-[10px] text-muted-foreground ml-auto">{section.sets.length}</span>
            </div>
            {isHorizontal ? (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
                {section.sets.slice(0, 12).map((entry) => (
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