import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, TrendingUp, Package, Heart, ArrowLeftRight, ShieldCheck, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function CollectionBriefing({ collectibles, pricingHistory, stats, watchlistItems, achievements }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [incomingTrades, setIncomingTrades] = useState(0);
  const [healthTasks, setHealthTasks] = useState(0);

  useEffect(() => {
    loadExtraData();
  }, [user]);

  const loadExtraData = async () => {
    if (!user) return;
    try {
      const [trades] = await Promise.all([
        base44.entities.Trade.filter({ recipient_id: user.id, status: 'pending' }, '-created_date', 50),
      ]);
      setIncomingTrades(trades.length);
    } catch (err) {
      console.error(err);
    }
  };

  const dailyChange = stats?.changes?.day || 0;
  const weeklyChange = stats?.changes?.week || 0;
  const recentAdditions = collectibles.filter((c) => {
    const created = new Date(c.created_date).getTime();
    return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const briefingItems = [
    {
      icon: TrendingUp,
      label: 'Value Movement',
      value: `${dailyChange >= 0 ? '+' : ''}${formatCurrency(dailyChange)} today`,
      color: dailyChange >= 0 ? 'text-gain' : 'text-loss',
      onClick: () => navigate('/collection'),
    },
    {
      icon: Package,
      label: 'Recent Additions',
      value: `${recentAdditions} this week`,
      color: 'text-primary',
      onClick: () => navigate('/collection'),
    },
    {
      icon: Heart,
      label: 'Wishlist Items',
      value: `${watchlistItems?.length || 0} active`,
      color: 'text-primary',
      onClick: () => navigate('/watchlist'),
    },
    {
      icon: ArrowLeftRight,
      label: 'Trade Opportunities',
      value: `${incomingTrades} pending`,
      color: incomingTrades > 0 ? 'text-gold' : 'text-muted-foreground',
      onClick: () => navigate('/messages'),
    },
    {
      icon: Award,
      label: 'Achievements',
      value: `${achievements?.length || 0} earned`,
      color: 'text-gold',
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm">Collection Briefing</h3>
            <p className="text-[10px] text-muted-foreground">
              {weeklyChange >= 0 ? '+' : ''}{formatCurrency(weeklyChange)} this week
            </p>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-1.5">
          {briefingItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left"
              >
                <Icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}