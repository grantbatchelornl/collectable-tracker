import { useNavigate } from 'react-router-dom';
import { Award, ChevronRight } from 'lucide-react';

export default function AchievementProgress({ achievements }) {
  const navigate = useNavigate();
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Award className="w-4 h-4 text-gold" /> Achievements
        </h3>
        <button
          onClick={() => navigate('/profile')}
          className="text-xs text-primary font-medium flex items-center gap-0.5"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {achievements.slice(0, 6).map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 bg-accent rounded-lg px-2.5 py-1.5"
          >
            <span className="text-lg">{a.badge_icon || '🏆'}</span>
            <div>
              <p className="text-xs font-medium leading-tight">{a.badge_name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{a.badge_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}