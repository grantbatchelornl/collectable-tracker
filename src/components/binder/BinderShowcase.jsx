import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Image as UIImage } from '@/components/ui/image';
import { BookOpen, Loader2, Trophy, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { getCategoryConfig } from '@/lib/binderCategories';

export default function BinderShowcase({ userId }) {
  const navigate = useNavigate();
  const [binders, setBinders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShowcase();
  }, [userId]);

  const loadShowcase = async () => {
    try {
      const data = await base44.entities.CollectionBinder.filter(
        { created_by_id: userId, is_showcased: true },
        '-updated_date',
        20
      );
      setBinders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (binders.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-gold" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Binder Showcase</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{binders.length} completed</span>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {binders.map((binder, index) => {
          const catConfig = getCategoryConfig(binder.category);
          const accentColor = binder.color;
          return (
            <motion.button
              key={binder.id}
              onClick={() => navigate(`/binder/${binder.id}`)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.3) }}
              whileTap={{ scale: 0.97 }}
              className="w-44 flex-shrink-0 text-left"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                {binder.cover_photo_url ? (
                  <div className="relative h-24 overflow-hidden">
                    <UIImage src={binder.cover_photo_url} fittingType="fill" className="w-full h-full" alt={binder.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-1.5 right-1.5">
                      <span className="inline-flex items-center gap-0.5 bg-gold/90 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm">
                        <Trophy className="w-2.5 h-2.5" /> 100%
                      </span>
                    </div>
                    <div className="absolute bottom-1.5 left-2">
                      <p className="text-white font-display text-sm font-bold drop-shadow truncate max-w-[150px]">
                        {binder.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative h-24 flex items-center justify-center ${!accentColor ? catConfig.color : ''}`}
                    style={accentColor ? { backgroundColor: `${accentColor}15` } : undefined}
                  >
                    <div className="absolute inset-0 holo-shimmer opacity-30" />
                    <span className="text-4xl relative z-10">{binder.icon || catConfig.icon}</span>
                    <div className="absolute top-1.5 right-1.5">
                      <span className="inline-flex items-center gap-0.5 bg-gold/90 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold backdrop-blur-sm">
                        <Trophy className="w-2.5 h-2.5" /> 100%
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-2.5 space-y-1">
                  {!binder.cover_photo_url && (
                    <p className="font-display text-sm font-bold truncate">{binder.name}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground truncate">
                    {binder.franchise} · {binder.set_name}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {binder.completion_date
                        ? new Date(binder.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : 'Completed'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}