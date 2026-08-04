import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { createLeague } from '@/lib/league';
import { X, Loader2, Lock, Globe } from 'lucide-react';

export default function CreateLeagueModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', photo_url: '', is_private: false, category: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const league = await createLeague(user, form);
      onCreated(league);
    } catch (e) {
      setError(e.message || 'Failed to create league');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Create League</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">League Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Pokémon Masters"
            className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's this league about?"
            className="w-full h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category (optional)</label>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g., Pokémon, Sports Cards, General"
            className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setForm({ ...form, is_private: false })}
            className={`p-3 rounded-xl border text-center ${!form.is_private ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <Globe className={`w-5 h-5 mx-auto mb-1 ${!form.is_private ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">Public</p>
          </button>
          <button
            onClick={() => setForm({ ...form, is_private: true })}
            className={`p-3 rounded-xl border text-center ${form.is_private ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <Lock className={`w-5 h-5 mx-auto mb-1 ${form.is_private ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">Private</p>
          </button>
        </div>
        <div className="rounded-xl bg-accent/50 p-3">
          <p className="text-xs text-muted-foreground">
            An invite code will be generated automatically. Share it with friends so they can join.
          </p>
        </div>
        {error && <p className="text-sm text-loss text-center">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={saving || !form.name.trim()}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : 'Create League'}
        </button>
      </div>
    </div>
  );
}