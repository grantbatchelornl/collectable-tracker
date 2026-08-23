import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { getCategoryColor, DIFFICULTY_TIERS, formatSetValue } from '@/lib/masterBinderIndex';

export default function SetLibraryCard({ entry, isFavorite, ownership, onToggleFavorite, onOpen, compact }) {
  const colors = entry.colors || getCategoryColor(entry.category);
  const tier = DIFFICULTY_TIERS[entry.difficulty] || DIFFICULTY_TIERS.moderate;
  const avgCardValue = Math.round((entry.estimatedValue || 0) / (entry.estimatedCollectibles || 1));

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
        <div className={`relative aspect-[5/3] overflow-hidden bg-gradient-to-br ${colors.gradient}`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="absolute inset-0 flex items-center justify-center p-3">
            {entry.logo ? (
              <img src={entry.logo} alt={entry.name} className="max-h-full max-w-full object-contain drop-shadow-lg" />
            ) : (
              <span className="text-4xl drop-shadow-lg">{entry.icon}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-gold fill-gold' : 'text-white/70'}`} />
          </button>
          {entry.trending && (
            <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/25 backdrop-blur-md text-white/90 rounded-full px-1.5 py-0.5 text-[8px] font-bold">
              <TrendingUp className="w-2.5 h-2.5" /> TRENDING
            </div>
          )}
          {(entry.releaseDate || entry.year) && (
            <div className="absolute bottom-2 right-2 bg-black/25 backdrop-blur-md text-white/90 rounded-full px-2 py-0.5 text-[9px] font-bold">
              {entry.releaseDate
                ? new Date(entry.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : entry.year}
            </div>
          )}
        </div>

        <div className="p-2.5 space-y-1.5">
          <p className="text-xs font-semibold truncate leading-tight">{entry.name}</p>
          {!compact && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] text-muted-foreground">{entry.estimatedCollectibles} cards</span>
              <span className="text-[9px] text-muted-foreground">·</span>
              <span className="text-[9px] font-medium text-foreground">{formatSetValue(entry.estimatedValue)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-[8px]">{tier.icon}</span>
            <span className={`text-[8px] font-medium ${tier.color}`}>{tier.label}</span>
          </div>
          {ownership && ownership.percent > 0 && (
            <div className="pt-0.5">
              <div className="flex items-center justify-between text-[9px] mb-0.5">
                <span className="text-gain font-medium">{ownership.percent}% owned</span>
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