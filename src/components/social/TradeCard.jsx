import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import { parseTradeItems } from '@/lib/social';
import FairnessIndicator from './FairnessIndicator';
import TradeReviewModal from '@/components/trade/TradeReviewModal';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeftRight, Check, X, Loader2, Star } from 'lucide-react';

const STATUS_STYLES = {
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  accepted: 'bg-gain/10 text-gain',
  rejected: 'bg-loss/10 text-loss',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-primary/10 text-primary',
};

export default function TradeCard({ trade, isIncoming, onAction }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const offeredItems = parseTradeItems(trade.offered_items_json);
  const requestedItems = parseTradeItems(trade.requested_items_json);
  const status = trade.status || 'pending';

  const handleUpdate = async (newStatus) => {
    // Client-side authorization guard — RLS allows both parties to update,
    // but only the recipient should accept/reject/complete, and only the
    // proposer should cancel.
    const isRecipient = trade.recipient_id === user?.id;
    const isProposer = trade.proposer_id === user?.id;
    if ((newStatus === 'accepted' || newStatus === 'rejected') && !isRecipient) return;
    if (newStatus === 'cancelled' && !isProposer) return;
    if (newStatus === 'completed' && !isRecipient) return;

    setLoading(true);
    try {
      await base44.entities.Trade.update(trade.id, { status: newStatus });
      onAction?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-semibold truncate">
            {isIncoming ? `From ${trade.proposer_name}` : `To ${trade.recipient_name}`}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      </div>

      {trade.message && <p className="text-sm text-muted-foreground italic">{trade.message}</p>}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Offered</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {offeredItems.map((item) => (
              <TradeItemThumb key={item.id} item={item} />
            ))}
            {offeredItems.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Requested</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {requestedItems.map((item) => (
              <TradeItemThumb key={item.id} item={item} />
            ))}
            {requestedItems.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {offeredItems.length} offered ↔ {requestedItems.length} requested
          </span>
          <span>{formatRelativeDate(trade.created_date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">
            {formatCurrency(trade.offered_value || 0)} ↔ {formatCurrency(trade.requested_value || 0)}
          </span>
          {trade.offered_value > 0 && trade.requested_value > 0 && (
            <FairnessIndicator offered={trade.offered_value} requested={trade.requested_value} />
          )}
          {trade.cash_adjustment > 0 && (
            <p className="text-[10px] text-muted-foreground">
              + {formatCurrency(trade.cash_adjustment)} cash {trade.cash_direction === 'proposer_to_recipient' ? '→' : '←'}
            </p>
          )}
        </div>
      </div>

      {isIncoming && status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => handleUpdate('rejected')}
            disabled={loading}
            className="flex-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-accent flex items-center justify-center gap-1.5 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><X className="w-4 h-4" /> Decline</>)}
          </button>
          <button
            onClick={() => handleUpdate('accepted')}
            disabled={loading}
            className="flex-1 h-9 rounded-lg bg-gain text-white text-sm font-medium hover:bg-gain/90 flex items-center justify-center gap-1.5 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Check className="w-4 h-4" /> Accept</>)}
          </button>
        </div>
      )}
      {isIncoming && status === 'pending' && (
        <button
          onClick={() => navigate(`/collector/${trade.proposer_id}`)}
          className="w-full h-9 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 flex items-center justify-center gap-1.5 transition-colors mb-2"
        >
          <ArrowLeftRight className="w-4 h-4" /> Counter Offer
        </button>
      )}
      {!isIncoming && status === 'pending' && (
        <button
          onClick={() => handleUpdate('cancelled')}
          disabled={loading}
          className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-accent flex items-center justify-center gap-1.5 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Offer'}
        </button>
      )}
      {isIncoming && status === 'accepted' && (
        <button
          onClick={() => handleUpdate('completed')}
          disabled={loading}
          className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Check className="w-4 h-4" /> Mark Complete</>)}
        </button>
      )}
      {status === 'completed' && (
        <button
          onClick={() => setShowReview(true)}
          className="w-full h-9 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Star className="w-4 h-4" /> Leave Review
        </button>
      )}
      {showReview && (
        <TradeReviewModal
          open={showReview}
          onClose={() => setShowReview(false)}
          trade={trade}
          reviewerId={user?.id}
          reviewedId={isIncoming ? trade.proposer_id : trade.recipient_id}
          reviewedName={isIncoming ? trade.proposer_name : trade.recipient_name}
        />
      )}
    </div>
  );
}

function TradeItemThumb({ item }) {
  return (
    <div className="flex-shrink-0 w-16">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border">
        {item.primary_photo_url ? (
          <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      <p className="text-[10px] truncate mt-1">{item.item_name}</p>
    </div>
  );
}