import { useState } from 'react';
import { analyzeTrade } from '@/lib/tradeAssistant';
import { Brain, Loader2, TrendingUp, AlertTriangle, Clock, ThumbsUp, ThumbsDown, Scale } from 'lucide-react';

const RECOMMENDATION_STYLES = {
  beneficial: {
    icon: ThumbsUp,
    bg: 'bg-gain/5 border-gain/30',
    iconColor: 'text-gain',
    label: 'Good Trade',
  },
  fair: {
    icon: Scale,
    bg: 'bg-primary/5 border-primary/30',
    iconColor: 'text-primary',
    label: 'Fair Trade',
  },
  not_recommended: {
    icon: ThumbsDown,
    bg: 'bg-loss/5 border-loss/30',
    iconColor: 'text-loss',
    label: 'Not Recommended',
  },
};

export default function AITradeAssistant({ myItems, theirItems }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (myItems.length === 0 || theirItems.length === 0) return;
    setLoading(true);
    try {
      const result = await analyzeTrade(myItems, theirItems);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (myItems.length === 0 || theirItems.length === 0) return null;

  const style = analysis ? RECOMMENDATION_STYLES[analysis.recommendation] : null;
  const RecIcon = style?.icon;

  return (
    <div>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full h-10 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-primary text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-40"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> AI is analyzing...</>
        ) : (
          <><Brain className="w-4 h-4" /> Get AI Trade Advice</>
        )}
      </button>

      {analysis && style && RecIcon && (
        <div className={`mt-2 rounded-2xl border p-4 space-y-2.5 ${style.bg}`}>
          <div className="flex items-center gap-2">
            <RecIcon className={`w-5 h-5 ${style.iconColor}`} />
            <p className={`text-sm font-bold ${style.iconColor}`}>{analysis.title || style.label}</p>
          </div>
          {analysis.advice && (
            <p className="text-xs text-foreground leading-relaxed">{analysis.advice}</p>
          )}
          {analysis.timing && (
            <div className="flex items-start gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{analysis.timing}</span>
            </div>
          )}
          {analysis.concerns && (
            <div className="flex items-start gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{analysis.concerns}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}