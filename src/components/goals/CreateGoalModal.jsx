import { useState } from 'react';
import { X, Loader2, Target, User, Package, Layers } from 'lucide-react';

const GOAL_TYPES = [
  { key: 'set_completion', label: 'Complete a Set', icon: Layers, desc: 'Collect every card in a specific set' },
  { key: 'player_collection', label: 'Player/Character Collection', icon: User, desc: 'Collect every card of a specific player or character' },
  { key: 'category_milestone', label: 'Category Milestone', icon: Target, desc: 'Reach a target number in a category' },
  { key: 'custom', label: 'Custom Goal', icon: Package, desc: 'Define your own collection goal' },
];

export default function CreateGoalModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    goal_type: 'set_completion',
    category_name: '',
    set_name: '',
    character_athlete_name: '',
    product_line: '',
    year: '',
    target_count: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onCreated({
        user_id: user.id,
        title: form.title,
        goal_type: form.goal_type,
        category_name: form.category_name || undefined,
        set_name: form.set_name || undefined,
        character_athlete_name: form.character_athlete_name || undefined,
        product_line: form.product_line || undefined,
        year: form.year ? parseInt(form.year) : undefined,
        target_count: parseInt(form.target_count) || 0,
        status: 'active',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">New Collection Goal</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Goal Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Complete Base Set Pokémon"
            className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GOAL_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setForm({ ...form, goal_type: t.key })}
              className={`p-3 rounded-xl border text-left ${form.goal_type === t.key ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <t.icon className={`w-4 h-4 mb-1 ${form.goal_type === t.key ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-xs font-medium">{t.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category (optional)</label>
          <input
            value={form.category_name}
            onChange={(e) => setForm({ ...form, category_name: e.target.value })}
            placeholder="e.g., Pokémon, Sports Cards"
            className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {(form.goal_type === 'set_completion' || form.goal_type === 'custom') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Set Name (optional)</label>
            <input
              value={form.set_name}
              onChange={(e) => setForm({ ...form, set_name: e.target.value })}
              placeholder="e.g., Base Set, Prismatic Evolutions"
              className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {(form.goal_type === 'player_collection' || form.goal_type === 'custom') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Character / Athlete (optional)</label>
            <input
              value={form.character_athlete_name}
              onChange={(e) => setForm({ ...form, character_athlete_name: e.target.value })}
              placeholder="e.g., Charizard, Tom Brady"
              className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Line</label>
            <input
              value={form.product_line}
              onChange={(e) => setForm({ ...form, product_line: e.target.value })}
              placeholder="e.g., Topps Chrome"
              className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2025"
              className="w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Count</label>
          <input
            type="number"
            value={form.target_count}
            onChange={(e) => setForm({ ...form, target_count: e.target.value })}
            placeholder="e.g., 142"
            className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-[10px] text-muted-foreground">How many unique items are needed to complete this goal?</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !form.title.trim()}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : 'Create Goal'}
        </button>
      </div>
    </div>
  );
}