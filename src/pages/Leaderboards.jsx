import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getLeaderboard, LEADERBOARD_CATEGORIES } from '@/lib/leaderboard';
import { Image } from '@/components/ui/image';
import { formatCurrency } from '@/lib/format';
import { ArrowLeft, Loader2, Trophy, Eye, EyeOff, Crown, Medal } from 'lucide-react';

export default function Leaderboards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('overall_value');
  const [entries, setEntries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [togglingOptIn, setTogglingOptIn] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    loadLeaderboard();
  }, [category]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      setProfile(profiles[0] || null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(category);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOptIn = async () => {
    setTogglingOptIn(true);
    try {
      const current = profile?.leaderboard_opt_in || false;
      if (profile) {
        const updated = await base44.entities.CollectorProfile.update(profile.id, {
          leaderboard_opt_in: !current,
        });
        setProfile(updated);
      } else {
        const created = await base44.entities.CollectorProfile.create({
          user_id: user.id,
          display_name: user.display_name || user.full_name || '',
          username: user.username || '',
          leaderboard_opt_in: true,
        });
        setProfile(created);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingOptIn(false);
    }
  };

  const optIn = profile?.leaderboard_opt_in || false;

  const getValue = (entry) => {
    if (category === 'collector_score') return entry.scoreValue || 0;
    if (category === 'graded_collection') return entry.gradedCount || 0;
    if (LEADERBOARD_CATEGORIES.find((c) => c.key === category && CATEGORY_KEYS.includes(category))) {
      return entry.categories[category]?.value || 0;
    }
    return entry.totalValue || 0;
  };

  const formatValue = (entry) => {
    if (category === 'collector_score') return `${entry.scoreValue || 0} pts`;
    if (category === 'graded_collection') return `${entry.gradedCount || 0} graded`;
    return formatCurrency(getValue(entry));
  };

  return (
    <div className="px-4 py-4 space-y-4">
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

      {/* Opt-in toggle */}
      <div className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {optIn ? <Eye className="w-4 h-4 text-gain" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">Show on Leaderboards</p>
            <p className="text-[10px] text-muted-foreground">Opt in to compete with other collectors</p>
          </div>
        </div>
        <button
          onClick={toggleOptIn}
          disabled={togglingOptIn}
          className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${optIn ? 'bg-gain' : 'bg-muted'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${optIn ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
        {LEADERBOARD_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
              category === cat.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Rankings */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No collectors on this leaderboard yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Opt in and add public items with verified values to compete!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isMe = entry.userId === user?.id;
            return (
              <div
                key={entry.userId}
                className={`rounded-2xl border p-3 flex items-center gap-3 ${
                  isMe ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'
                }`}
              >
                <div className="w-8 text-center flex-shrink-0">
                  {entry.rank === 1 && <Crown className="w-5 h-5 text-gold mx-auto" />}
                  {entry.rank === 2 && <Medal className="w-5 h-5 text-muted-foreground mx-auto" />}
                  {entry.rank === 3 && <Medal className="w-5 h-5 text-orange-500 mx-auto" />}
                  {entry.rank > 3 && <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>}
                </div>
                <button
                  onClick={() => navigate(`/collector/${entry.userId}`)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0"
                >
                  {entry.profilePhoto ? (
                    <Image src={entry.profilePhoto} fittingType="fill" className="w-full h-full" alt={entry.displayName} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {entry.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {entry.displayName}
                    {isMe && <span className="text-xs text-primary ml-1">(You)</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    @{entry.username || 'collector'} · {entry.itemCount} items
                  </p>
                </div>
                <span className="text-sm font-bold flex-shrink-0">{formatValue(entry)}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Rankings use only verified sold-price data. Manual values are never counted.
      </p>
    </div>
  );
}

const CATEGORY_KEYS = ['Pokémon', 'Magic: The Gathering', 'Disney Lorcana', 'Sports Cards', 'Funko Pop!', 'Coins', 'Sports Memorabilia'];