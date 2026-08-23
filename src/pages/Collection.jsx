import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import CollectibleCard from '@/components/CollectibleCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
import SmartSearchBar from '@/components/SmartSearchBar';
import { Loader2, Package, FileText, Store, BookOpen } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import PullToRefresh from '@/components/PullToRefresh';
import { getCategoryIcon } from '@/lib/categoryIcons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Collection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collectibles, setCollectibles] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smartFilterIds, setSmartFilterIds] = useState(null);
  const [smartExplanation, setSmartExplanation] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showForSale, setShowForSale] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [acquisitionSource, setAcquisitionSource] = useState('all');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, history, cats] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 500),
        base44.entities.PricingHistory.filter({ created_by_id: user.id }, '-created_date', 1000),
        base44.entities.CollectibleCategory.list('sort_order', 50),
      ]);
      setCollectibles(items.filter((c) => !c.is_deleted));
      setPricingHistory(history);
      setCategories(cats.filter((c) => c.active));
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceReport = async () => {
    setReportLoading(true);
    try {
      const { generateInsuranceReport } = await import('@/lib/insuranceReport');
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      await generateInsuranceReport(collectibles, user, profiles[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setReportLoading(false);
    }
  };

  const previousValues = useMemo(() => {
    const historyByCollectible = {};
    pricingHistory.forEach((h) => {
      if (!historyByCollectible[h.collectible_id])
        historyByCollectible[h.collectible_id] = [];
      historyByCollectible[h.collectible_id].push(h);
    });
    const result = {};
    Object.entries(historyByCollectible).forEach(([id, history]) => {
      const sorted = history.sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      if (sorted.length >= 2) {
        result[id] = sorted[sorted.length - 2].estimated_value;
      }
    });
    return result;
  }, [pricingHistory]);

  const filtered = useMemo(() => {
    let result = [...collectibles];
    if (smartFilterIds) {
      result = result.filter((c) => smartFilterIds.includes(c.id));
    }
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category_id === activeCategory);
    }
    if (acquisitionSource !== 'all') {
      result = result.filter((c) => c.acquisition_source === acquisitionSource);
    }
    if (showForSale) {
      result = result.filter((c) => c.for_sale);
    }
    if (showFavorites) {
      result = result.filter((c) => c.is_favorite);
    }
    switch (sortBy) {
      case 'value_desc':
        result.sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0));
        break;
      case 'value_asc':
        result.sort((a, b) => (a.estimated_value || 0) - (b.estimated_value || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
        break;
      default:
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    return result;
  }, [collectibles, smartFilterIds, activeCategory, sortBy, showForSale, showFavorites, acquisitionSource]);

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-3">
        <h1 className="font-display text-xl font-bold">Collection</h1>
        <div className="h-10 rounded-xl skeleton" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (collectibles.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Your Collection Starts Here"
        description="Scan a collectible to identify and price it instantly, or add one manually."
        actionLabel="Scan a Collectible"
        onAction={() => navigate('/scan')}
        secondaryActionLabel="Add Manually"
        onSecondaryAction={() => navigate('/add')}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Collection</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/binders')}
            className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/20 rounded-full px-3 py-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Binders
          </button>
          <button
            onClick={handleInsuranceReport}
            disabled={reportLoading}
            className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/20 rounded-full px-3 py-1.5 disabled:opacity-40"
          >
            {reportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            Insurance
          </button>
        </div>
      </div>

      <SmartSearchBar
        collectibles={collectibles}
        onFilterChange={(ids, explanation) => {
          setSmartFilterIds(ids);
          setSmartExplanation(explanation);
        }}
        placeholder="Search or ask AI... (e.g. 'Cards worth over $100')"
      />
      {smartExplanation && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-2">
          <p className="text-[11px] text-primary">{smartExplanation}</p>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        <button
          onClick={() => setShowForSale(!showForSale)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            showForSale ? 'bg-gold text-white' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          For Sale
        </button>
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            showFavorites ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          ★ Favorites
        </button>
        <button
          onClick={() => setAcquisitionSource(acquisitionSource === 'all' ? 'purchase' : 'all')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            acquisitionSource !== 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          <Store className="w-3 h-3 inline mr-0.5" /> Acquired
        </button>
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          All
        </button>
        {categories.map((c) => {
          const CatIcon = getCategoryIcon(c.name);
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5 ${
                activeCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <CatIcon className="w-3 h-3" />
              {c.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} items</p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[170px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="value_desc">Value: High to Low</SelectItem>
            <SelectItem value="value_asc">Value: Low to High</SelectItem>
            <SelectItem value="name">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((c, idx) => (
          <CollectibleCard key={c.id} collectible={c} previousValue={previousValues[c.id]} index={idx} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <p className="mb-3">No collectibles match your filters.</p>
          <button
            onClick={() => { setSmartFilterIds(null); setSmartExplanation(null); setActiveCategory('all'); setShowForSale(false); setShowFavorites(false); setAcquisitionSource('all'); }}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}