import { useState } from 'react';
import { analyzeGradeWorthiness } from '@/lib/gradeWorthiness';
import { formatCurrency } from '@/lib/format';
import {
  Loader2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  ExternalLink,
  MapPin,
} from 'lucide-react';

const PSA_SUBMIT_URL = 'https://www.psacard.com/submit';
const PSA_DEALERS_URL = 'https://www.psacard.com/dealers';

export default function GradeWorthinessCard({ collectible, photoUrls }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await analyzeGradeWorthiness(collectible, photoUrls);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('Unable to complete the grading analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!analysis && !loading) {
    return (
      <div className="space-y-2">
        <button
          onClick={handleAnalyze}
          className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-primary" />
          </div>

          <div>
            <p className="text-sm font-medium">PSA Grading Analysis</p>
            <p className="text-xs text-muted-foreground">
              Compare raw value with estimated PSA 9 and PSA 10 outcomes
            </p>
          </div>

          <Sparkles className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>

        {error && (
          <p className="text-xs text-loss px-1">{error}</p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <div>
          <p className="text-sm font-medium">Analyzing grading potential...</p>
          <p className="text-xs text-muted-foreground">
            Comparing raw, PSA 9, and PSA 10 scenarios
          </p>
        </div>
      </div>
    );
  }

  const recStyle = {
    grade: {
      bg: 'bg-gain/10',
      text: 'text-gain',
      icon: TrendingUp,
      label: 'Grade It',
    },
    do_not_grade: {
      bg: 'bg-loss/10',
      text: 'text-loss',
      icon: TrendingDown,
      label: 'Keep Raw',
    },
    marginal: {
      bg: 'bg-gold/10',
      text: 'text-gold',
      icon: Minus,
      label: 'Borderline',
    },
  };

  const rec = recStyle[analysis.recommendation] || recStyle.marginal;
  const RecIcon = rec.icon;

  const rawValue =
    Number(analysis.current_raw_value) ||
    Number(collectible.estimated_value) ||
    0;

  const psa9Value = Number(analysis.psa_9_value) || 0;
  const psa10Value = Number(analysis.psa_10_value) || 0;
  const gradingCost = Number(analysis.grading_cost) || 0;

  const psa9Net =
    Number.isFinite(Number(analysis.psa_9_net_change))
      ? Number(analysis.psa_9_net_change)
      : psa9Value - rawValue - gradingCost;

  const psa10Net =
    Number.isFinite(Number(analysis.psa_10_net_change))
      ? Number(analysis.psa_10_net_change)
      : psa10Value - rawValue - gradingCost;

  const netClass = (value) =>
    value > 0 ? 'text-gain' : value < 0 ? 'text-loss' : '';

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <Award className="w-4 h-4 text-primary" />
            PSA Grading Analysis
          </h3>

          <p className="text-[11px] text-muted-foreground mt-1">
            Estimated grade: {analysis.estimated_grade || 'N/A'}
            {analysis.confidence
              ? ` • ${analysis.confidence} confidence`
              : ''}
          </p>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${rec.bg} ${rec.text} flex items-center gap-1 whitespace-nowrap`}
        >
          <RecIcon className="w-3 h-3" />
          {rec.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ValueBox
          label="Raw"
          value={rawValue}
        />

        <ValueBox
          label="PSA 9"
          value={psa9Value}
        />

        <ValueBox
          label="PSA 10"
          value={psa10Value}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NetBox
          label="PSA 9 Net"
          value={psa9Net}
          className={netClass(psa9Net)}
        />

        <NetBox
          label="PSA 10 Net"
          value={psa10Net}
          className={netClass(psa10Net)}
        />
      </div>

      <div className="rounded-xl bg-accent/40 p-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground">
            Estimated Grading Cost
          </p>
          <p className="font-semibold text-sm">
            {formatCurrency(gradingCost)}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-muted-foreground">
            Break-Even Value
          </p>
          <p className="font-semibold text-sm">
            {formatCurrency(
              Number(analysis.break_even_value) ||
                rawValue + gradingCost
            )}
          </p>
        </div>
      </div>

      {analysis.explanation && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          {analysis.explanation}
        </p>
      )}

      {analysis.pricing_basis && (
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
            Pricing Basis
          </p>
          <p className="text-xs text-muted-foreground">
            {analysis.pricing_basis}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a
          href={PSA_SUBMIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-primary text-primary-foreground px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/90"
        >
          Submit to PSA
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={PSA_DEALERS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-accent text-accent-foreground px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/80"
        >
          <MapPin className="w-3 h-3" />
          Find PSA Dealer
        </a>
      </div>

      <p className="text-[10px] text-muted-foreground italic">
        AI estimate only. PSA grade and future value are not guaranteed.
        COLLECTABLE is not affiliated with or endorsed by PSA.
      </p>
    </div>
  );
}

function ValueBox({ label, value }) {
  return (
    <div className="rounded-xl bg-accent/40 p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm mt-0.5">
        {formatCurrency(value || 0)}
      </p>
    </div>
  );
}

function NetBox({ label, value, className = '' }) {
  const prefix = value > 0 ? '+' : '';

  return (
    <div className="rounded-xl border border-border p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-semibold text-sm mt-0.5 ${className}`}>
        {prefix}
        {formatCurrency(value || 0)}
      </p>
    </div>
  );
}
