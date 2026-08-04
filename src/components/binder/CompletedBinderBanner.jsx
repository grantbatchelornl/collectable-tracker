import { motion } from 'framer-motion';
import { Trophy, Calendar, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompletedBinderBanner({ binder, completionDate, onViewHallOfFame, onShare }) {
  if (!completionDate) return null;

  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold/10 via-amber-500/5 to-primary/5 border border-gold/30 p-4"
    >
      <div className="absolute inset-0 holo-shimmer opacity-50 pointer-events-none" />

      <div className="relative flex items-start gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, delay: 0.1 }}
          className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0"
        >
          <Trophy className="w-7 h-7 text-gold" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-display text-sm font-bold text-gold">Binder Complete!</h3>
            <span className="text-[8px] bg-gold/20 text-gold rounded-full px-1.5 py-0.5 font-bold">
              100%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3" />
            Completed on {formattedDate}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            This binder is permanently archived. All features remain fully interactive.
          </p>

          <div className="flex gap-1.5 mt-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewHallOfFame}
              className="h-7 text-[11px] px-2.5"
            >
              <BookOpen className="w-3 h-3" /> Hall of Fame
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onShare}
              className="h-7 text-[11px] px-2.5"
            >
              <Share2 className="w-3 h-3" /> Share
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}