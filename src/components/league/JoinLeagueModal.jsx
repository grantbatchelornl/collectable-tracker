import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { joinLeague } from '@/lib/league';
import { Image } from '@/components/ui/image';
import { X, Loader2, Users } from 'lucide-react';

export default function JoinLeagueModal({ onClose, onJoined }) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setError('');
    try {
      const league = await joinLeague(user, code);
      onJoined(league);
    } catch (e) {
      setError(e.message || 'Failed to join league');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Join League</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Invite Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="w-full h-14 rounded-md border border-input bg-transparent px-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {error && <p className="text-sm text-loss text-center">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={joining || !code.trim()}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {joining ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</> : <><Users className="w-5 h-5" /> Join League</>}
        </button>
      </div>
    </div>
  );
}