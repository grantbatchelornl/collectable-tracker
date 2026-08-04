import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Sparkles, ArrowRight } from 'lucide-react';
import { celebrateBig } from '@/lib/celebrations';
import { formatCurrency } from '@/lib/format';

export default function CompletionCelebration({ trigger, binder, completion, snapshot, onClose, onViewHallOfFame }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      // Fire confetti after a brief delay so the modal renders first
      setTimeout(() => celebrateBig(), 300);
      setTimeout(() => celebrateBig(), 1200);
    }
  }, [trigger]);

  const collectionValue = snapshot?.collection_value || 0;
  const completionDate = snapshot?.completion_date || new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 18, stiffness: 250 }}
            className="relative w-full max-w-sm rounded-3xl bg-card border border-gold/30 shadow-float overflow-hidden"
          >
            {/* Trophy header */}
            <div className="relative h-40 bg-gradient-to-br from-gold/20 via-amber-500/10 to-primary/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 holo-shimmer" />
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="relative z-10"
              >
                <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
                  <Trophy className="w-12 h-12 text-gold" />
                </div>
              </motion.div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gold">Binder Complete</span>
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <h2 className="font-display text-xl font-bold">{binder?.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed on {new Date(completionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-muted/50 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Items</p>
                  <p className="text-lg font-bold">{completion?.total || 0}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Graded</p>
                  <p className="text-lg font-bold text-primary">{completion?.graded || 0}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Value</p>
                  <p className="text-lg font-bold text-gain">{formatCurrency(collectionValue)}</p>
                </div>
              </div>

              {/* Achievements earned */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-gold/5 border border-gold/20 p-2.5 text-left">
                  <span className="text-xl">🏆</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gold">Completion Badge Awarded</p>
                    <p className="text-[10px] text-muted-foreground">{binder?.name} — Complete</p>
                  </div>
                  <Check />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 p-2.5 text-left">
                  <span className="text-xl">📚</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary">Added to Hall of Fame</p>
                    <p className="text-[10px] text-muted-foreground">Your binder is permanently archived</p>
                  </div>
                  <Check />
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-purple-500/5 border border-purple-500/20 p-2.5 text-left">
                  <span className="text-xl">📸</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-purple-500">Snapshot Saved</p>
                    <p className="text-[10px] text-muted-foreground">Completion state recorded forever</p>
                  </div>
                  <Check />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 h-10 rounded-xl bg-muted text-sm font-medium"
                >
                  Keep Exploring
                </button>
                <button
                  onClick={onViewHallOfFame}
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1"
                >
                  Hall of Fame <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Check() {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 15, delay: 0.4 }}
      className="w-5 h-5 rounded-full bg-gain flex items-center justify-center flex-shrink-0"
    >
      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </motion.span>
  );
}