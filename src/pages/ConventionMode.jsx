import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  toggleConventionMode,
  getNearbyCollectors,
  getCurrentLocation,
  generateTradeBinderQR,
  calculateDistance,
} from '@/lib/conventionMode';
import { getTradeHistory } from '@/lib/tradeHistory';
import { Image } from '@/components/ui/image';
import ReputationBadge from '@/components/trade/ReputationBadge';
import { formatCurrency } from '@/lib/format';
import {
  ArrowLeft,
  MapPin,
  QrCode,
  Loader2,
  Power,
  Navigation,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Users,
  ChevronRight,
  Repeat,
  Heart,
} from 'lucide-react';

export default function ConventionMode() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [conventionName, setConventionName] = useState('');
  const [nearby, setNearby] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [tradeHistory, setTradeHistory] = useState(null);
  const [binderMode, setBinderMode] = useState('trade');

  useEffect(() => {
    loadProfile();
    loadTradeHistory();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        setActive(profiles[0].convention_mode_active);
        setConventionName(profiles[0].convention_name || '');
        if (profiles[0].convention_mode_active) {
          loadNearby(user.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTradeHistory = async () => {
    if (!user) return;
    try {
      const history = await getTradeHistory(user.id);
      setTradeHistory(history);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNearby = async (userId) => {
    try {
      const collectors = await getNearbyCollectors(userId);
      setNearby(collectors);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    setLocationError('');
    try {
      if (!active) {
        const location = await getCurrentLocation();
        const updated = await toggleConventionMode(user.id, true, location, conventionName);
        setProfile(updated);
        setActive(true);
        loadNearby(user.id);
      } else {
        const updated = await toggleConventionMode(user.id, false);
        setProfile(updated);
        setActive(false);
        setNearby([]);
      }
    } catch (e) {
      setLocationError(e.message || 'Could not get location. Please enable location services.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const qr = generateTradeBinderQR(user?.id);
  const stats = tradeHistory?.stats;

  return (
    <div className="px-4 py-4 pb-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Convention Mode</h1>
          <p className="text-xs text-muted-foreground">Find collectors and trade at shows</p>
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${active ? 'bg-gain/5 border-gain/30' : 'bg-card border-border'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Power className={`w-5 h-5 ${active ? 'text-gain' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-sm font-medium">Convention Mode</p>
              <p className="text-[10px] text-muted-foreground">
                {active ? 'Broadcasting to nearby collectors' : 'Off — turn on at a show'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${active ? 'bg-gain' : 'bg-muted'}`}
          >
            {toggling ? (
              <Loader2 className="absolute top-1 left-1 w-5 h-5 animate-spin" />
            ) : (
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            )}
          </button>
        </div>
        {active && (
          <input
            type="text"
            value={conventionName}
            onChange={(e) => setConventionName(e.target.value)}
            placeholder="What show are you at? (e.g., Collect-A-Con)"
            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2"
          />
        )}
        {locationError && (
          <p className="text-xs text-loss mt-2">{locationError}</p>
        )}
      </div>

      {active && (
        <>
          <div className="rounded-2xl bg-card border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold">
                {binderMode === 'trade' ? 'Trade Binder QR' : 'Wishlist QR'}
              </p>
            </div>
            {/* Binder mode toggle */}
            <div className="flex gap-2 mb-3 justify-center">
              <button
                onClick={() => setBinderMode('trade')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                  binderMode === 'trade' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Repeat className="w-3 h-3" /> Trade Binder
              </button>
              <button
                onClick={() => setBinderMode('wishlist')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${
                  binderMode === 'wishlist' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Heart className="w-3 h-3" /> Wishlist
              </button>
            </div>
            <div className="inline-block rounded-2xl bg-white p-3 border border-border">
              <img src={qr.qrImageUrl} alt={binderMode === 'trade' ? 'Trade Binder QR' : 'Wishlist QR'} className="w-48 h-48" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              {binderMode === 'trade'
                ? 'Have someone scan this to instantly open your Trade Binder — perfect for shows.'
                : 'Have someone scan this to see what you\'re looking for — they might have it!'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm font-bold">Nearby Collectors</h2>
              <span className="text-xs text-muted-foreground">({nearby.length})</span>
            </div>
            {nearby.length === 0 ? (
              <div className="text-center py-8 rounded-2xl bg-card border border-border">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No collectors nearby yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nearby.map((collector) => (
                  <button
                    key={collector.user_id}
                    onClick={() => navigate(`/trade-binder/${collector.user_id}`)}
                    className="w-full text-left rounded-2xl bg-card border border-border p-3 flex items-center gap-3 hover:bg-accent"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                      {collector.profile_photo ? (
                        <Image src={collector.profile_photo} fittingType="fill" className="w-full h-full" alt={collector.display_name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {(collector.display_name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{collector.display_name || 'Collector'}</p>
                        {collector.is_verified_trader && (
                          <span className="text-[9px] bg-primary/10 text-primary rounded-full px-1 py-0.5 font-bold">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {collector.distance < 1 ? '<1' : Math.round(collector.distance)} mi
                        </span>
                        {collector.trade_review_count > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-gold" />
                            {collector.trade_reputation_score?.toFixed(1)} ({collector.trade_review_count})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {stats && stats.totalTrades > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm font-bold">Trade History</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Completed</p>
              <p className="font-display text-lg font-bold">{stats.totalTrades}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Value In</p>
              <p className="font-display text-lg font-bold text-gain flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3 h-3" />{formatCurrency(stats.valueGained)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Value Out</p>
              <p className="font-display text-lg font-bold text-loss flex items-center justify-center gap-0.5">
                <TrendingDown className="w-3 h-3" />{formatCurrency(stats.valueLost)}
              </p>
            </div>
          </div>
          {tradeHistory?.favoritePartners?.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Favorite Partners</p>
              <div className="flex flex-wrap gap-1.5">
                {tradeHistory.favoritePartners.map((p) => (
                  <span key={p.id} className="text-xs bg-accent rounded-full px-2 py-0.5">
                    {p.name} ({p.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ReputationBadge profile={profile} />
    </div>
  );
}