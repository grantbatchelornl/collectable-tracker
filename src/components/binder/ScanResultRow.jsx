import { Check, Copy, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function ScanResultRow({ card, isBatchDup, isExistingDup, onToggle, onUpdate }) {
  return (
    <div
      className={`rounded-2xl border p-3 transition-colors ${
        card.confirmed ? 'bg-card border-primary' : 'bg-card border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(card.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
            card.confirmed ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          {card.confirmed && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground flex-shrink-0">#{card.position}</span>
            <input
              value={card.item_name || ''}
              onChange={(e) => onUpdate(card.id, 'item_name', e.target.value)}
              className="text-sm font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
            />
            {isBatchDup && (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-gold/10 text-gold rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                <Copy className="w-2.5 h-2.5" /> Dup
              </span>
            )}
            {isExistingDup && (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                <Layers className="w-2.5 h-2.5" /> In Collection
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                card.identification_confidence === 'high'
                  ? 'bg-gain/10 text-gain'
                  : card.identification_confidence === 'medium'
                  ? 'bg-gold/10 text-gold'
                  : 'bg-loss/10 text-loss'
              }`}
            >
              ID: {card.identification_confidence || 'low'}
            </span>
            {card.estimated_value > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                {formatCurrency(card.estimated_value)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              value={card.set_name || ''}
              onChange={(e) => onUpdate(card.id, 'set_name', e.target.value)}
              placeholder="Set"
              className="text-[11px] h-8 rounded-md border border-input bg-transparent px-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={card.card_number || ''}
              onChange={(e) => onUpdate(card.id, 'card_number', e.target.value)}
              placeholder="Card #"
              className="text-[11px] h-8 rounded-md border border-input bg-transparent px-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              value={card.year || ''}
              onChange={(e) => onUpdate(card.id, 'year', e.target.value)}
              placeholder="Year"
              className="text-[11px] h-8 rounded-md border border-input bg-transparent px-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Qty</span>
              <input
                type="number"
                min="1"
                value={card.quantity || 1}
                onChange={(e) =>
                  onUpdate(card.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                }
                className="text-[11px] w-12 h-8 rounded-md border border-input bg-transparent px-2 outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          {card.identification_notes && (
            <p className="text-[10px] text-muted-foreground italic">{card.identification_notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}