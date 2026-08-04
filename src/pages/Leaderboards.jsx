import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getLeaderboard, getFriends, LEADERBOARD_SECTIONS, LEADERBOARD_TIMEFRAMES } from '@/lib/leaderboard';
import LeaderboardEntry from '@/components/leaderboard/LeaderboardEntry';
import LeaderboardPrivacyPanel from '@/components/leaderboard/LeaderboardPrivacyPanel';
import { ArrowLeft, Loader2, Trophy, Globe, Users, Lock, ChevronDown, ChevronUp } from 'lucide-react';

export default function Leaderboards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [friendIds, setFriendIds] = useState([]);
  const [scope, setScope] = useState('global');
  const [sectionKey, setSectionKey] = useState('overall');
  const [metricKey, setMetricKey] = useState('total_value');
  const [entries, setEntries] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [timeframe, setTimeframe] = useState('all_time');

  const currentSection = LEADERBOARD_SECTIONS.find((s) => s.key === sectionKey);
  const currentMetric = currentSection?.metrics.find((m) => m.key === metricKey);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    loadLeaderboard();
  }, [sectionKey, metricKey, scope, friendIds, profile, timeframe]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      const p = profiles[0] || null;
      setProfile(p);
      const friends = await getFriends(user.id);
      setFriendIds(friends);
      if (friends.length > 0 && (!p || (!p.leaderboard_scope || p.leaderboard_scope === 'hidden'))) {
        setScope('friends');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(sectionKey, metricKey, scope, friendIds, user?.id, timeframe);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const effectiveScope = profile?.leaderboard_scope || (profile?.leaderboard_opt_in ? 'global_friends' : 'hidden');
  const isParticipating = effectiveScope !== 'hidden';
  const hasFriends = friendIds.length > 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-gold" /> Leaderboards
          </h1>
          <p className="text-xs text-muted-foreground">Verified sold values only · Manual values excluded</p>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="rounded-2xl bg-card border border-border">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full p-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium">Leaderboard Privacy</span>
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSettings && (
          <div className="px-3 pb-3">
            <LeaderboardPrivacyPanel profile={profile} onUpdate={setProfile} />
          </div>
        )}
      </div>

      {/* Not participating message */}
      {!isParticipating && (
        <div className="rounded-2xl bg-gold/5 border border-gold/20 p-4 text-center">
          <Lock className="w-8 h-8 text-gold mx-auto mb-2" />
          <p className="text-sm font-medium">You're not on any leaderboard</p>
          <p className="text-xs text-muted-foreground mt-1">
            Choose a participation level above to compete with other collectors.
          </p>
        </div>
      )}

      {/* View mode toggle */}
      {isParticipating && (
        <div className="flex gap-2">
          <button
            onClick={() => setScope('global')}
            className={`flex-1 h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              scope === 'global' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <Globe className="w-4 h-4" /> Global
          </button>
          <button
            onClick={() => setScope('friends')}
            disabled={!hasFriends}
            className={`flex-1 h-10 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              scope === 'friends' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            } ${!hasFriends ? 'opacity-40' : ''}`}
          >
            <Users className="w-4 h-4" /> Friends ({friendIds.length})
          </button>
        </div>
      )}

      {/* Timeframe selector */}
      {isParticipating && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
          {LEADERBOARD_TIMEFRAMES.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                timeframe === tf.key ? 'bg-accent text-accent-foreground border border-primary/30' : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              {tf.icon} {tf.label}
            </button>
          ))}
        </div>
      )}

      {/* Section tabs */}
      {isParticipating && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
          {LEADERBOARD_SECTIONS.map((sec) => (
            <button
              key={sec.key}
              onClick={() => {
                setSectionKey(sec.key);
                setMetricKey(sec.metrics[0].key);
              }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                sectionKey === sec.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span>{sec.icon}</span> {sec.label}
            </button>
          ))}
        </div>
      )}

      {/* Metric selector */}
      {isParticipating && currentSection && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
          {currentSection.metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetricKey(m.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                metricKey === m.key ? 'bg-accent text-accent-foreground border border-primary/30' : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Rankings */}
      {isParticipating && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {scope === 'friends'
                ? hasFriends ? 'No friends on this leaderboard yet.' : 'Add friends to compete!'
                : 'No collectors on this leaderboard yet.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add public items with verified values to compete!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <LeaderboardEntry
                key={entry.userId}
                entry={entry}
                isMe={entry.userId === user?.id}
                isFriend={friendIds.includes(entry.userId)}
                metricType={currentMetric?.type}
              />
            ))}
          </div>
        )
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Rankings use only verified sold-price data. Manual values are never counted.
      </p>
    </div>
  );
}