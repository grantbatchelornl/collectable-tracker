import { motion } from 'framer-motion';
import { Loader2, Star, Heart, Check, X } from 'lucide-react';
import { getCategoryColor } from '@/lib/masterBinderIndex';

const DIFFICULTY_BADGES = {
  easy: 'bg-gain/10 text-gain',
  moderate: 'bg-blue-500/10 text-blue-500',
  hard: 'bg-gold/10 text-gold',
  very_hard: 'bg-orange-500/10 text-orange-500',
  grail: 'bg-loss/10 text-loss',
};

export default function BinderPreviewModal({ entry, isFavorite, ownership, isCreating, onClose, onCreate, onToggleFavorite, onAddToWishlist }) {
  const colors = entry.colors || getCategoryColor(entry.category);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-float"
      >
        <div className={`relative aspect-[16/9] overflow-hidden rounded-t-3xl`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.from} ${colors.to}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl drop-shadow-2xl">{entry.icon}</span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white/90 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
            {entry.categoryLabel}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold">{entry.name}</h2>
            <p className="text-sm text-muted-foreground">{entry.franchise}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-accent p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Year</p>
              <p className="text-sm font-bold">{entry.year || '—'}</p>
            </div>
            <div className="rounded-xl bg-accent p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Items</p>
              <p className="text-sm font-bold">{entry.estimatedCollectibles}</p>
            </div>
            <div className="rounded-xl bg-accent p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Difficulty</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_BADGES[entry.difficulty] || DIFFICULTY_BADGES.moderate}`}>
                {entry.difficulty.replace('_', ' ')}
              </span>
            </div>
          </div>

          {ownership && ownership.count > 0 && (
            <div className="rounded-xl border border-gain/30 bg-gain/5 p-3">
              <p className="text-xs font-medium text-gain mb-1">
                You already own {ownership.count} item{ownership.count !== 1 ? 's' : ''} from this set
              </p>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gain rounded-full transition-all" style={{ width: `${ownership.percent}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{ownership.percent}% of estimated set</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleFavorite}
              className="h-10 rounded-xl border border-border flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-accent"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-gold fill-gold' : ''}`} />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </button>
            <button
              onClick={onAddToWishlist}
              className="h-10 rounded-xl border border-border flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-accent"
            >
              <Heart className="w-3.5 h-3.5" />
              Wishlist
            </button>
          </div>

          <button
            onClick={onCreate}
            disabled={isCreating}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching Master Set Data...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Binder
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}