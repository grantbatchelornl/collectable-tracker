import { useState } from 'react';
import { getActionRecommendation } from '@/lib/actionRecommendation';
import { Loader2, Sparkles, TrendingUp, TrendingDown, RefreshCw, ArrowLeftRight, DollarSign } from 'lucide-react';

const REC_CONFIG = {
  buy: { label: 'Buy More', icon: DollarSign, color: 'text-gain', bg: 'bg-gain/10' },
  hold: { label: 'Hold', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  trade: { label: 'Trade', icon: ArrowLeftRight, color: 'text-gold', bg: 'bg-gold/10' },
  sell: { label: 'Sell', icon: TrendingDown, color: 'text-loss', bg: 'bg-loss/10' },
};

export default function ActionRecommendationCard({ collectible, collection, pricingHistory }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await getActionRecommendation(collectible, collection, pricingHistory);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!result && !loading) {
    return (
      <button
        onClick={handleAnalyze}
        className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">AI Recommendation</p>
          <p className="text-xs text-muted-foreground">Should you buy, hold, trade, or sell?</p>
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing your portfolio...</p>
      </div>
    );
  }

  const config = REC_CONFIG[result.recommendation] || REC_CONFIG.hold;
  const Icon = config.icon;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" /> AI Recommendation
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3" /> {config.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Confidence:</span>
        <span className={`text-xs font-semibold capitalize ${
          result.confidence === 'high' ? 'text-gain' : result.confidence === 'medium' ? 'text-gold' : 'text-loss'
        }`}>
          {result.confidence}
        </span>
      </div>

      {result.key_factors && result.key_factors.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Key Factors</p>
          {result.key_factors.map((factor, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span> {factor}
            </p>
          ))}
        </div>
      )}

      {result.explanation && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">{result.explanation}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] text-muted-foreground italic">
          Not financial advice. Past performance does not guarantee future results.
        </p>
        <button onClick={handleAnalyze} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}