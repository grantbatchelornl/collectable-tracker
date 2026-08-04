import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import CollectibleCard from '@/components/CollectibleCard';
import { Search, Loader2, Package, Plus } from 'lucide-react';

export default function Collection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collectibles, setCollectibles] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showForSale, setShowForSale] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, history, cats] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 200),
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
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    return result;
  }, [collectibles, search, activeCategory, sortBy, showForSale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (collectibles.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">No Collectibles Yet</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
          Scan or add your first collectible to start building your collection.
        </p>
        <button
          onClick={() => navigate('/add')}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium"
        >
          <Plus className="w-5 h-5" /> Add Collectible
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <h1 className="font-display text-xl font-bold">Collection</h1>

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
            showForSale ? 'bg-gold text-white' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          For Sale
        </button>
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              activeCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} items</p>
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

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((c) => (
          <CollectibleCard key={c.id} collectible={c} previousValue={previousValues[c.id]} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No collectibles match your filters.
        </div>
      )}
    </div>
  );
}