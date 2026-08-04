import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getCategoryConfig } from '@/lib/binderCategories';
import {
  matchChecklist,
  calculateCompletion,
  wishlistAllMissing,
  estimateMissingItemsCost,
  mergeCostEstimates,
  getDuplicateSuggestions,
  checkAndNotifyMilestones,
  updateBinderStats,
} from '@/lib/binderChecklist';
import BinderSlot from '@/components/binder/BinderSlot';
import BinderGrid from '@/components/binder/BinderGrid';
import BinderStatistics from '@/components/binder/BinderStatistics';
import DigitalBinderPage from '@/components/binder/DigitalBinderPage';
import QRBinderShare from '@/components/binder/QRBinderShare';
import CompletionCost from '@/components/binder/CompletionCost';
import MissingList from '@/components/binder/MissingList';
import DuplicateSuggestions from '@/components/binder/DuplicateSuggestions';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Star,
  Check,
  AlertCircle,
  Lock,
  Users,
  Globe,
  Trophy,
  Sparkles,
  LayoutGrid,
  List,
  Images,
  Square,
  Grid3x3,
  BookOpen,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Image as UIImage } from '@/components/ui/image';

const FILTERS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'owned', label: 'Owned', icon: Check },
  { key: 'missing', label: 'Missing', icon: AlertCircle },
  { key: 'wishlisted', label: 'Wishlisted', icon: Star },
];

const PRIVACY_ORDER = ['private', 'friends', 'public'];

const VIEW_MODES = [
  { key: 'grid', icon: LayoutGrid },
  { key: 'list', icon: List },
  { key: 'gallery', icon: Images },
  { key: 'large', icon: Square },
  { key: 'small', icon: Grid3x3 },
  { key: 'binder', icon: BookOpen },
];

export default function BinderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [binder, setBinder] = useState(null);
  const [collectibles, setCollectibles] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistedCount, setWishlistedCount] = useState(0);
  const [estimating, setEstimating] = useState(false);
  const [milestoneMsg, setMilestoneMsg] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sorting, setSorting] = useState('number');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const b = await base44.entities.CollectionBinder.get(id);
      setBinder(b);
      setViewMode(b.view_mode || 'grid');
      setSorting(b.sorting || 'number');
      const [collectibleData, watchlistData] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id, is_deleted: false }, '-estimated_value', 500),
        base44.entities.Watchlist.filter({ user_id: user.id, status: 'active' }),
      ]);
      setCollectibles(collectibleData);
      setWatchlist(watchlistData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const costEstimates = useMemo(() => {
    if (!binder?.cost_estimates_json) return null;
    try {
      return JSON.parse(binder.cost_estimates_json);
    } catch (e) {
      return null;
    }
  }, [binder]);

  const matchedChecklist = useMemo(() => {
    if (!binder?.checklist_json) return [];
    try {
      const checklist = JSON.parse(binder.checklist_json);
      const matched = matchChecklist(checklist, collectibles, watchlist);
      return mergeCostEstimates(matched, costEstimates);
    } catch (e) {
      return [];
    }
  }, [binder, collectibles, watchlist, costEstimates]);

  const completion = useMemo(() => calculateCompletion(matchedChecklist), [matchedChecklist]);

  const duplicateSuggestions = useMemo(() => getDuplicateSuggestions(matchedChecklist), [matchedChecklist]);

  const filteredChecklist = useMemo(() => {
    if (filter === 'all') return matchedChecklist;
    return matchedChecklist.filter((item) => item.status === filter);
  }, [matchedChecklist, filter]);

  const missingItems = useMemo(
    () => matchedChecklist.filter((i) => i.status === 'missing'),
    [matchedChecklist]
  );

  // Update binder stats + check milestones after data loads
  useEffect(() => {
    if (!binder || !user || completion.total === 0) return;
    const runAsync = async () => {
      await updateBinderStats(binder, completion);
      const milestone = await checkAndNotifyMilestones(binder, completion, user);
      if (milestone) setMilestoneMsg(milestone);
    };
    runAsync();
  }, [completion.owned, completion.percent]);

  const handleWishlistAll = async () => {
    setWishlistLoading(true);
    try {
      const count = await wishlistAllMissing(binder, user, matchedChecklist);
      setWishlistedCount(count);
      const updated = await base44.entities.Watchlist.filter({ user_id: user.id, status: 'active' });
      setWatchlist(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleEstimateCosts = async () => {
    setEstimating(true);
    try {
      const estimates = await estimateMissingItemsCost(missingItems, binder);
      const updated = await base44.entities.CollectionBinder.update(binder.id, {
        cost_estimates_json: JSON.stringify(estimates),
        cost_estimates_date: new Date().toISOString(),
      });
      setBinder(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setEstimating(false);
    }
  };

  const cyclePrivacy = async () => {
    const next = PRIVACY_ORDER[(PRIVACY_ORDER.indexOf(binder.privacy_status || 'private') + 1) % 3];
    const updated = await base44.entities.CollectionBinder.update(binder.id, { privacy_status: next });
    setBinder(updated);
  };

  const handleMarkForTrade = async (item) => {
    if (!item.tradeableIds?.length) return;
    try {
      await base44.entities.Collectible.updateMany(
        { _id: { $in: item.tradeableIds } },
        { $set: { trade_status: 'trade' } }
      );
      const updated = await base44.entities.Collectible.filter({ created_by_id: user.id, is_deleted: false }, '-estimated_value', 500);
      setCollectibles(updated);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!binder) {
    return <div className="text-center py-20 text-muted-foreground">Binder not found.</div>;
  }

  const catConfig = getCategoryConfig(binder.category);
  const privacyIcon = binder.privacy_status === 'public' ? Globe : binder.privacy_status === 'friends' ? Users : Lock;
  const accentColor = binder.color;

  return (
    <div className="pb-4">
      {binder.cover_photo_url && (
        <div className="relative h-32 overflow-hidden">
          <UIImage src={binder.cover_photo_url} fittingType="fill" className="w-full h-full" alt={binder.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="px-4 py-4 space-y-4">
        {!binder.cover_photo_url && (
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl flex-shrink-0 ${!accentColor ? catConfig.color : ''}`}
            style={accentColor ? { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}40` } : undefined}
          >
            {binder.icon || catConfig.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-lg font-bold">{binder.name}</h1>
              {binder.binder_type === 'master' && (
                <span className="text-[8px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-bold">MASTER</span>
              )}
              {binder.ai_prompt && (
                <span className="text-[8px] bg-purple-500/10 text-purple-500 rounded-full px-1.5 py-0.5 font-bold">AI</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{binder.franchise} · {binder.set_name}</p>
          </div>
          {binder.privacy_status === 'public' && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
              <Trophy className="w-3 h-3" /> Showcased
            </span>
          )}
        </div>

        {/* Completion Stats */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="font-display text-2xl font-bold">
                {completion.owned} <span className="text-muted-foreground text-base">/ {completion.total}</span>
              </p>
            </div>
            <p className="font-display text-3xl font-bold" style={{ color: accentColor || 'hsl(var(--primary))' }}>{completion.percent}%</p>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full transition-all relative" style={{ width: `${completion.percent}%`, backgroundColor: accentColor || 'hsl(var(--primary))' }}>
              <div className="absolute inset-0 holo-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div>
              <p className="text-[10px] text-muted-foreground">Owned</p>
              <p className="text-sm font-bold text-gain">{completion.owned}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Missing</p>
              <p className="text-sm font-bold text-loss">{completion.missing}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Wishlisted</p>
              <p className="text-sm font-bold text-gold">{completion.wishlisted}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Graded</p>
              <p className="text-sm font-bold text-primary">{completion.graded}</p>
            </div>
          </div>
        </div>

        {/* Milestone Banner */}
        {milestoneMsg && (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">{milestoneMsg.title}</p>
              <p className="text-xs text-muted-foreground">{milestoneMsg.body}</p>
            </div>
          </div>
        )}

        {/* Milestone progress banner */}
        {completion.missing > 0 && completion.missing <= 10 && completion.percent >= 75 && (
          <div className="rounded-2xl bg-gold/5 border border-gold/20 p-3 text-center">
            <p className="text-sm font-medium text-gold">
              You are {completion.missing} {completion.missing === 1 ? 'card' : 'cards'} away! 🔥
            </p>
          </div>
        )}

        {/* Privacy / Showcase toggle */}
        <button
          onClick={cyclePrivacy}
          className="w-full flex items-center justify-between rounded-xl bg-card border border-border p-3"
        >
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = privacyIcon;
              return <Icon className={`w-4 h-4 ${binder.privacy_status === 'public' ? 'text-primary' : 'text-muted-foreground'}`} />;
            })()}
            <div className="text-left">
              <p className="text-sm font-medium">Showcase</p>
              <p className="text-[10px] text-muted-foreground">
                {binder.privacy_status === 'private' && 'Only you can see this binder'}
                {binder.privacy_status === 'friends' && 'Friends can see this binder'}
                {binder.privacy_status === 'public' && 'Visible on leaderboards & showcase'}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium capitalize">{binder.privacy_status || 'private'}</span>
        </button>

        {/* Binder Statistics */}
        <BinderStatistics
          checklist={matchedChecklist}
          binder={binder}
          completion={completion}
          costEstimates={costEstimates}
        />

        {/* QR Share */}
        <QRBinderShare binder={binder} />

        {/* Completion Cost */}
        <CompletionCost
          costEstimates={costEstimates}
          estimating={estimating}
          onEstimate={handleEstimateCosts}
          binder={binder}
        />

        {/* AI Completion Assistant + Wishlist All */}
        {missingItems.length > 0 && (
          <div className="rounded-2xl bg-gold/5 border border-gold/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gold" />
              <p className="text-sm font-medium">AI Completion Assistant</p>
            </div>
            <p className="text-xs text-muted-foreground">
              You're missing {missingItems.length} items, including:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {missingItems.slice(0, 8).map((item) => (
                <span key={item.number || item.name} className="text-xs bg-card border border-border rounded-full px-2 py-0.5">
                  {item.name}
                </span>
              ))}
              {missingItems.length > 8 && (
                <span className="text-xs text-muted-foreground">+{missingItems.length - 8} more</span>
              )}
            </div>
            {wishlistedCount > 0 ? (
              <div className="flex items-center gap-2 text-xs text-gain">
                <Check className="w-4 h-4" />
                Added {wishlistedCount} items to your wishlist!
              </div>
            ) : (
              <Button onClick={handleWishlistAll} disabled={wishlistLoading} size="sm" className="w-full">
                {wishlistLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Adding to wishlist...</>
                ) : (
                  <><Star className="w-4 h-4" /> Wishlist All Missing — One Click</>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Missing List (detailed) */}
        {missingItems.length > 0 && (
          <MissingList
            missingItems={missingItems}
            binder={binder}
            user={user}
            onWishlisted={() => {}}
          />
        )}

        {/* Duplicate Suggestions */}
        <DuplicateSuggestions
          duplicates={duplicateSuggestions}
          onMarkForTrade={handleMarkForTrade}
          navigate={navigate}
        />

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {f.icon && <f.icon className="w-3 h-3" />} {f.label}
            </button>
          ))}
        </div>

        {/* View mode & sorting */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {VIEW_MODES.map((vm) => {
              const Icon = vm.icon;
              return (
                <button
                  key={vm.key}
                  onClick={() => setViewMode(vm.key)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    viewMode === vm.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
          <select
            value={sorting}
            onChange={(e) => setSorting(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-2 py-1.5"
          >
            <option value="number">Sort: Number</option>
            <option value="value">Sort: Value</option>
            <option value="name">Sort: Name</option>
            <option value="rarity">Sort: Rarity</option>
          </select>
        </div>

        {/* Binder grid */}
        {viewMode === 'binder' ? (
          <DigitalBinderPage
            checklist={filteredChecklist}
            binder={binder}
            onSlotClick={(item) => {
              if (item.collectible) {
                navigate(`/collectible/${item.collectible.id}`);
              }
            }}
          />
        ) : (
          <BinderGrid
            checklist={filteredChecklist}
            viewMode={viewMode}
            sorting={sorting}
            onSlotClick={(item) => {
              if (item.collectible) {
                navigate(`/collectible/${item.collectible.id}`);
              }
            }}
          />
        )}

        {/* Auto-populate note */}
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          💡 Items auto-populate when you add matching collectibles — no manual linking needed.
        </p>
      </div>
    </div>
  );
}