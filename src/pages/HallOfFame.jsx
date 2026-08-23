import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Loader2, Trophy, BookOpen, Award, Calendar } from 'lucide-react';

const ENTRY_ICONS = {
  completed_binder: BookOpen,
  custom_binder_100: BookOpen,
  milestone: Trophy,
  achievement: Award,
};

const ENTRY_COLORS = {
  completed_binder: 'text-primary bg-primary/10',
  custom_binder_100: 'text-gold bg-gold/10',
  milestone: 'text-gain bg-gain/10',
  achievement: 'text-purple-500 bg-purple-500/10',
};

export default function HallOfFame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Hall of Fame entries
      const [hofEntries, binders, achievements] = await Promise.all([
        base44.entities.HallOfFame.filter({ user_id: user.id }, '-completion_date', 100),
        base44.entities.CollectionBinder.filter({ user_id: user.id }, '-updated_date', 100),
        base44.entities.Achievement.filter({ user_id: user.id }, '-created_date', 50),
      ]);

      // Auto-generate entries from completed binders
      const completedBinders = binders.filter((b) => b.completion_percent >= 100);
      const existingBinderIds = new Set(
        hofEntries.filter((e) => e.entry_type === 'completed_binder' || e.entry_type === 'custom_binder_100').map((e) => e.binder_id)
      );

      const newEntries = [];
      for (const binder of completedBinders) {
        if (!existingBinderIds.has(binder.id)) {
          try {
            const entry = await base44.entities.HallOfFame.create({
              user_id: user.id,
              entry_type: binder.binder_type === 'master' ? 'completed_binder' : 'custom_binder_100',
              title: binder.name,
              description: `${binder.completion_percent}% complete`,
              binder_id: binder.id,
              photo_url: binder.cover_photo_url || '',
              completion_date: binder.updated_date,
              metric_value: binder.completion_percent,
            });
            newEntries.push(entry);
          } catch (e) {
            console.error(e);
          }
        }
      }

      setEntries([...hofEntries, ...newEntries].sort((a, b) => new Date(b.completion_date) - new Date(a.completion_date)));
    } catch (e) {
      console.error(e);
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

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Hall of Fame</h1>
          <p className="text-xs text-muted-foreground">Your permanent collecting legacy</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-gold" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">No Hall of Fame Entries Yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Complete binders, reach milestones, and earn achievements to build your legacy.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const Icon = ENTRY_ICONS[entry.entry_type] || Trophy;
            const colorClass = ENTRY_COLORS[entry.entry_type] || 'text-primary bg-primary/10';
            return (
              <button
                key={entry.id}
                onClick={() => entry.binder_id && navigate(`/binder/${entry.binder_id}`)}
                className="w-full text-left rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 p-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{entry.title}</p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground truncate">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(entry.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {entry.photo_url && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                      <Image src={entry.photo_url} fittingType="fill" className="w-full h-full" alt={entry.title} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}