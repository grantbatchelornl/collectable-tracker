import { useState } from 'react';
import { analyzeGradeWorthiness } from '@/lib/gradeWorthiness';
import { formatCurrency } from '@/lib/format';
import { Loader2, Sparkles, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';

export default function GradeWorthinessCard({ collectible, photoUrls }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeGradeWorthiness(collectible, photoUrls);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <button
        onClick={handleAnalyze}
        className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Award className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Grade Worthiness Analysis</p>
          <p className="text-xs text-muted-foreground">Estimate if grading is worth it</p>
        </div>
        <Sparkles className="w-4 h-4 text-muted-foreground ml-auto" />
      </button>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analyzing grade worthiness...</p>
      </div>
    );
  }

  const recStyle = {
    grade: { bg: 'bg-gain/10', text: 'text-gain', icon: TrendingUp },
    do_not_grade: { bg: 'bg-loss/10', text: 'text-loss', icon: TrendingDown },
    marginal: { bg: 'bg-gold/10', text: 'text-gold', icon: Minus },
  };
  const rec = recStyle[analysis.recommendation] || recStyle.marginal;
  const RecIcon = rec.icon;

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Award className="w-4 h-4 text-primary" /> Grade Worthiness
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.bg} ${rec.text} flex items-center gap-1`}>
          <RecIcon className="w-3 h-3" />
          {analysis.recommendation === 'do_not_grade' ? "Don't Grade" : analysis.recommendation === 'grade' ? 'Grade It' : 'Marginal'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] text-muted-foreground">Est. Grade</p>
          <p className="font-semibold">{analysis.estimated_grade || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Grading Company</p>
          <p className="font-semibold text-xs">{analysis.grading_company || 'N/A'}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Graded Value</p>
          <p className="font-semibold">{formatCurrency(analysis.estimated_graded_value || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Current Value</p>
          <p className="font-semibold">{formatCurrency(analysis.current_raw_value || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Grading Cost</p>
          <p className="font-semibold">{formatCurrency(analysis.grading_cost || 0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Potential Profit</p>
          <p className={`font-semibold ${analysis.potential_profit > 0 ? 'text-gain' : 'text-loss'}`}>
            {formatCurrency(analysis.potential_profit || 0)}
          </p>
        </div>
      </div>

      {analysis.explanation && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">{analysis.explanation}</p>
      )}
      <p className="text-[10px] text-muted-foreground italic">
        AI estimate only. Not an official grading assessment.
      </p>
    </div>
  );
}