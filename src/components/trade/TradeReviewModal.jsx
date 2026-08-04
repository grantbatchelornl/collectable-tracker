import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { submitTradeReview, checkExistingReview } from '@/lib/tradeHistory';
import { Star, Loader2, Check } from 'lucide-react';

const CATEGORIES = [
  { key: 'rating_accuracy', label: 'Trade Accuracy' },
  { key: 'rating_communication', label: 'Communication' },
  { key: 'rating_shipping', label: 'Shipping' },
  { key: 'rating_packaging', label: 'Packaging' },
];

export default function TradeReviewModal({ open, onClose, trade, reviewerId, reviewedId, reviewedName }) {
  const [ratings, setRatings] = useState({});
  const [wouldTradeAgain, setWouldTradeAgain] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    if (!trade || !reviewerId) return;
    const exists = await checkExistingReview(trade.id, reviewerId);
    setAlreadyReviewed(exists);
    setChecked(true);
  };

  if (open && !checked) {
    handleCheck();
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitTradeReview({
        trade_id: trade.id,
        reviewer_id: reviewerId,
        reviewer_name: trade.proposer_id === reviewerId ? trade.proposer_name : trade.recipient_name,
        reviewed_id: reviewedId,
        rating_accuracy: ratings.rating_accuracy || 5,
        rating_communication: ratings.rating_communication || 5,
        rating_shipping: ratings.rating_shipping || 5,
        rating_packaging: ratings.rating_packaging || 5,
        would_trade_again: wouldTradeAgain,
        comment: comment || undefined,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {reviewedName}</DialogTitle>
          <DialogDescription>
            How was your trade experience? Your feedback helps build trust in the community.
          </DialogDescription>
        </DialogHeader>

        {alreadyReviewed ? (
          <div className="text-center py-6">
            <Check className="w-10 h-10 text-gain mx-auto mb-2" />
            <p className="text-sm font-medium">You've already reviewed this trade</p>
          </div>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.key}>
                <p className="text-xs font-medium mb-1.5">{cat.label}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings((prev) => ({ ...prev, [cat.key]: star }))}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (ratings[cat.key] || 0)
                            ? 'text-gold fill-gold'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-lg bg-accent p-3">
              <span className="text-sm font-medium">Would trade again?</span>
              <button
                onClick={() => setWouldTradeAgain(!wouldTradeAgain)}
                className={`w-10 h-6 rounded-full transition-colors relative ${wouldTradeAgain ? 'bg-gain' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${wouldTradeAgain ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 min-h-[60px] resize-none"
            />
          </div>
        )}

        {!alreadyReviewed && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}