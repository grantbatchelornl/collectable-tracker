import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import ReputationBadge from '@/components/trade/ReputationBadge';
import TradeWindow from '@/components/trade/TradeWindow';
import { formatCurrency } from '@/lib/format';
import { ArrowLeft, Loader2, Package, Heart, ArrowLeftRight, Sparkles } from 'lucide-react';

export default function TradeBinder() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tradeItems, setTradeItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [myBinder, setMyBinder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrade, setShowTrade] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    try {
      const [profileRes, items] = await Promise.all([
        base44.functions.invoke('getPublicProfile', { targetUserId: userId }),
        base44.entities.Collectible.filter({ created_by_id: userId, is_deleted: false }, '-estimated_value', 500),
      ]);
      const profileData = profileRes.data || profileRes;
      setProfile(profileData.profile || null);
      setTradeItems(items.filter((c) => c.trade_status === 'trade' || c.trade_status === 'sell'));

      const wishlists = await base44.entities.Watchlist.filter({ user_id: userId, status: 'active' });
      setWishlist(wishlists);

      if (user && userId !== user.id) {
        const myItems = await base44.entities.Collectible.filter({ created_by_id: user.id, is_deleted: false }, '-estimated_value', 500);
        setMyBinder(myItems.filter((c) => c.trade_status === 'trade' || c.trade_status === 'sell'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayName = profile?.display_name || 'Collector';
  const totalValue = tradeItems.reduce((s, c) => s + (c.estimated_value || 0), 0);

  return (
    <div className="pb-4">
      <div className="relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/collector-ai?context=Viewing trade binder for: ${displayName}`)}
            className="w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
            title="Ask Collector AI about trades"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border bg-muted flex-shrink-0">
            {profile?.profile_photo ? (
              <Image src={profile.profile_photo} fittingType="fill" className="w-full h-full" alt={displayName} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold truncate">{displayName}</h1>
            <p className="text-xs text-muted-foreground">{tradeItems.length} trade items · {formatCurrency(totalValue)}</p>
          </div>
        </div>

        <ReputationBadge profile={profile} />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm font-bold">Trade Binder</h2>
          </div>
          {tradeItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No items in trade binder</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tradeItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/collectible/${item.id}`)}
                  className="text-left"
                >
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="aspect-square overflow-hidden bg-muted">
                      {item.primary_photo_url && (
                        <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.item_name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatCurrency(item.estimated_value)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {wishlist.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-loss" />
              <h2 className="font-display text-sm font-bold">Wishlist</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {wishlist.map((w) => (
                <span key={w.id} className="text-xs bg-accent rounded-full px-3 py-1">
                  {w.item_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {user && userId !== user.id && myBinder.length > 0 && (
          <Button
            onClick={() => setShowTrade(true)}
            className="w-full h-12"
          >
            <ArrowLeftRight className="w-4 h-4" /> Propose Trade
          </Button>
        )}
      </div>

      {showTrade && (
        <TradeWindow
          user={user}
          match={{
            partnerId: userId,
            partnerName: displayName,
            partnerPhoto: profile?.profile_photo,
            theirItems: tradeItems,
            myItems: myBinder,
          }}
          onClose={() => setShowTrade(false)}
          onSent={() => { setShowTrade(false); navigate('/messages'); }}
        />
      )}
    </div>
  );
}