import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { getComingSoonSets, daysUntil, getCategoryColor } from '@/lib/masterBinderIndex';

export default function ComingSoonStrip({ onOpenSet }) {
  const sets = useMemo(() => getComingSoonSets().filter(s => {
    const d = daysUntil(s.releaseDate);
    return d > 0;
  }), []);

  if (sets.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-sm font-semibold">Coming Soon</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {sets.map((entry, i) => {
          const colors = entry.colors || getCategoryColor(entry.category);
          const days = daysUntil(entry.releaseDate);
          return (
            <motion.button
              key={entry.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenSet?.(entry)}
              className="w-44 flex-shrink-0 text-left"
            >
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.gradient} p-3 h-20 flex flex-col justify-between`}>
                <div className="absolute top-2 right-2 text-2xl opacity-40">{entry.icon}</div>
                <p className="text-white font-semibold text-xs drop-shadow truncate relative z-10">{entry.name}</p>
                <div className="relative z-10">
                  <p className="text-white/80 text-[9px]">Releases {new Date(entry.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <div className="inline-flex items-center gap-0.5 bg-black/30 backdrop-blur-sm text-white rounded-full px-2 py-0.5 text-[9px] font-bold mt-1">
                    <Clock className="w-2.5 h-2.5" /> {days} days
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}