import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { TrendingUp, TrendingDown, Star, Award, Check } from 'lucide-react';
import PrivacyBadge from './PrivacyBadge';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { haptic } from '@/lib/celebrations';

export default function CollectibleCard({ collectible, previousValue, index = 0, completed }) {
  const navigate = useNavigate();
  const change =
    previousValue != null ? (collectible.estimated_value || 0) - previousValue : null;
  const theme = getCategoryTheme(collectible.category_name);
  const isGraded = collectible.grading_company && collectible.grade;
  const glowClass = change > 0 ? 'glow-gain' : change < 0 ? 'glow-loss' : '';

  return (
    <motion.button
      onClick={() => {
        haptic(8);
        navigate(`/collectible/${collectible.id}`);
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4), ease: 'easeOut' }}
      whileTap={{ scale: 0.96 }}
      className="text-left w-full"
    >
      <div className={`relative overflow-hidden rounded-2xl border border-border/60 shadow-soft bg-card ${glowClass}`}>
        <div className={`absolute inset-0 ${theme.bgGradient} opacity-[0.05] pointer-events-none`} />

        <div className="relative aspect-square overflow-hidden">
          <Image
            src={collectible.primary_photo_url}
            fittingType="fill"
            className="w-full h-full"
            alt={collectible.item_name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <PrivacyBadge status={collectible.privacy_status} compact />
            {collectible.for_sale && (
              <div className="inline-flex items-center gap-0.5 bg-gold/90 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                For Sale
              </div>
            )}
          </div>

          {collectible.is_favorite && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-gold fill-gold" />
            </div>
          )}

          {isGraded && (
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 bg-black/40 backdrop-blur-md text-white rounded-lg px-2 py-1 text-[10px] font-bold">
              <Award className="w-3 h-3" />
              {collectible.grading_company} {collectible.grade}
            </div>
          )}

          {collectible.category_name && (
            <div className={`absolute bottom-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm ${theme.badgeClass}`}>
              {collectible.category_name}
            </div>
          )}
        </div>

        <div className="relative p-3 space-y-0.5">
          <p className="font-semibold text-sm truncate">{collectible.item_name}</p>
          <div className="flex items-center justify-between pt-1">
            <p className="font-display font-bold text-base">{formatCurrency(collectible.estimated_value)}</p>
            {change != null && change !== 0 && (
              <motion.span
                key={change}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`text-xs font-semibold flex items-center gap-0.5 ${change > 0 ? 'text-gain' : 'text-loss'}`}
              >
                {change > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change > 0 ? '+' : '-'}
                {formatCurrency(Math.abs(change))}
              </motion.span>
            )}
          </div>
          {completed ? (
            <div className="flex items-center gap-1 text-gain pt-0.5">
              <Check className="w-3 h-3" />
              <span className="text-[10px] font-medium">In Completed Set</span>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Updated {formatRelativeDate(collectible.updated_date)}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}