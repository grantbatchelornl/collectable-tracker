import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import CollectibleCard from '@/components/CollectibleCard';
import SkeletonCard from '@/components/ui/SkeletonCard';
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
import AISmartSuggestions from '@/components/binder/AISmartSuggestions';
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
import { Plus, Package, Loader2, Eye, ChevronRight, ShieldCheck, LayoutGrid, Target, Clock, BookOpen, MapPin, Compass, Star, Sparkles } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

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
  const portfolioTimeSeries = useMemo(() => buildPortfolioTimeSeries(collectibles, pricingHistory), [collectibles, pricingHistory]);
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
      <div className="px-4 py-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4">
              <div className="w-10 h-10 rounded-xl skeleton" />
              <div className="h-3 w-12 rounded skeleton" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-20 rounded-2xl skeleton" />
          <div className="h-20 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-6">
      {collectibles.length > 0 && (
        <button
          onClick={() => navigate('/collector-ai')}
          className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center gap-3 hover:opacity-90 transition-opacity shadow-float"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold text-sm">Collector AI</p>
            <p className="text-xs opacity-80">Ask questions, find trades, analyze your collection</p>
          </div>
          <ChevronRight className="w-5 h-5 opacity-60 flex-shrink-0" />
        </button>
      )}

      {collectibles.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/collection')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Collection</span>
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Watchlist</span>
          </button>
          <button
            onClick={() => navigate('/data-quality')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Data Quality</span>
          </button>
          <button
            onClick={() => navigate('/goals')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Goals</span>
          </button>
          <button
            onClick={() => navigate('/timeline')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Timeline</span>
          </button>
          <button
            onClick={() => navigate('/binders')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Binders</span>
          </button>
          <button
            onClick={() => navigate('/conventions')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Shows</span>
          </button>
          <button
            onClick={() => navigate('/discover')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 hover:bg-accent transition-colors shadow-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Discover</span>
          </button>
          <button
            onClick={() => navigate('/founding-collectors')}
            className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20 p-4 hover:bg-accent transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium">Founders</span>
          </button>
        </div>
      )}

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
        <CollectionBriefing collectibles={collectibles} pricingHistory={pricingHistory} stats={stats} watchlistItems={watchlistItems} achievements={achievements} />
      )}

      {collectibles.length > 0 && (
        <CollectorScoreCard scoreData={collectorScore} />
      )}

      {collectibles.length > 0 && (
        <AISmartSuggestions collectibles={collectibles} />
      )}

      {collectibles.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Start Your Collection"
          description="Scan or add your first collectible to start tracking its value over time."
          actionLabel="Add Collectible"
          onAction={() => navigate('/add')}
        />
      ) : (
        <>
          {pricingHistory.length > 1 && (
            <div className="rounded-2xl bg-card border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Portfolio Value Over Time</h3>
              <PortfolioChart data={portfolioTimeSeries} />
            </div>
          )}

          {highestValue.length > 0 && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">Highest Value</h2>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
                {highestValue.map((c, idx) => (
                  <div key={c.id} className="w-40 flex-shrink-0">
                    <CollectibleCard collectible={c} index={idx} />
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
                {recentAdditions.map((c, idx) => (
                  <div key={c.id} className="w-40 flex-shrink-0">
                    <CollectibleCard collectible={c} index={idx} />
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