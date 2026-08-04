import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getUserLeagues, getPublicLeagues } from '@/lib/league';
import LeagueCard from '@/components/league/LeagueCard';
import CreateLeagueModal from '@/components/league/CreateLeagueModal';
import JoinLeagueModal from '@/components/league/JoinLeagueModal';
import Leaderboards from '@/pages/Leaderboards';
import TradeCenter from '@/components/trade/TradeCenter';
import { ArrowLeft, Trophy, Users, Loader2, Plus, LogIn, Search, Handshake } from 'lucide-react';

export default function CommunityRankings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('leaderboards');
  const [myLeagues, setMyLeagues] = useState([]);
  const [publicLeagues, setPublicLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeagues();
  }, [user]);

  const loadLeagues = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [mine, pub] = await Promise.all([getUserLeagues(user.id), getPublicLeagues()]);
      setMyLeagues(mine);
      setPublicLeagues(pub.filter((l) => !mine.some((m) => m.id === l.id)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPublic = publicLeagues.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">Community Rankings</h1>
            <p className="text-xs text-muted-foreground">Compete with collectors worldwide</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('leaderboards')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'leaderboards' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <Trophy className="w-4 h-4" /> Leaderboards
          </button>
          <button
            onClick={() => setTab('leagues')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'leagues' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <Users className="w-4 h-4" /> Leagues
          </button>
          <button
            onClick={() => setTab('trades')}
            className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'trades' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <Handshake className="w-4 h-4" /> Trades
          </button>
        </div>
      </div>

      {tab === 'leaderboards' && <Leaderboards />}

      {tab === 'trades' && <TradeCenter />}

      {tab === 'leagues' && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create League
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" /> Join with Code
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {myLeagues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Leagues</p>
                  {myLeagues.map((league) => (
                    <LeagueCard key={league.id} league={league} />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Discover Public Leagues</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search leagues..."
                    className="w-full h-10 rounded-md border border-input bg-transparent pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {filteredPublic.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {publicLeagues.length === 0 ? 'No public leagues yet. Create one!' : 'No leagues found.'}
                  </p>
                ) : (
                  filteredPublic.map((league) => (
                    <LeagueCard key={league.id} league={league} />
                  ))
                )}
              </div>

              {myLeagues.length === 0 && publicLeagues.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
                  <p className="text-sm font-medium">No leagues yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create a league or join one with an invite code.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showCreate && (
        <CreateLeagueModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadLeagues();
          }}
        />
      )}
      {showJoin && (
        <JoinLeagueModal
          onClose={() => setShowJoin(false)}
          onJoined={() => {
            setShowJoin(false);
            loadLeagues();
          }}
        />
      )}
    </div>
  );
}