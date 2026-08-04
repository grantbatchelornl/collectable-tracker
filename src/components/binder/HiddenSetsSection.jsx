import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { getHiddenSets, getCategoryColor, DIFFICULTY_TIERS } from '@/lib/masterBinderIndex';

export default function HiddenSetsSection({ onOpenSet }) {
  const sets = useMemo(() => getHiddenSets(), []);

  if (sets.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5 text-purple-500" />
        <h3 className="text-sm font-semibold">Hidden Collections</h3>
        <Sparkles className="w-3 h-3 text-purple-400" />
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">Holiday promos, convention exclusives, error sets & secret collections</p>
      <div className="grid grid-cols-2 gap-2">
        {sets.map((entry, i) => {
          const colors = entry.colors || getCategoryColor(entry.category);
          const tier = DIFFICULTY_TIERS[entry.difficulty] || DIFFICULTY_TIERS.moderate;
          return (
            <motion.button
              key={entry.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenSet?.(entry)}
              className="text-left relative overflow-hidden rounded-2xl border border-purple-500/20 bg-card"
            >
              <div className={`relative h-16 bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                <span className="text-2xl drop-shadow opacity-80">{entry.icon}</span>
                <div className="absolute top-1.5 right-1.5">
                  <Lock className="w-3 h-3 text-white/60" />
                </div>
              </div>
              <div className="p-2 space-y-0.5">
                <p className="text-[10px] font-semibold truncate">{entry.name}</p>
                <p className="text-[8px] text-purple-500 font-medium">{entry.type}</p>
                <div className="flex items-center gap-0.5">
                  <span className="text-[7px]">{tier.icon}</span>
                  <span className={`text-[7px] ${tier.color}`}>{tier.label}</span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}