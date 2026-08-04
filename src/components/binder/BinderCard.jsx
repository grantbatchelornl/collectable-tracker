import { motion } from 'framer-motion';
import { Star, Clock } from 'lucide-react';
import { getCategoryColor } from '@/lib/masterBinderIndex';

const DIFFICULTY_BADGES = {
  easy: 'bg-gain/10 text-gain',
  moderate: 'bg-blue-500/10 text-blue-500',
  hard: 'bg-gold/10 text-gold',
  very_hard: 'bg-orange-500/10 text-orange-500',
  grail: 'bg-loss/10 text-loss',
};

export default function BinderCard({ entry, isFavorite, recentlyViewed, ownership, onToggleFavorite, onOpen }) {
  const colors = entry.colors || getCategoryColor(entry.category);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.96 }}
      onClick={onOpen}
      className="text-left w-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.from} ${colors.to} opacity-60 pointer-events-none`} />

        <div className="relative aspect-[5/3] flex items-center justify-center">
          <span className="text-5xl drop-shadow-lg">{entry.icon}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-gold fill-gold' : 'text-white/70'}`} />
          </button>
          {recentlyViewed && (
            <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/20 backdrop-blur-md text-white/80 rounded-full px-1.5 py-0.5 text-[9px] font-medium">
              <Clock className="w-2.5 h-2.5" /> Recent
            </div>
          )}
          {entry.year && (
            <div className="absolute bottom-2 right-2 bg-black/20 backdrop-blur-md text-white/80 rounded-full px-2 py-0.5 text-[9px] font-bold">
              {entry.year}
            </div>
          )}
        </div>

        <div className="relative p-2.5 space-y-1">
          <p className="text-xs font-semibold truncate leading-tight">{entry.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-muted-foreground">{entry.estimatedCollectibles} items</span>
            <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${DIFFICULTY_BADGES[entry.difficulty] || DIFFICULTY_BADGES.moderate}`}>
              {entry.difficulty.replace('_', ' ')}
            </span>
          </div>
          {ownership && ownership.percent > 0 && (
            <div className="pt-0.5">
              <div className="flex items-center justify-between text-[9px] mb-0.5">
                <span className="text-gain font-medium">You own {ownership.percent}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gain rounded-full" style={{ width: `${ownership.percent}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}