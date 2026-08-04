import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getCategoryConfig, BINDER_CATEGORIES } from '@/lib/binderCategories';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Trophy, Loader2, Crown, Medal, Award } from 'lucide-react';

const TABS = [
  { key: 'completion', label: 'Top Completion %' },
  { key: 'items', label: 'Most Items' },
  { key: 'collectors', label: 'Top Collectors' },
];

const RANK_ICONS = [Crown, Medal, Award];

export default function BinderLeaderboards() {
  const navigate = useNavigate();
  const [binders, setBinders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('completion');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [binderData, profileData] = await Promise.all([
        base44.entities.CollectionBinder.filter({ privacy_status: 'public' }, '-completion_percent', 100),
        base44.entities.CollectorProfile.list('-trade_reputation_score', 200),
      ]);
      setBinders(binderData);
      setProfiles(profileData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const profileMap = useMemo(() => {
    const map = {};
    profiles.forEach((p) => { map[p.user_id] = p; });
    return map;
  }, [profiles]);

  const filteredBinders = useMemo(() => {
    if (categoryFilter === 'all') return binders;
    return binders.filter((b) => b.category === categoryFilter);
  }, [binders, categoryFilter]);

  const rankedCompletion = useMemo(() => {
    return [...filteredBinders].sort((a, b) => (b.completion_percent || 0) - (a.completion_percent || 0));
  }, [filteredBinders]);

  const rankedItems = useMemo(() => {
    return [...filteredBinders].sort((a, b) => (b.owned_count || 0) - (a.owned_count || 0));
  }, [filteredBinders]);

  const topCollectors = useMemo(() => {
    const collectorMap = {};
    filteredBinders.forEach((b) => {
      if (!collectorMap[b.user_id]) {
        collectorMap[b.user_id] = {
          user_id: b.user_id,
          binder_count: 0,
          total_owned: 0,
          total_target: 0,
          completed_binders: 0,
        };
      }
      collectorMap[b.user_id].binder_count++;
      collectorMap[b.user_id].total_owned += b.owned_count || 0;
      collectorMap[b.user_id].total_target += b.target_count || 0;
      if ((b.completion_percent || 0) >= 100) collectorMap[b.user_id].completed_binders++;
    });
    return Object.values(collectorMap).sort((a, b) => b.completed_binders - a.completed_binders || b.total_owned - a.total_owned);
  }, [filteredBinders]);

  const renderBinderRow = (binder, rank) => {
    const profile = profileMap[binder.user_id];
    const catConfig = getCategoryConfig(binder.category);
    const RankIcon = RANK_ICONS[rank];

    return (
      <button
        key={binder.id}
        onClick={() => navigate(`/binder/${binder.id}`)}
        className="w-full text-left rounded-2xl bg-card border border-border p-3 hover:bg-accent transition-colors flex items-center gap-3"
      >
        <div className="w-8 text-center flex-shrink-0">
          {RankIcon ? (
            <RankIcon className={`w-5 h-5 mx-auto ${rank === 0 ? 'text-gold' : rank === 1 ? 'text-muted-foreground' : 'text-orange-500'}`} />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">{rank + 1}</span>
          )}
        </div>

        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {profile?.profile_photo ? (
            <Image src={profile.profile_photo} fittingType="fill" className="w-full h-full" alt={profile.display_name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
              {(profile?.display_name || '?')[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{binder.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {profile?.display_name || 'Collector'} · {binder.franchise}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-display text-sm font-bold text-primary">{binder.completion_percent || 0}%</p>
          <p className="text-[10px] text-muted-foreground">{binder.owned_count || 0}/{binder.target_count || 0}</p>
        </div>
      </button>
    );
  };

  const renderCollectorRow = (collector, rank) => {
    const profile = profileMap[collector.user_id];
    const RankIcon = RANK_ICONS[rank];

    return (
      <div
        key={collector.user_id}
        className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3"
      >
        <div className="w-8 text-center flex-shrink-0">
          {RankIcon ? (
            <RankIcon className={`w-5 h-5 mx-auto ${rank === 0 ? 'text-gold' : rank === 1 ? 'text-muted-foreground' : 'text-orange-500'}`} />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">{rank + 1}</span>
          )}
        </div>

        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {profile?.profile_photo ? (
            <Image src={profile.profile_photo} fittingType="fill" className="w-full h-full" alt={profile.display_name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
              {(profile?.display_name || '?')[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{profile?.display_name || 'Collector'}</p>
          <p className="text-[10px] text-muted-foreground">{collector.binder_count} binders</p>
        </div>

        <div className="text-right flex-shrink-0">
          {collector.completed_binders > 0 && (
            <p className="text-xs font-bold text-gain">{collector.completed_binders} complete</p>
          )}
          <p className="text-[10px] text-muted-foreground">{collector.total_owned} items</p>
        </div>
      </div>
    );
  };

  const displayList = tab === 'completion' ? rankedCompletion : tab === 'items' ? rankedItems : topCollectors;

  return (
    <div className="px-4 py-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" /> Binder Leaderboards
          </h1>
          <p className="text-xs text-muted-foreground">Master collector rankings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
            categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          All
        </button>
        {BINDER_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategoryFilter(c.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
              categoryFilter === c.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No showcased binders yet</p>
          <p className="text-xs text-muted-foreground mt-1">Make your binder public to appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tab === 'collectors'
            ? topCollectors.slice(0, 50).map((c, i) => renderCollectorRow(c, i))
            : displayList.slice(0, 50).map((b, i) => renderBinderRow(b, i))}
        </div>
      )}
    </div>
  );
}