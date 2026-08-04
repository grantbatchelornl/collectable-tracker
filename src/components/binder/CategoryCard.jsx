import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function CategoryCard({ category, count, onClick, index = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl text-left w-full"
    >
      <div className={`relative h-24 bg-gradient-to-br ${category.colors.gradient} flex items-center justify-between px-4`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
        <div className="relative z-10">
          <span className="text-3xl drop-shadow-lg block">{category.icon}</span>
        </div>
        <div className="relative z-10 text-right">
          <p className="text-white font-display font-bold text-base drop-shadow">{category.label}</p>
          <p className="text-white/70 text-[10px] font-medium">{count} sets</p>
        </div>
      </div>
      <div className="bg-card border border-border rounded-b-2xl px-3 py-1.5 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">Browse all sets</p>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
    </motion.button>
  );
}