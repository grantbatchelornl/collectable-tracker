import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getLeagueMembers, getLeagueFeed, getLeagueChallenges, createChallenge } from '@/lib/league';
import { getLeaderboard, LEADERBOARD_SECTIONS, LEADERBOARD_TIMEFRAMES } from '@/lib/leaderboard';
import LeagueFeed from '@/components/league/LeagueFeed';
import LeaderboardEntry from '@/components/leaderboard/LeaderboardEntry';
import { Image } from '@/components/ui/image';
import { formatRelativeDate } from '@/lib/format';
import { ArrowLeft, Users, Loader2, Trophy, Activity, Target, Crown, Plus, X, Copy, Check } from 'lucide-react';

const TABS = [
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'feed', label: 'Feed', icon: Activity },
  { key: 'challenges', label: 'Challenges', icon: Target },
  { key: 'members', label: 'Members', icon: Users },
];

export default function LeagueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('leaderboard');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [sectionKey, setSectionKey] = useState('overall');
  const [metricKey, setMetricKey] = useState('total_value');
  const [timeframe, setTimeframe] = useState('all_time');
  const [entries, setEntries] = useState([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showChallenge, setShowChallenge] = useState(false);

  const currentSection = LEADERBOARD_SECTIONS.find((s) => s.key === sectionKey);
  const currentMetric = currentSection?.metrics.find((m) => m.key === metricKey);
  const memberIds = members.map((m) => m.user_id);

  useEffect(() => {
    loadLeague();
  }, [id]);

  useEffect(() => {
    if (league && members.length > 0) {
      loadLeaderboard();
      loadFeed();
      loadChallenges();
    }
  }, [id, sectionKey, metricKey, timeframe, members]);

  const loadLeague = async () => {
    try {
      const data = await base44.entities.League.get(id);
      setLeague(data);
      const m = await getLeagueMembers(id);
      setMembers(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    setLbLoading(true);
    try {
      const data = await getLeaderboard(sectionKey, metricKey, 'league', memberIds, user?.id, timeframe);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLbLoading(false);
    }
  };

  const loadFeed = async () => {
    try {
      const f = await getLeagueFeed(id);
      setFeed(f);
    } catch (e) {
      console.error(e);
    }
  };

  const loadChallenges = async () => {
    try {
      const c = await getLeagueChallenges(id);
      setChallenges(c);
    } catch (e) {
      console.error(e);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = members.some((m) => m.user_id === user?.id && (m.role === 'owner' || m.role === 'admin'));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!league) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">League not found.</p>
        <button onClick={() => navigate('/community')} className="mt-4 text-primary text-sm font-medium">Back to Community</button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/community')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-xl font-bold">{league.name}</h1>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border bg-muted flex-shrink-0">
            {league.photo_url ? (
              <Image src={league.photo_url} fittingType="fill" className="w-full h-full" alt={league.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{league.name}</p>
            <p className="text-xs text-muted-foreground">{league.member_count || 1} members</p>
            {league.description && <p className="text-xs text-muted-foreground mt-1">{league.description}</p>}
          </div>
        </div>
        <button
          onClick={copyInviteCode}
          className="w-full h-9 rounded-lg bg-accent flex items-center justify-center gap-1.5 text-xs font-medium"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-gain" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Invite Code: {league.invite_code}</>}
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
            {LEADERBOARD_TIMEFRAMES.map((tf) => (
              <button
                key={tf.key}
                onClick={() => setTimeframe(tf.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                  timeframe === tf.key ? 'bg-accent text-accent-foreground border border-primary/30' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {tf.icon} {tf.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
            {LEADERBOARD_SECTIONS.map((sec) => (
              <button
                key={sec.key}
                onClick={() => { setSectionKey(sec.key); setMetricKey(sec.metrics[0].key); }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                  sectionKey === sec.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {sec.icon} {sec.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
            {currentSection?.metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetricKey(m.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                  metricKey === m.key ? 'bg-accent text-accent-foreground border border-primary/30' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          {lbLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No qualifying members yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <LeaderboardEntry
                  key={entry.userId}
                  entry={entry}
                  isMe={entry.userId === user?.id}
                  isFriend={false}
                  metricType={currentMetric?.type}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'feed' && <LeagueFeed activities={feed} leagueId={id} user={user} />}

      {tab === 'challenges' && (
        <div className="space-y-2">
          {isAdmin && !showChallenge && (
            <button
              onClick={() => setShowChallenge(true)}
              className="w-full h-10 rounded-xl border border-primary/30 text-primary text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Challenge
            </button>
          )}
          {showChallenge && (
            <ChallengeForm
              leagueId={id}
              leagueName={league.name}
              onClose={() => setShowChallenge(false)}
              onCreated={() => { setShowChallenge(false); loadChallenges(); }}
            />
          )}
          {challenges.length === 0 && !showChallenge ? (
            <p className="text-sm text-muted-foreground text-center py-12">No active challenges.</p>
          ) : (
            challenges.map((c) => (
              <div key={c.id} className="rounded-2xl bg-card border border-border p-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">{c.title}</p>
                </div>
                {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {c.end_date && <span className="text-[10px] text-muted-foreground">Ends {formatRelativeDate(c.end_date)}</span>}
                  {c.prize && <span className="text-[10px] bg-gold/10 text-gold rounded-full px-2 py-0.5 font-medium">🏆 {c.prize}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/collector/${m.user_id}`)}
              className="w-full text-left rounded-2xl bg-card border border-border p-3 flex items-center gap-3 hover:bg-accent"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                {m.user_photo ? (
                  <Image src={m.user_photo} fittingType="fill" className="w-full h-full" alt={m.user_name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {m.user_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{m.user_name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{m.role}</p>
              </div>
              {m.role === 'owner' && <Crown className="w-4 h-4 text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeForm({ leagueId, leagueName, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', category: '', metric: '', end_date: '', prize: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createChallenge(user, leagueId, leagueName, form);
      onCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">New Challenge</p>
        <button onClick={onClose}><X className="w-4 h-4" /></button>
      </div>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Challenge title"
        className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
        className="w-full h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
        />
        <input
          value={form.prize}
          onChange={(e) => setForm({ ...form, prize: e.target.value })}
          placeholder="Prize (optional)"
          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={saving || !form.title.trim()}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
      >
        {saving ? 'Creating...' : 'Create Challenge'}
      </button>
    </div>
  );
}