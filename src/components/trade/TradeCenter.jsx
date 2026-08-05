import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { findTradeMatches, getWishlistMatches, getPublicTradeBinders, getTradeBinder } from '@/lib/tradeCenter';
import TradeMatchCard from '@/components/trade/TradeMatchCard';
import TradeWindow from '@/components/trade/TradeWindow';
import { Image } from '@/components/ui/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { Loader2, Handshake, Search, Package, Heart, Sparkles, ChevronRight } from 'lucide-react';

const SUB_TABS = [
  { key: 'matches', label: 'Matches', icon: Sparkles },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'browse', label: 'Browse', icon: Search },
  { key: 'binder', label: 'My Binder', icon: Package },
];

export default function TradeCenter() {
  const { user } = useAuth();
  const [subTab, setSubTab] = useState('matches');
  const [tradeMatches, setTradeMatches] = useState([]);
  const [wishlistMatches, setWishlistMatches] = useState([]);
  const [binders, setBinders] = useState([]);
  const [myBinder, setMyBinder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeWindow, setTradeWindow] = useState(null);

  useEffect(() => {
    loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [matches, wishlist, publicBinders, binder] = await Promise.all([
        findTradeMatches(user.id),
        getWishlistMatches(user.id),
        getPublicTradeBinders(user.id),
        getTradeBinder(user.id),
      ]);
      setTradeMatches(matches);
      setWishlistMatches(wishlist);
      setBinders(publicBinders);
      setMyBinder(binder);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateTradeStatus = async (collectibleId, status) => {
    try {
      await base44.entities.Collectible.update(collectibleId, { trade_status: status });
      setMyBinder((prev) => prev.filter((c) => c.id !== collectibleId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Handshake className="w-5 h-5 text-primary" />
          <h2 className="font-display font-bold text-lg">Trade Center</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {tradeMatches.length} potential matches · {wishlistMatches.length} wishlist matches · {binders.length} public binders
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              subTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'matches' && (
        <div className="space-y-3">
          {tradeMatches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No Trade Matches Yet"
              desc="Add items to your Trade Binder and Wishlist to find potential trade partners. The AI will automatically match you with collectors who have what you want."
            />
          ) : (
            tradeMatches.map((match) => (
              <TradeMatchCard
                key={match.partnerId}
                match={match}
                onOpenTrade={() => setTradeWindow(match)}
              />
            ))
          )}
        </div>
      )}

      {subTab === 'wishlist' && (
        <div className="space-y-3">
          {wishlistMatches.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No Wishlist Matches"
              desc="Add items to your Watchlist. When another collector lists one for trade, you'll see it here."
            />
          ) : (
            wishlistMatches.map((wm, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-3">
                <p className="text-sm font-medium mb-2">You want: {wm.wishlist.item_name}</p>
                <div className="space-y-2">
                  {wm.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTradeWindow({
                        partnerId: wm.sellerId,
                        theirItems: [item],
                        myItems: myBinder,
                        wishlistMatches: [wm.wishlist],
                      })}
                      className="w-full text-left rounded-xl bg-muted/50 p-2 flex items-center gap-2 hover:bg-accent"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                        {item.primary_photo_url && (
                          <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{item.item_name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatCurrency(item.estimated_value)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'browse' && (
        <div className="space-y-3">
          {binders.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No Public Trade Binders"
              desc="When collectors mark items as Trade and set them to Public, their trade binders will appear here."
            />
          ) : (
            binders.map((binder) => (
              <button
                key={binder.userId}
                onClick={() => setTradeWindow({
                  partnerId: binder.userId,
                  partnerName: binder.displayName,
                  partnerPhoto: binder.profilePhoto,
                  theirItems: binder.items,
                  myItems: myBinder,
                  wishlistMatches: [],
                })}
                className="w-full text-left rounded-2xl bg-card border border-border p-3 flex items-center gap-3 hover:bg-accent"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                  {binder.profilePhoto ? (
                    <Image src={binder.profilePhoto} fittingType="fill" className="w-full h-full" alt={binder.displayName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {binder.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{binder.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{binder.items.length} trade items · {formatCurrency(binder.totalValue)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      )}

      {subTab === 'binder' && (
        <div className="space-y-3">
          {myBinder.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Your Trade Binder is Empty"
              desc="Mark collectibles as 'Trade' or 'Sell' from their detail page to add them to your Trade Binder."
            />
          ) : (
            myBinder.map((item) => (
              <div key={item.id} className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted flex-shrink-0">
                  {item.primary_photo_url && (
                    <Image src={item.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.item_name} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.estimated_value)}</p>
                </div>
                <Select value={item.trade_status} onValueChange={(v) => updateTradeStatus(item.id, v)}>
                  <SelectTrigger className="h-8 w-[88px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trade">Trade</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                    <SelectItem value="keep">Remove</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>
      )}

      {tradeWindow && (
        <TradeWindow
          user={user}
          match={tradeWindow}
          onClose={() => setTradeWindow(null)}
          onSent={() => { setTradeWindow(null); loadAll(); }}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-3">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto">{desc}</p>
    </div>
  );
}