import { motion } from 'framer-motion';
import { Calendar, Loader2, Star, Heart, Check, X, Clock, TrendingUp, Users, Trophy, AlertCircle } from 'lucide-react';
import { getCategoryColor, DIFFICULTY_TIERS, formatSetValue, daysUntil } from '@/lib/masterBinderIndex';

export default function SetDetailModal({ entry, isFavorite, ownership, isCreating, existingBinder, onClose, onCreate, onToggleFavorite, onAddToWishlist }) {
  const colors = entry.colors || getCategoryColor(entry.category);
  const tier = DIFFICULTY_TIERS[entry.difficulty] || DIFFICULTY_TIERS.moderate;
  const avgCardValue = Math.round((entry.estimatedValue || 0) / (entry.estimatedCollectibles || 1));
  const owned = ownership?.count || 0;
  const missing = Math.max(0, entry.estimatedCollectibles - owned);
  const isComingSoon = entry.comingSoon;
  const isHidden = entry.hidden;
  const daysLeft = entry.releaseDate ? daysUntil(entry.releaseDate) : null;

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
        {/* Banner */}
        <div className={`relative aspect-[16/9] overflow-hidden rounded-t-3xl bg-gradient-to-br ${colors.gradient}`}>
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {entry.logo ? (
              <motion.img
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                src={entry.logo}
                alt={entry.name}
                className="max-h-full max-w-full object-contain drop-shadow-2xl"
              />
            ) : (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                className="text-7xl drop-shadow-2xl"
              >
                {entry.icon}
              </motion.span>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className="bg-black/30 backdrop-blur-md text-white/90 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
              {entry.categoryLabel}
            </div>
            {entry.trending && (
              <div className="flex items-center gap-0.5 bg-black/30 backdrop-blur-md text-white/90 rounded-full px-2 py-1 text-[10px] font-bold">
                <TrendingUp className="w-2.5 h-2.5" /> Trending
              </div>
            )}
            {isHidden && (
              <div className="flex items-center gap-0.5 bg-purple-900/50 backdrop-blur-md text-white rounded-full px-2 py-1 text-[10px] font-bold">
                {entry.type}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold">{entry.name}</h2>
            <p className="text-sm text-muted-foreground">
              {entry.franchise}
              {entry.releaseDate
                ? ` · ${new Date(entry.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : entry.year ? ` · ${entry.year}` : ''}
            </p>
          </div>

          {/* Coming Soon Countdown */}
          {isComingSoon && daysLeft != null && daysLeft > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-primary">Coming in {daysLeft} days</p>
                <p className="text-[10px] text-muted-foreground">Releases {new Date(entry.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>
          )}

          {/* Core Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="Total Cards" value={entry.estimatedCollectibles} />
            <StatBox label="Est. Set Value" value={formatSetValue(entry.estimatedValue)} />
            <StatBox label="Avg Card Value" value={`$${avgCardValue}`} />
            <StatBox label="Difficulty" value={<span className="flex items-center gap-1"><span>{tier.icon}</span><span className={tier.color}>{tier.label}</span></span>} />
          </div>

          {/* Ownership Progress */}
          {ownership && ownership.count > 0 && (
            <div className="rounded-xl border border-gain/30 bg-gain/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gain">Your Collection</p>
                <p className="text-xs font-bold text-gain">{ownership.percent}%</p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ownership.percent}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="h-full bg-gain rounded-full"
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="text-gain font-medium">✓ {owned} owned</span>
                <span>{missing} missing</span>
              </div>
            </div>
          )}

          {/* Set Statistics */}
          <div className="rounded-xl bg-accent p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Set Statistics</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
              <StatRow icon={Trophy} label="Popularity" value={`${entry.popularity}/100`} />
              <StatRow icon={Users} label="Global Completion" value="—" />
              <StatRow icon={AlertCircle} label="Cheapest Missing" value={`~$${avgCardValue}`} />
              <StatRow icon={TrendingUp} label="Top Gainer" value="—" />
            </div>
          </div>

          {/* Action Buttons */}
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
              disabled={isComingSoon && !entry.releaseDate}
              className="h-10 rounded-xl border border-border flex items-center justify-center gap-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              <Heart className="w-3.5 h-3.5" />
              Wishlist
            </button>
          </div>

          {/* Create Binder / Pre-create */}
          <button
            onClick={onCreate}
            disabled={isCreating || (isComingSoon && daysLeft != null && daysLeft > 0)}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-soft hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Checklist...
              </>
            ) : isComingSoon && daysLeft != null && daysLeft > 0 ? (
              <>
                <Calendar className="w-4 h-4" />
                Pre-Create Wishlist Binder
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {existingBinder ? 'Open Binder' : 'Create Binder'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl bg-accent p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
    </div>
  );
}

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}