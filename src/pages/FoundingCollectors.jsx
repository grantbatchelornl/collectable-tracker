import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import FoundingBadge from '@/components/FoundingBadge';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Crown,
  Users,
  Check,
  Star,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/format';

export default function FoundingCollectors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [founding, setFounding] = useState([]);
  const [myRecord, setMyRecord] = useState(null);
  const [optingIn, setOptingIn] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState('founding_collector');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        base44.entities.FoundingCollector.list('-created_date', 500),
        user ? base44.entities.FoundingCollector.filter({ user_id: user.id }) : Promise.resolve([]),
      ]);
      setFounding(all);
      setMyRecord(mine[0] || null);
      if (mine[0]) {
        setSelectedBadge(mine[0].badge_type);
        setMessage(mine[0].message || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async () => {
    setOptingIn(true);
    try {
      if (myRecord) {
        const updated = await base44.entities.FoundingCollector.update(myRecord.id, {
          badge_type: selectedBadge,
          message: message || undefined,
        });
        setMyRecord(updated);
      } else {
        const created = await base44.entities.FoundingCollector.create({
          user_id: user.id,
          display_name: user.display_name || user.full_name || 'Collector',
          username: user.username || '',
          profile_photo: user.profile_photo || '',
          badge_type: selectedBadge,
          message: message || undefined,
          joined_date: user.created_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        });
        setMyRecord(created);
      }
      await loadData();
    } catch (err) {
      console.error('Opt-in failed', err);
    } finally {
      setOptingIn(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'COLLECTABLE Tracker — Founding Collectors',
          text: 'I\'m a Founding Collector on COLLECTABLE Tracker! Join and start tracking your collection.',
          url,
        });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (e) {}
    }
  };

  const creators = founding.filter((f) => f.badge_type === 'founding_creator');
  const collectors = founding.filter((f) => f.badge_type === 'founding_collector');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Hero */}
      <div className="relative -mx-4 overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-amber-500 px-4 pt-16 pb-8 text-white">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 fill-white text-white" />
          </div>
          <h1 className="font-display text-2xl font-extrabold mb-2">Founding Collectors</h1>
          <p className="text-sm text-white/90">
            The collectors who believed in COLLECTABLE Tracker from the very beginning. These badges
            stay on profiles forever.
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Opt-in card */}
        {user && !myRecord && (
          <div className="rounded-2xl bg-card border-2 border-primary/30 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-base">Claim Your Founding Badge</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              You joined during beta — you're eligible for a permanent Founding badge on your profile.
              Choose your badge type below.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedBadge('founding_collector')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                  selectedBadge === 'founding_collector'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Founding Collector</p>
                  <p className="text-xs text-muted-foreground">For collectors who joined during beta</p>
                </div>
                {selectedBadge === 'founding_collector' && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </button>
              <button
                onClick={() => setSelectedBadge('founding_creator')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                  selectedBadge === 'founding_creator'
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-amber-950" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Founding Creator</p>
                  <p className="text-xs text-muted-foreground">For content creators in the collecting space</p>
                </div>
                {selectedBadge === 'founding_creator' && (
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Personal message (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What does collecting mean to you?"
                className="w-full min-h-[72px] p-3 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                maxLength={200}
              />
            </div>
            <Button onClick={handleOptIn} disabled={optingIn} className="w-full h-12">
              {optingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Claiming...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" /> Claim Founding Badge
                </>
              )}
            </Button>
          </div>
        )}

        {/* Already opted in — manage */}
        {user && myRecord && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-gain" />
                <h2 className="font-display font-bold text-base">You're a Founding Member!</h2>
              </div>
              <FoundingBadge badgeType={myRecord.badge_type} size="lg" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your badge is permanently displayed on your profile. You can update your badge type or
              message below.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedBadge('founding_collector')}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                  selectedBadge === 'founding_collector' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                }`}
              >
                <Users className="w-4 h-4" /> Collector
              </button>
              <button
                onClick={() => setSelectedBadge('founding_creator')}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                  selectedBadge === 'founding_creator' ? 'border-amber-500 bg-amber-500/5 text-amber-600' : 'border-border text-muted-foreground'
                }`}
              >
                <Crown className="w-4 h-4" /> Creator
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What does collecting mean to you?"
              className="w-full min-h-[72px] p-3 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              maxLength={200}
            />
            <Button onClick={handleOptIn} disabled={optingIn} variant="outline" className="w-full h-10">
              {optingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Badge'}
            </Button>
            <Button onClick={handleShare} variant="ghost" className="w-full h-10 text-sm">
              <Share2 className="w-4 h-4" /> Share Your Badge
            </Button>
          </div>
        )}

        {/* Founding Creators */}
        {creators.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="font-display font-bold text-lg">Founding Creators</h2>
              <span className="text-xs text-muted-foreground">({creators.length})</span>
            </div>
            <div className="space-y-2">
              {creators.map((f) => (
                <FounderCard key={f.id} founder={f} navigate={navigate} />
              ))}
            </div>
          </section>
        )}

        {/* Founding Collectors */}
        {collectors.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold text-lg">Founding Collectors</h2>
              <span className="text-xs text-muted-foreground">({collectors.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {collectors.map((f) => (
                <FounderGridCard key={f.id} founder={f} navigate={navigate} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {founding.length === 0 && !user && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Be the First</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Sign in to claim your Founding Collector badge and be listed here forever.
            </p>
            <Button onClick={() => navigate('/login')} className="rounded-full px-6">
              Sign In
            </Button>
          </div>
        )}

        {founding.length === 0 && user && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No founding members yet — be the first to claim your badge above!
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="rounded-2xl bg-accent/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            🌟 Founding badges are permanent and displayed on your profile forever. They recognize your
            early support during the beta period.
          </p>
        </div>
      </div>
    </div>
  );
}

function FounderCard({ founder, navigate }) {
  return (
    <button
      onClick={() => navigate(`/collector/${founder.user_id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:bg-accent transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/30 bg-muted flex-shrink-0">
        {founder.profile_photo ? (
          <Image src={founder.profile_photo} fittingType="fill" className="w-full h-full" alt={founder.display_name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
            {founder.display_name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm truncate">{founder.display_name}</p>
          <FoundingBadge badgeType={founder.badge_type} />
        </div>
        {founder.username && (
          <p className="text-xs text-muted-foreground truncate">@{founder.username}</p>
        )}
        {founder.message && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{founder.message}</p>
        )}
      </div>
      <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

function FounderGridCard({ founder, navigate }) {
  return (
    <button
      onClick={() => navigate(`/collector/${founder.user_id}`)}
      className="text-left"
    >
      <div className="rounded-2xl bg-card border border-border p-3 hover:bg-accent transition-colors">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-muted mx-auto mb-2">
          {founder.profile_photo ? (
            <Image src={founder.profile_photo} fittingType="fill" className="w-full h-full" alt={founder.display_name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">
              {founder.display_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <p className="font-semibold text-xs text-center truncate">{founder.display_name}</p>
        {founder.username && (
          <p className="text-[10px] text-muted-foreground text-center truncate">@{founder.username}</p>
        )}
      </div>
    </button>
  );
}