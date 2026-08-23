import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/format';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Plus, Calendar } from 'lucide-react';

const TIME_OPTIONS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '1m', label: '1 Month Ago', days: 30 },
  { key: '3m', label: '3 Months Ago', days: 90 },
  { key: '6m', label: '6 Months Ago', days: 180 },
  { key: '1y', label: '1 Year Ago', days: 365 },
];

export default function TimeMachine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collectibles, setCollectibles] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, history, snaps] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 500),
        base44.entities.PricingHistory.filter({ created_by_id: user.id }, '-created_date', 2000),
        base44.entities.CollectionValueSnapshot.filter({ created_by_id: user.id }, '-created_date', 100),
      ]);
      setCollectibles(items.filter((c) => !c.is_deleted));
      setPricingHistory(history);
      setSnapshots(snaps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const snapshot = useMemo(() => {
    const option = TIME_OPTIONS.find((o) => o.key === selectedPeriod);
    if (!option) return null;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - option.days);

    // Get collectibles that existed at the target date
    const existingAtDate = collectibles.filter(
      (c) => new Date(c.created_date) <= targetDate
    );

    // Get pricing at the target date for each collectible
    const itemsAtDate = existingAtDate.map((c) => {
      const history = pricingHistory
        .filter((h) => h.collectible_id === c.id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      let value = 0;
      for (const h of history) {
        if (new Date(h.created_date) <= targetDate) {
          value = h.estimated_value;
        } else break;
      }
      return { ...c, historical_value: value };
    });

    const totalValue = itemsAtDate.reduce((sum, i) => sum + (i.historical_value || 0), 0);

    // Find new additions since that date
    const newAdditions = collectibles.filter(
      (c) => new Date(c.created_date) > targetDate
    );

    // Find biggest movers (compare historical value to current value)
    const movers = itemsAtDate
      .map((i) => {
        const currentValue = i.estimated_value || 0;
        const histValue = i.historical_value || 0;
        const change = currentValue - histValue;
        const pctChange = histValue > 0 ? (change / histValue) * 100 : 0;
        return { ...i, change, pctChange, currentValue, histValue };
      })
      .filter((i) => i.change !== 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5);

    // Find closest snapshot
    const closestSnapshot = snapshots
      .filter((s) => new Date(s.created_date) <= targetDate)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    return {
      date: targetDate,
      totalValue,
      itemCount: itemsAtDate.length,
      items: itemsAtDate,
      newAdditions,
      movers,
      snapshot: closestSnapshot,
    };
  }, [selectedPeriod, collectibles, pricingHistory, snapshots]);

  const currentValue = useMemo(
    () => collectibles.reduce((sum, c) => sum + (c.estimated_value || 0), 0),
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
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Time Machine</h1>
          <p className="text-xs text-muted-foreground">View your collection at any point in time</p>
        </div>
      </div>

      {/* Time period selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelectedPeriod(opt.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${
              selectedPeriod === opt.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {snapshot && (
        <>
          {/* Value comparison */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">
                {snapshot.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground">Value Then</p>
                <p className="font-display text-lg font-bold">{formatCurrency(snapshot.totalValue)}</p>
                <p className="text-[10px] text-muted-foreground">{snapshot.itemCount} items</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground">Value Now</p>
                <p className="font-display text-lg font-bold">{formatCurrency(currentValue)}</p>
                <p className="text-[10px] text-muted-foreground">{collectibles.length} items</p>
              </div>
            </div>
            {snapshot.totalValue > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-card border border-border p-3">
                <span className="text-xs text-muted-foreground">Change</span>
                <span className={`text-sm font-bold flex items-center gap-1 ${
                  currentValue - snapshot.totalValue >= 0 ? 'text-gain' : 'text-loss'
                }`}>
                  {currentValue - snapshot.totalValue >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {currentValue - snapshot.totalValue >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(currentValue - snapshot.totalValue))}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({((Math.abs(currentValue - snapshot.totalValue) / snapshot.totalValue) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Biggest movers */}
          {snapshot.movers.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display text-sm font-bold">Biggest Movers</h2>
              {snapshot.movers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/collectible/${m.id}`)}
                  className="w-full flex items-center gap-3 rounded-xl bg-card border border-border p-2.5"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {m.primary_photo_url && (
                      <Image src={m.primary_photo_url} fittingType="fill" className="w-full h-full" alt={m.item_name} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-medium truncate">{m.item_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatCurrency(m.histValue)} → {formatCurrency(m.currentValue)}
                    </p>
                  </div>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${m.change >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {m.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {m.pctChange >= 0 ? '+' : ''}{m.pctChange.toFixed(1)}%
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* New additions since that date */}
          {snapshot.newAdditions.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display text-sm font-bold flex items-center gap-1">
                <Plus className="w-4 h-4 text-gain" /> Added Since ({snapshot.newAdditions.length})
              </h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {snapshot.newAdditions.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/collectible/${c.id}`)}
                    className="w-24 flex-shrink-0"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden border border-border">
                      {c.primary_photo_url ? (
                        <Image src={c.primary_photo_url} fittingType="fill" className="w-full h-full" alt={c.item_name} />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <p className="text-[10px] truncate mt-1">{c.item_name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}