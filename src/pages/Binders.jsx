import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getCategoryConfig } from '@/lib/binderCategories';
import { matchChecklist, calculateCompletion } from '@/lib/binderChecklist';
import CreateBinderModal from '@/components/binder/CreateBinderModal';
import { ArrowLeft, Plus, BookOpen, Loader2, Trophy } from 'lucide-react';

export default function Binders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [binders, setBinders] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [binderData, collectibleData] = await Promise.all([
        base44.entities.CollectionBinder.filter({ user_id: user.id }, '-created_date', 50),
        base44.entities.Collectible.filter({ created_by_id: user.id, is_deleted: false }, '-estimated_value', 500),
      ]);
      setBinders(binderData);
      setCollectibles(collectibleData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getCompletion = (binder) => {
    if (!binder.checklist_json) return { owned: 0, total: binder.target_count || 0, percent: 0 };
    try {
      const checklist = JSON.parse(binder.checklist_json);
      const matched = matchChecklist(checklist, collectibles, []);
      return calculateCompletion(matched);
    } catch (e) {
      return { owned: 0, total: binder.target_count || 0, percent: 0 };
    }
  };

  return (
    <div className="px-4 py-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold">Collection Binders</h1>
          <p className="text-xs text-muted-foreground">Track set completion</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowCreate(true)}
          className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Binder
        </button>
        <button
          onClick={() => navigate('/binder-leaderboards')}
          className="h-11 px-4 rounded-xl bg-card border border-border text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Trophy className="w-4 h-4 text-gold" /> Leaderboards
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : binders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">No Binders Yet</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Create a binder for any set — Pokémon, Magic, Lorcana, Sports, Funko, Coins, and more. The AI generates the full checklist automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {binders.map((binder) => {
            const comp = getCompletion(binder);
            const catConfig = getCategoryConfig(binder.category);
            return (
              <button
                key={binder.id}
                onClick={() => navigate(`/binder/${binder.id}`)}
                className="w-full text-left rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 ${catConfig.color}`}>
                    {binder.icon || catConfig.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{binder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {comp.owned} / {comp.total} owned · {comp.missing} missing
                    </p>
                  </div>
                  <span className="text-lg font-display font-bold text-primary">{comp.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${comp.percent}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateBinderModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData(); }}
        />
      )}
    </div>
  );
}