import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getCategoryConfig } from '@/lib/binderCategories';
import { matchChecklist, calculateCompletion } from '@/lib/binderChecklist';
import CreateBinderModal from '@/components/binder/CreateBinderModal';
import CustomBinderModal from '@/components/binder/CustomBinderModal';
import BinderLibrary from '@/components/binder/BinderLibrary';
import AIBinderBuilder from '@/components/binder/AIBinderBuilder';
import { ArrowLeft, Plus, BookOpen, Loader2, Trophy, Wand2, Palette, Library } from 'lucide-react';
import { Image } from '@/components/ui/image';

const TABS = [
  { key: 'my', label: 'My Binders', icon: BookOpen },
  { key: 'library', label: 'Binder Library', icon: Library },
];

export default function Binders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('my');
  const [binders, setBinders] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);

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
      setBinders(binderData.filter((b) => !b.is_deleted));
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

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'my' && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Quick Create
            </button>
            <button
              onClick={() => setShowCustom(true)}
              className="flex-1 h-11 rounded-xl bg-card border border-border text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Palette className="w-4 h-4" /> Custom
            </button>
            <button
              onClick={() => setShowAIBuilder(true)}
              className="flex-1 h-11 rounded-xl bg-card border border-border text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Wand2 className="w-4 h-4 text-primary" /> AI Builder
            </button>
            <button
              onClick={() => navigate('/binder-leaderboards')}
              className="h-11 px-3 rounded-xl bg-card border border-border text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-gold" />
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
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">
                Browse Master Binders for every official set, use the AI Builder for custom collections, or create your own.
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setTab('library')} className="text-xs bg-primary text-primary-foreground rounded-full px-3 py-1.5 font-medium">
                  Browse Binder Library
                </button>
                <button onClick={() => setShowAIBuilder(true)} className="text-xs bg-card border border-border rounded-full px-3 py-1.5 font-medium">
                  Try AI Builder
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {binders.map((binder) => {
                const comp = getCompletion(binder);
                const catConfig = getCategoryConfig(binder.category);
                const accentColor = binder.color;
                return (
                  <button
                    key={binder.id}
                    onClick={() => navigate(`/binder/${binder.id}`)}
                    className="w-full text-left rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors relative overflow-hidden"
                  >
                    {binder.cover_photo_url && (
                      <div className="absolute inset-0 opacity-10">
                        <Image src={binder.cover_photo_url} fittingType="fill" className="w-full h-full" alt="" />
                      </div>
                    )}
                    <div className="relative flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 ${!binder.color ? catConfig.color : ''}`}
                        style={binder.color ? { backgroundColor: `${binder.color}15`, borderColor: `${binder.color}40` } : undefined}
                      >
                        {binder.icon || catConfig.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{binder.name}</p>
                          {binder.binder_type === 'master' && (
                            <span className="text-[8px] bg-primary/10 text-primary rounded-full px-1 py-0.5 font-bold">MASTER</span>
                          )}
                          {binder.ai_prompt && (
                            <span className="text-[8px] bg-purple-500/10 text-purple-500 rounded-full px-1 py-0.5 font-bold">AI</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {comp.owned} / {comp.total} owned · {comp.missing} missing
                        </p>
                      </div>
                      <span className="text-lg font-display font-bold" style={{ color: accentColor || 'hsl(var(--primary))' }}>
                        {comp.percent}%
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${comp.percent}%`, backgroundColor: accentColor || 'hsl(var(--primary))' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'library' && <BinderLibrary />}

      {showCreate && (
        <CreateBinderModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={(binder) => { setShowCreate(false); navigate(`/binder/${binder.id}`); }}
        />
      )}
      {showCustom && (
        <CustomBinderModal
          onClose={() => setShowCustom(false)}
          onCreated={(binder) => { setShowCustom(false); navigate(`/binder/${binder.id}`); }}
        />
      )}
      {showAIBuilder && (
        <AIBinderBuilder onBuilt={(binder) => { setShowAIBuilder(false); navigate(`/binder/${binder.id}`); }} />
      )}
    </div>
  );
}