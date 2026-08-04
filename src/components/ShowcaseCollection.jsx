import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/format';
import { Star, ChevronUp, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ShowcaseCollection({ userId, isOwnProfile, editable = false }) {
  const navigate = useNavigate();
  const [showcase, setShowcase] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadShowcase();
  }, [userId]);

  const loadShowcase = async () => {
    setLoading(true);
    try {
      const items = await base44.entities.Collectible.filter(
        { created_by_id: userId, is_deleted: false },
        '-showcase_order',
        12
      );
      setShowcase(items.filter((c) => c.showcase_order > 0).sort((a, b) => a.showcase_order - b.showcase_order));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const moveItem = async (id, direction) => {
    const sorted = [...showcase].sort((a, b) => a.showcase_order - b.showcase_order);
    const idx = sorted.findIndex((c) => c.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const item = sorted[idx];
    const swapItem = sorted[swapIdx];
    const tempOrder = item.showcase_order;
    await Promise.all([
      base44.entities.Collectible.update(item.id, { showcase_order: swapItem.showcase_order }),
      base44.entities.Collectible.update(swapItem.id, { showcase_order: tempOrder }),
    ]);
    loadShowcase();
  };

  const removeFromShowcase = async (id) => {
    await base44.entities.Collectible.update(id, { showcase_order: 0 });
    loadShowcase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showcase.length === 0 && !editable) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-gold" />
          <h2 className="font-display text-sm font-bold">Showcase Collection</h2>
        </div>
        {editable && (
          <button
            onClick={() => setEditMode(!editMode)}
            className="text-xs text-primary font-medium"
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {showcase.length === 0 ? (
        <div className="text-center py-6 rounded-xl bg-muted/30 border border-dashed border-border">
          <Star className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {isOwnProfile ? 'Select featured collectibles to showcase on your profile' : 'No showcase items yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {showcase.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => !editMode && navigate(`/collectible/${item.id}`)}
                className="block w-full"
              >
                <div className="aspect-square rounded-xl overflow-hidden border border-border">
                  {item.primary_photo_url ? (
                    <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Star className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] truncate mt-1 font-medium">{item.item_name}</p>
                <p className="text-[10px] text-primary font-bold">{formatCurrency(item.estimated_value)}</p>
              </button>
              {editMode && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveItem(item.id, -1)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(item.id, 1)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromShowcase(item.id)}
                    className="text-[9px] text-white font-medium bg-loss/80 rounded-full px-2 py-0.5"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwnProfile && showcase.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center">
          Go to any collectible and tap the star to add it to your showcase.
        </p>
      )}
    </div>
  );
}