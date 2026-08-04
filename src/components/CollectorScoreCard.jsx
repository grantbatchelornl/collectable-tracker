import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';

export default function CollectorScoreCard({ scoreData }) {
  const navigate = useNavigate();
  if (!scoreData) return null;

  const { score, factors, label, verifiedCount, total } = scoreData;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass =
    score >= 90 ? 'text-gain' : score >= 75 ? 'text-gold' : score >= 50 ? 'text-primary' : 'text-loss';

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              className={colorClass}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-xl font-extrabold ${colorClass}`}>{score}</span>
            <span className="text-[8px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-gold" />
            <h3 className="font-semibold text-sm">Collector Score</h3>
          </div>
          <p className={`font-display text-lg font-bold ${colorClass}`}>{label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {verifiedCount}/{total} verified values
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {factors.map((f) => (
          <div key={f.key} className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-medium">{f.score}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  f.score >= 75 ? 'bg-gain' : f.score >= 50 ? 'bg-gold' : 'bg-loss'
                }`}
                style={{ width: `${f.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground mt-3 pt-2 border-t border-border">
        Manual values do not increase your score. Only verified sold data counts.
      </p>
    </div>
  );
}