import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import CollectibleCard from '@/components/CollectibleCard';
import FollowButton from '@/components/social/FollowButton';
import TradeOfferModal from '@/components/social/TradeOfferModal';
import { formatCurrency } from '@/lib/format';
import { getInitials } from '@/lib/social';
import AchievementBadges from '@/components/AchievementBadges';
import { ArrowLeft, MessageCircle, ArrowLeftRight, Package, Loader2, DollarSign } from 'lucide-react';

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrade, setShowTrade] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profiles, items] = await Promise.all([
        base44.entities.CollectorProfile.filter({ user_id: userId }),
        base44.entities.Collectible.filter(
          { created_by_id: userId, privacy_status: 'public' },
          '-created_date',
          200
        ),
      ]);
      setProfile(profiles[0] || null);
      setCollectibles(items);

      if (user?.id && userId !== user.id) {
        const [myFollow, theirFollow] = await Promise.all([
          base44.entities.Follow.filter({
            follower_id: user.id,
            following_id: userId,
            status: 'active',
          }),
          base44.entities.Follow.filter({
            follower_id: userId,
            following_id: user.id,
            status: 'active',
          }),
        ]);
        setIsFriend(myFollow.length > 0 && theirFollow.length > 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.display_name || 'Collector';
  const totalValue = collectibles.reduce((s, c) => s + (c.estimated_value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="rounded-3xl bg-card border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex-shrink-0">
            {profile?.profile_photo ? (
              <Image src={profile.profile_photo} fittingType="fill" className="w-full h-full" alt={displayName} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {getInitials(displayName)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold truncate">{displayName}</h2>
            <p className="text-sm text-muted-foreground truncate">
              @{profile?.username || 'collector'}
            </p>
          </div>
        </div>
        {profile?.bio && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <Package className="w-5 h-5 text-muted-foreground mb-2" />
          <p className="font-display text-2xl font-bold">{collectibles.length}</p>
          <p className="text-xs text-muted-foreground">Public Items</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <DollarSign className="w-5 h-5 text-gold mb-2" />
          <p className="font-display text-2xl font-bold">
            {profile?.show_public_value ? formatCurrency(totalValue) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Collection Value</p>
        </div>
      </div>

      <AchievementBadges userId={userId} earnedOnly />

      {userId !== user?.id && (
        <div className="space-y-3">
          <FollowButton
            targetUserId={userId}
            targetName={displayName}
            targetPhoto={profile?.profile_photo}
            onStatusChange={loadData}
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`/chat/${userId}`)}
              disabled={!isFriend}
              className="h-11 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Message
            </button>
            <button
              onClick={() => setShowTrade(true)}
              className="h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" /> Propose Trade
            </button>
          </div>
          {!isFriend && (
            <p className="text-xs text-muted-foreground text-center">
              Messaging unlocks once you're mutual friends.
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Collection
        </h3>
        {collectibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">No public items yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collectibles.map((item) => (
              <CollectibleCard key={item.id} collectible={item} />
            ))}
          </div>
        )}
      </div>

      {showTrade && (
        <TradeOfferModal
          targetUserId={userId}
          targetName={displayName}
          onClose={() => setShowTrade(false)}
          onSubmitted={() => {
            setShowTrade(false);
            navigate('/messages');
          }}
        />
      )}
    </div>
  );
}