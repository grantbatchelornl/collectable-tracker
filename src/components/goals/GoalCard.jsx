import { useState, useEffect } from 'react';
import { calculateGoalProgress, getGoalRecommendation } from '@/lib/goals';
import { formatCurrency } from '@/lib/format';
import { Target, Loader2, Sparkles, Check, X, TrendingUp } from 'lucide-react';

export default function GoalCard({ goal, onUpdate }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [recLoading, setRecLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    loadProgress();
  }, [goal.id]);

  const loadProgress = async () => {
    try {
      const p = await calculateGoalProgress(goal);
      setProgress(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendation = async () => {
    setExpanded(true);
    setRecLoading(true);
    try {
      const rec = await getGoalRecommendation(goal, progress?.ownedItems || []);
      setRecommendation(rec);
      if (rec.estimated_total_cost) {
        await onUpdate(goal.id, { estimated_cost_to_finish: rec.estimated_total_cost });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isComplete = progress && progress.progress >= 100;

  return (
    <div className={`rounded-2xl bg-card border p-4 space-y-3 ${isComplete ? 'border-gain/30 bg-gain/5' : 'border-border'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Target className={`w-4 h-4 flex-shrink-0 ${isComplete ? 'text-gain' : 'text-primary'}`} />
          <p className="text-sm font-semibold truncate">{goal.title}</p>
        </div>
        {isComplete && <Check className="w-4 h-4 text-gain flex-shrink-0" />}
      </div>

      {progress && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {progress.currentCount} / {progress.targetCount} items
              </span>
              <span className="text-xs font-bold">{progress.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-gain' : 'bg-primary'}`}
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current value: {formatCurrency(progress.totalValue)}</span>
            {goal.estimated_cost_to_finish > 0 && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> ~{formatCurrency(goal.estimated_cost_to_finish)} to finish
              </span>
            )}
          </div>

          {!isComplete && !expanded && (
            <button
              onClick={handleGetRecommendation}
              className="w-full h-8 rounded-lg bg-accent text-accent-foreground text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Get AI Recommendations
            </button>
          )}

          {expanded && recLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {expanded && recommendation && (
            <div className="space-y-3 pt-2 border-t border-border">
              {recommendation.estimated_total_cost > 0 && (
                <div className="rounded-lg bg-accent/50 p-2">
                  <p className="text-xs font-medium">Est. cost to finish: {formatCurrency(recommendation.estimated_total_cost)}</p>
                </div>
              )}
              {recommendation.strategy && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Strategy</p>
                  <p className="text-xs text-muted-foreground">{recommendation.strategy}</p>
                </div>
              )}
              {recommendation.missing_items && recommendation.missing_items.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Missing Items</p>
                  <div className="space-y-1">
                    {recommendation.missing_items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground flex-shrink-0 ml-2">{formatCurrency(item.estimated_value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isComplete && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onUpdate(goal.id, { status: 'completed' })}
                className="flex-1 h-8 rounded-lg border border-gain/30 text-gain text-xs font-medium flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" /> Complete
              </button>
              <button
                onClick={() => onUpdate(goal.id, { status: 'abandoned' })}
                className="flex-1 h-8 rounded-lg border border-border text-muted-foreground text-xs font-medium flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> Abandon
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}