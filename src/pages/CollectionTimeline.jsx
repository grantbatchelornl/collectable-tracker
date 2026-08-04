import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { buildTimeline, groupByDate, EVENT_ICONS } from '@/lib/timeline';
import { formatCurrency } from '@/lib/format';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';

export default function CollectionTimeline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [collectibles, achievements, trades] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 500),
        base44.entities.Achievement.filter({ user_id: user.id }, '-created_date', 50),
        base44.entities.Trade.filter({ recipient_id: user.id, status: 'completed' }, '-updated_date', 50),
      ]);
      const timeline = buildTimeline(
        collectibles.filter((c) => !c.is_deleted),
        achievements,
        trades
      );
      setEvents(timeline);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groups = groupByDate(events);

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Collection Timeline</h1>
          <p className="text-xs text-muted-foreground">Your collecting journey</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">No Events Yet</h2>
          <p className="text-muted-foreground text-sm">Add collectibles to start building your timeline.</p>
        </div>
      ) : (
        groups.map(([dateLabel, dateEvents]) => (
          <div key={dateLabel} className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{dateLabel}</p>
            <div className="relative pl-4 space-y-3 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {dateEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => event.route && navigate(event.route)}
                  className={`relative w-full text-left rounded-xl bg-card border border-border p-3 ${event.route ? 'hover:bg-accent' : 'cursor-default'}`}
                >
                  <div className="absolute -left-4 top-3.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0">{EVENT_ICONS[event.type] || '📢'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground truncate">{event.description}</p>}
                    </div>
                    {event.value > 0 && (
                      <span className="text-xs font-bold text-primary flex-shrink-0">{formatCurrency(event.value)}</span>
                    )}
                  </div>
                  {event.photo && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-border">
                      <Image src={event.photo} fittingType="fill" className="w-full h-full" alt={event.title} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}