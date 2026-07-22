import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import { serializeTradeItems } from '@/lib/social';
import { formatCurrency } from '@/lib/format';
import { X, Loader2, ArrowRight, Check, Package } from 'lucide-react';

export default function TradeOfferModal({ targetUserId, targetName, onClose, onSubmitted }) {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [theirItems, setTheirItems] = useState([]);
  const [selectedMine, setSelectedMine] = useState(new Set());
  const [selectedTheirs, setSelectedTheirs] = useState(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [targetUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mine, theirs] = await Promise.all([
        base44.entities.Collectible.list('-created_date', 100),
        base44.entities.Collectible.filter({ created_by_id: targetUserId, privacy_status: 'public' }, '-created_date', 100),
      ]);
      setMyItems(mine);
      setTheirItems(theirs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (set, id, setter) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const offeredItems = myItems.filter((i) => selectedMine.has(i.id));
  const requestedItems = theirItems.filter((i) => selectedTheirs.has(i.id));
  const offeredValue = offeredItems.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const requestedValue = requestedItems.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const canSubmit = offeredItems.length > 0 && requestedItems.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await base44.entities.Trade.create({
        proposer_id: user.id,
        recipient_id: targetUserId,
        proposer_name: user.display_name || user.full_name || '',
        recipient_name: targetName || '',
        proposer_photo: user.profile_photo || '',
        status: 'pending',
        message: message.trim(),
        offered_items_json: serializeTradeItems(offeredItems),
        requested_items_json: serializeTradeItems(requestedItems),
        offered_value: offeredValue,
        requested_value: requestedValue,
      });
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between h-16 px-4 border-b border-border flex-shrink-0">
        <h2 className="font-display text-lg font-bold">Propose Trade</h2>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent">
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <ItemPicker
            title="Your Items to Offer"
            items={myItems}
            selected={selectedMine}
            onToggle={(id) => toggle(selectedMine, id, setSelectedMine)}
            emptyText="You have no collectibles to offer"
          />
          <ItemPicker
            title={`${targetName}'s Items to Request`}
            items={theirItems}
            selected={selectedTheirs}
            onToggle={(id) => toggle(selectedTheirs, id, setSelectedTheirs)}
            emptyText="No public items available from this collector"
          />
          <div className="space-y-2">
            <label className="text-sm font-medium">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note to your trade offer..."
              className="w-full h-20 rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {(offeredValue > 0 || requestedValue > 0) && (
            <div className="flex items-center justify-center gap-3 py-2 text-sm">
              <span className="font-semibold">{formatCurrency(offeredValue)}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{formatCurrency(requestedValue)}</span>
            </div>
          )}
        </div>
      )}

      <div className="p-4 border-t border-border safe-bottom flex-shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            (<><Check className="w-5 h-5" /> Send Trade Offer</>)
          )}
        </button>
        {!canSubmit && !loading && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Select at least one item from each side
          </p>
        )}
      </div>
    </div>
  );
}

function ItemPicker({ title, items, selected, onToggle, emptyText }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs text-center">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                }`}
              >
                <div className="aspect-square">
                  {item.primary_photo_url ? (
                    <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="p-1.5">
                  <p className="text-[10px] truncate font-medium">{item.item_name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(item.estimated_value || 0)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}