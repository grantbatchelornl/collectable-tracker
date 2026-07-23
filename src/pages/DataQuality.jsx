import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Lock,
  ImageIcon,
} from 'lucide-react';
import {
  computeQualityScore,
  getScoreColor,
  getScoreLabel,
  getScoreBg,
} from '@/lib/dataQuality';

const ISSUE_CONFIGS = [
  { key: 'needPhotos', icon: '📷', label: 'Need better photos' },
  { key: 'outdatedPricing', icon: '💰', label: 'Outdated pricing' },
  { key: 'lowConfidence', icon: '❓', label: 'Low-confidence identification' },
  { key: 'missingDetails', icon: '📝', label: 'Missing important details' },
  { key: 'needGrading', icon: '🏷️', label: 'Need grading information' },
  { key: 'missingRequiredPhotos', icon: '📦', label: 'Missing required photos' },
  { key: 'notRepriced30Days', icon: '🔄', label: 'Not repriced in 30+ days' },
  { key: 'possibleDuplicates', icon: '📋', label: 'Possible duplicates' },
];

const QUICK_ACTIONS = [
  { icon: '💰', label: 'Update Prices', issueKey: 'outdatedPricing' },
  { icon: '📷', label: 'Finish Photos', issueKey: 'needPhotos' },
  { icon: '❓', label: 'Review AI IDs', issueKey: 'lowConfidence' },
  { icon: '📝', label: 'Complete Info', issueKey: 'missingDetails' },
  { icon: '📋', label: 'Check Duplicates', issueKey: 'possibleDuplicates' },
];

function ScoreRing({ score }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-3xl font-extrabold ${color}`}>{score}%</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

export default function DataQuality() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [expandedIssue, setExpandedIssue] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [collectibles, pricingHistory, photos] = await Promise.all([
        base44.entities.Collectible.list('-created_date', 500),
        base44.entities.PricingHistory.list('-created_date', 500),
        base44.entities.CollectiblePhoto.list('-created_date', 500),
      ]);
      setData(computeQualityScore(collectibles, pricingHistory, photos));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="font-display text-xl font-bold">Data Quality</h1>
        </div>
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">No Collection Yet</h2>
          <p className="text-muted-foreground text-sm">Add collectibles to see your data quality score.</p>
        </div>
      </div>
    );
  }

  const { score, issues, factors } = data;
  const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Data Quality</h1>
          <p className="text-xs text-muted-foreground">Keep your collection accurate and complete</p>
        </div>
      </div>

      {/* Overall Health */}
      <div className="rounded-3xl bg-card border border-border p-5 flex items-center gap-5">
        <ScoreRing score={score} />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Collection Quality Score</p>
            <p className={`font-display text-2xl font-bold ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </p>
          </div>
          {totalIssues > 0 ? (
            <p className="text-sm text-muted-foreground">
              {totalIssues} item{totalIssues !== 1 ? 's' : ''} need attention
            </p>
          ) : (
            <p className="text-sm text-gain font-medium">Your collection is in great shape!</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {totalIssues > 0 && (
        <div>
          <h2 className="font-display font-bold text-sm mb-3">Quick Actions</h2>
          <div className="grid grid-cols-5 gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.issueKey}
                onClick={() =>
                  setExpandedIssue(expandedIssue === action.issueKey ? null : action.issueKey)
                }
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-card border border-border hover:bg-accent"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-[9px] font-medium text-center leading-tight">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Needs Attention */}
      <div className="space-y-2">
        <h2 className="font-display font-bold text-sm">Needs Attention</h2>
        {ISSUE_CONFIGS.map((config) => {
          const items = issues[config.key] || [];
          if (items.length === 0) return null;
          const isExpanded = expandedIssue === config.key;
          return (
            <div
              key={config.key}
              className="rounded-2xl bg-card border border-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedIssue(isExpanded ? null : config.key)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-left">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{items.length}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-1.5 max-h-72 overflow-y-auto">
                  {items.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/collectible/${c.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left"
                    >
                      {c.primary_photo_url ? (
                        <Image
                          src={c.primary_photo_url}
                          fittingType="fill"
                          className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                          alt={c.item_name}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.item_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.category_name}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {totalIssues === 0 && (
          <div className="rounded-2xl bg-gain/5 border border-gain/20 p-4 text-center">
            <p className="text-sm text-gain font-medium">All checks passed!</p>
            <p className="text-xs text-muted-foreground mt-1">No issues found in your collection.</p>
          </div>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <h2 className="font-display font-bold text-sm">Score Breakdown</h2>
        {factors.map((f) => (
          <div key={f.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-medium">{f.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${getScoreBg(f.score)}`}
                style={{ width: `${f.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 rounded-2xl bg-accent/50 p-3">
        <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Your quality score is private. It does not affect your collector profile, achievements, or
          rankings.
        </p>
      </div>
    </div>
  );
}