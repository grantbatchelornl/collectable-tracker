import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/format';
import { calculateFairness, calculateCashAdjustment, sendTradeOffer, getAISuggestedTrades } from '@/lib/tradeCenter';
import { X, Loader2, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export default function TradeWindow({ user, match, onClose, onSent }) {
  const navigate = useNavigate();
  const [selectedMine, setSelectedMine] = useState([]);
  const [selectedTheirs, setSelectedTheirs] = useState([]);
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const partnerName = match.partnerName || 'Collector';
  const partnerPhoto = match.partnerPhoto;
  const myItems = match.myItems || [];
  const theirItems = match.theirItems || [];

  const myTotal = selectedMine.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const theirTotal = selectedTheirs.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const fairness = calculateFairness(myTotal, theirTotal);
  const cash = calculateCashAdjustment(myTotal, theirTotal);

  const toggleMine = (item) => {
    setSelectedMine((prev) =>
      prev.find((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]
    );
  };

  const toggleTheirs = (item) => {
    setSelectedTheirs((prev) =>
      prev.find((i) => i.id === item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]
    );
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    try {
      const suggestion = await getAISuggestedTrades(user.id, match);
      setAiSuggestion(suggestion);
      if (suggestion.user_a_items) {
        const matched = suggestion.user_a_items
          .map((si) => myItems.find((i) => i.item_name === si.name))
          .filter(Boolean);
        setSelectedMine(matched);
      }
      if (suggestion.user_b_items) {
        const matched = suggestion.user_b_items
          .map((si) => theirItems.find((i) => i.item_name === si.name))
          .filter(Boolean);
        setSelectedTheirs(matched);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (selectedMine.length === 0 && selectedTheirs.length === 0) return;
    setSending(true);
    try {
      await sendTradeOffer(user, match.partnerId, partnerName, selectedMine, selectedTheirs);
      onSent();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const fairnessColor = fairness >= 90 ? 'text-gain' : fairness >= 70 ? 'text-gold' : 'text-loss';

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent">
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold flex-1">Trade Window</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <span className="text-xs font-bold text-primary">You</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{formatCurrency(myTotal)}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          <div className="text-center">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-muted mx-auto mb-1">
              {partnerPhoto ? (
                <Image src={partnerPhoto} fittingType="fill" className="w-full h-full" alt={partnerName} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">{formatCurrency(theirTotal)}</p>
          </div>
        </div>

        {selectedMine.length > 0 && selectedTheirs.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Fairness</p>
                <p className={`text-2xl font-display font-bold ${fairnessColor}`}>{fairness}%</p>
              </div>
              {cash.amount > 0 && (
                <div className="border-l border-border pl-3">
                  <p className="text-[10px] text-muted-foreground">Suggested Cash</p>
                  <p className="text-lg font-bold">{formatCurrency(cash.amount)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {cash.direction === 'a_to_b' ? 'You → Them' : 'Them → You'}
                  </p>
                </div>
              )}
            </div>
            {aiSuggestion?.explanation && (
              <p className="text-xs text-muted-foreground italic">{aiSuggestion.explanation}</p>
            )}
          </div>
        )}

        <button
          onClick={handleAISuggest}
          disabled={aiLoading}
          className="w-full h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> AI is matching...</> : <><Sparkles className="w-4 h-4" /> AI Suggest Best Trade</>}
        </button>

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Trade Binder</p>
          {myItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No items in your trade binder. Mark items as Trade from their detail page.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {myItems.map((item) => (
                <TradeItemCard
                  key={item.id}
                  item={item}
                  selected={!!selectedMine.find((i) => i.id === item.id)}
                  onClick={() => toggleMine(item)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{partnerName}'s Trade Binder</p>
          {theirItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No items available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {theirItems.map((item) => (
                <TradeItemCard
                  key={item.id}
                  item={item}
                  selected={!!selectedTheirs.find((i) => i.id === item.id)}
                  onClick={() => toggleTheirs(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-4 safe-bottom">
        <button
          onClick={handleSend}
          disabled={sending || (selectedMine.length === 0 && selectedTheirs.length === 0)}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {sending ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <><Check className="w-5 h-5" /> Send Trade Offer</>}
        </button>
      </div>
    </div>
  );
}

function TradeItemCard({ item, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border-2 overflow-hidden transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {item.primary_photo_url ? (
          <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
        )}
      </div>
      <div className="p-2">
        <p className="text-[10px] font-medium truncate">{item.item_name}</p>
        <p className="text-[10px] text-muted-foreground">{formatCurrency(item.estimated_value)}</p>
      </div>
      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}