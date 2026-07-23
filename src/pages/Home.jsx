import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CollectibleCard from '@/components/CollectibleCard';
import PortfolioChart from '@/components/PortfolioChart';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import TopMovers from '@/components/TopMovers';
import { buildPortfolioTimeSeries, getCategoryBreakdown, getTopMovers } from '@/lib/portfolio';
import { Search, Plus, TrendingUp, TrendingDown, Package, Loader2, Eye, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function Home() {
  const navigate = useNavigate();
  const [collectibles, setCollectibles] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showForSale, setShowForSale] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, history, cats] = await Promise.all([
        base44.entities.Collectible.list('-created_date', 200),
        base44.entities.PricingHistory.list('-created_date', 500),
        base44.entities.CollectibleCategory.list('sort_order', 50),
      ]);
      setCollectibles(items);
      setPricingHistory(history);
      setCategories(cats.filter((c) => c.active));
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalValue = collectibles.reduce(
      (sum, c) => sum + (c.estimated_value || 0),
      0
    );

    const historyByCollectible = {};
    pricingHistory.forEach((h) => {
      if (!historyByCollectible[h.collectible_id])
        historyByCollectible[h.collectible_id] = [];
      historyByCollectible[h.collectible_id].push(h);
    });

    const now = Date.now();
    const periods = {
      day: now - 86400000,
      week: now - 604800000,
      month: now - 2592000000,
      year: now - 31536000000,
    };

    const getValueAt = (collectibleId, timestamp) => {
      const history = (historyByCollectible[collectibleId] || []).sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      let value = 0;
      for (const h of history) {
        if (new Date(h.created_date).getTime() <= timestamp) {
          value = h.estimated_value;
        } else break;
      }
      return value;
    };

    const changes = {};
    Object.entries(periods).forEach(([period, ts]) => {
      const pastTotal = collectibles.reduce(
        (sum, c) => sum + getValueAt(c.id, ts),
        0
      );
      changes[period] = totalValue - pastTotal;
    });

    return { totalValue, count: collectibles.length, changes };
  }, [collectibles, pricingHistory]);

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
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.item_name?.toLowerCase().includes(q) ||
          c.category_name?.toLowerCase().includes(q) ||
          c.character_athlete_name?.toLowerCase().includes(q) ||
          c.brand?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category_id === activeCategory);
    }
    if (showForSale) {
      result = result.filter((c) => c.for_sale);
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
        result.sort(
          (a, b) => new Date(b.created_date) - new Date(a.created_date)
        );
    }
    return result;
  }, [collectibles, search, activeCategory, sortBy]);

  const highestValue = useMemo(
    () =>
      [...collectibles]
        .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
        .slice(0, 6),
    [collectibles]
  );

  const ChangePill = ({ value }) => {
    if (value === 0)
      return <span className="text-sm font-medium text-muted-foreground">$0</span>;
    const isGain = value > 0;
    return (
      <span
        className={`flex items-center gap-0.5 text-sm font-semibold ${
          isGain ? 'text-gain' : 'text-loss'
        }`}
      >
        {isGain ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        {isGain ? '+' : ''}
        {formatCurrency(value)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="rounded-3xl bg-card border border-border p-5 holo-shimmer">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Total Collection Value
        </p>
        <p className="font-display text-4xl font-extrabold tracking-tight mt-1">
          {formatCurrency(stats.totalValue)}
        </p>
        <div className="flex gap-4 mt-4">
          {[
            { label: '1D', value: stats.changes.day },
            { label: '1W', value: stats.changes.week },
            { label: '1M', value: stats.changes.month },
            { label: '1Y', value: stats.changes.year },
          ].map((p) => (
            <div key={p.label} className="flex-1">
              <p className="text-[10px] text-muted-foreground mb-0.5">{p.label}</p>
              <ChangePill value={p.value} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {stats.count} collectible{stats.count !== 1 ? 's' : ''} in your collection
          </span>
        </div>
      </div>

      {collectibles.length > 0 && pricingHistory.length > 1 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="font-semibold text-sm mb-3">Portfolio Value Over Time</h3>
          <PortfolioChart data={buildPortfolioTimeSeries(collectibles, pricingHistory)} />
        </div>
      )}

      {collectibles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/watchlist')}
            className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Watchlist</p>
              <p className="text-xs text-muted-foreground truncate">Track items to buy</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/data-quality')}
            className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">Data Quality</p>
              <p className="text-xs text-muted-foreground truncate">Collection health</p>
            </div>
          </button>
        </div>
      )}

      {collectibles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Start Your Collection</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Add your first collectible to start tracking its value over time.
          </p>
          <button
            onClick={() => navigate('/add')}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium"
          >
            <Plus className="w-5 h-5" /> Add Collectible
          </button>
        </div>
      ) : (
        <>
          {highestValue.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">Highest Value</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                {highestValue.map((c) => (
                  <div key={c.id} className="w-40 flex-shrink-0">
                    <CollectibleCard
                      collectible={c}
                      previousValue={previousValues[c.id]}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {(() => {
            const movers = getTopMovers(collectibles, pricingHistory);
            return movers.gainers.length > 0 || movers.losers.length > 0 ? (
              <TopMovers gainers={movers.gainers} losers={movers.losers} />
            ) : null;
          })()}

          {(() => {
            const breakdown = getCategoryBreakdown(collectibles, categories);
            return breakdown.length > 1 ? <CategoryBreakdown data={breakdown} /> : null;
          })()}

          <section className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              <button
                onClick={() => setShowForSale(!showForSale)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  showForSale
                    ? 'bg-gold text-white'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                For Sale
              </button>
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    activeCategory === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">All Items</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="recent">Recent</option>
                <option value="value_desc">Value: High to Low</option>
                <option value="value_asc">Value: Low to High</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            {filtered.map((c) => (
              <CollectibleCard
                key={c.id}
                collectible={c}
                previousValue={previousValues[c.id]}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No collectibles match your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}