import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getCategoryConfig } from '@/lib/binderCategories';
import { matchChecklist, calculateCompletion, wishlistAllMissing } from '@/lib/binderChecklist';
import BinderSlot from '@/components/binder/BinderSlot';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Star, Check, Package, AlertCircle } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All', icon: null },
  { key: 'owned', label: 'Owned', icon: Check },
  { key: 'missing', label: 'Missing', icon: AlertCircle },
  { key: 'wishlisted', label: 'Wishlisted', icon: Star },
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

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const b = await base44.entities.CollectionBinder.get(id);
      setBinder(b);
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

  const matchedChecklist = useMemo(() => {
    if (!binder?.checklist_json) return [];
    try {
      const checklist = JSON.parse(binder.checklist_json);
      return matchChecklist(checklist, collectibles, watchlist);
    } catch (e) {
      return [];
    }
  }, [binder, collectibles, watchlist]);

  const completion = useMemo(() => calculateCompletion(matchedChecklist), [matchedChecklist]);

  const filteredChecklist = useMemo(() => {
    if (filter === 'all') return matchedChecklist;
    return matchedChecklist.filter((item) => item.status === filter);
  }, [matchedChecklist, filter]);

  const missingItems = useMemo(
    () => matchedChecklist.filter((i) => i.status === 'missing'),
    [matchedChecklist]
  );

  const handleWishlistAll = async () => {
    setWishlistLoading(true);
    try {
      const count = await wishlistAllMissing(binder, user, matchedChecklist);
      setWishlistedCount(count);
      const updatedWatchlist = await base44.entities.Watchlist.filter({ user_id: user.id, status: 'active' });
      setWatchlist(updatedWatchlist);
    } catch (e) {
      console.error(e);
    } finally {
      setWishlistLoading(false);
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

  return (
    <div className="pb-4">
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl flex-shrink-0 ${catConfig.color}`}>
            {binder.icon || catConfig.icon}
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">{binder.name}</h1>
            <p className="text-xs text-muted-foreground">{binder.franchise} · {binder.set_name}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="font-display text-2xl font-bold">
                {completion.owned} <span className="text-muted-foreground text-base">/ {completion.total}</span>
              </p>
            </div>
            <p className="font-display text-3xl font-bold text-primary">{completion.percent}%</p>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${completion.percent}%` }} />
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
              <Button
                onClick={handleWishlistAll}
                disabled={wishlistLoading}
                size="sm"
                className="w-full"
              >
                {wishlistLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Adding to wishlist...</>
                ) : (
                  <><Star className="w-4 h-4" /> Wishlist All Missing</>
                )}
              </Button>
            )}
          </div>
        )}

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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {filteredChecklist.map((item, idx) => (
            <BinderSlot
              key={item.number || item.name || idx}
              item={item}
              onClick={() => {
                if (item.collectible) {
                  navigate(`/collectible/${item.collectible.id}`);
                }
              }}
            />
          ))}
        </div>

        {filteredChecklist.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No items match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}