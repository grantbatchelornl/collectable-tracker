import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import CollectibleCard from '@/components/CollectibleCard';
import PortfolioSummary from '@/components/PortfolioSummary';
import RawGradedBreakdown from '@/components/RawGradedBreakdown';
import RecentPriceChanges from '@/components/RecentPriceChanges';
import PortfolioChart from '@/components/PortfolioChart';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import TopMovers from '@/components/TopMovers';
import WishlistActivity from '@/components/WishlistActivity';
import AchievementProgress from '@/components/AchievementProgress';
import CollectionBriefing from '@/components/CollectionBriefing';
import CollectorScoreCard from '@/components/CollectorScoreCard';
import { computeCollectorScore } from '@/lib/collectorScore';
import {
  buildPortfolioTimeSeries,
  getCategoryBreakdown,
  getTopMovers,
  getVerifiedManualSplit,
  getRawGradedBreakdown,
  getRecentPriceChanges,
  getPurchaseStats,
} from '@/lib/portfolio';
import { Plus, Package, Loader2, Eye, ChevronRight, ShieldCheck, LayoutGrid } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collectibles, setCollectibles] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, history, cats, watchlist, badges, tradeData] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 200),
        base44.entities.PricingHistory.list('-created_date', 500),
        base44.entities.CollectibleCategory.list('sort_order', 50),
        base44.entities.Watchlist.filter({ user_id: user.id, status: 'active' }, '-created_date', 5),
        base44.entities.Achievement.filter({ user_id: user.id }, '-created_date', 10),
        base44.entities.Trade.filter({ recipient_id: user.id }, '-created_date', 50),
      ]);
      setCollectibles(items.filter((c) => !c.is_deleted));
      setPricingHistory(history);
      setCategories(cats.filter((c) => c.active));
      setWatchlistItems(watchlist);
      setAchievements(badges);
      setTrades(tradeData);
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

  const verifiedManual = useMemo(() => getVerifiedManualSplit(collectibles), [collectibles]);
  const rawGraded = useMemo(() => getRawGradedBreakdown(collectibles), [collectibles]);
  const recentChanges = useMemo(() => getRecentPriceChanges(pricingHistory, collectibles), [pricingHistory, collectibles]);
  const purchaseStats = useMemo(() => getPurchaseStats(collectibles), [collectibles]);
  const staleCount = useMemo(() => collectibles.filter((c) => c.is_stale).length, [collectibles]);
  const collectorScore = useMemo(() => computeCollectorScore(collectibles, pricingHistory, achievements, trades), [collectibles, pricingHistory, achievements, trades]);

  const highestValue = useMemo(
    () =>
      [...collectibles]
        .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
        .slice(0, 6),
    [collectibles]
  );

  const recentAdditions = useMemo(
    () =>
      [...collectibles]
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5),
    [collectibles]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <PortfolioSummary
        totalValue={stats.totalValue}
        verifiedValue={verifiedManual.verified}
        manualValue={verifiedManual.manual}
        purchaseCost={purchaseStats.totalCost}
        changes={stats.changes}
        count={stats.count}
        staleCount={staleCount}
      />

      {collectibles.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/collection')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Collection</span>
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Watchlist</span>
          </button>
          <button
            onClick={() => navigate('/data-quality')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Data Quality</span>
          </button>
        </div>
      )}

      {collectibles.length > 0 && (
        <CollectionBriefing collectibles={collectibles} pricingHistory={pricingHistory} stats={stats} watchlistItems={watchlistItems} achievements={achievements} />
      )}

      {collectibles.length > 0 && (
        <CollectorScoreCard scoreData={collectorScore} />
      )}

      {collectibles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Start Your Collection</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Scan or add your first collectible to start tracking its value over time.
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
          {pricingHistory.length > 1 && (
            <div className="rounded-2xl bg-card border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Portfolio Value Over Time</h3>
              <PortfolioChart data={buildPortfolioTimeSeries(collectibles, pricingHistory)} />
            </div>
          )}

          {highestValue.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">Highest Value</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                {highestValue.map((c) => (
                  <div key={c.id} className="w-40 flex-shrink-0">
                    <CollectibleCard collectible={c} />
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

          <RawGradedBreakdown
            rawValue={rawGraded.rawValue}
            gradedValue={rawGraded.gradedValue}
            rawCount={rawGraded.rawCount}
            gradedCount={rawGraded.gradedCount}
          />

          <RecentPriceChanges changes={recentChanges} />

          <WishlistActivity items={watchlistItems} />

          <AchievementProgress achievements={achievements} />

          {recentAdditions.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-lg">Recent Additions</h2>
                <button
                  onClick={() => navigate('/collection')}
                  className="text-xs text-primary font-medium flex items-center gap-0.5"
                >
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                {recentAdditions.map((c) => (
                  <div key={c.id} className="w-40 flex-shrink-0">
                    <CollectibleCard collectible={c} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            onClick={() => navigate('/collection')}
            className="w-full h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-5 h-5" /> View Full Collection
          </button>
        </>
      )}
    </div>
  );
}