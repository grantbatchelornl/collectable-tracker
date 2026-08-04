import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2, Award, ToggleLeft, ToggleRight } from 'lucide-react';

const CATEGORIES = [
  { value: 'collection', label: 'Collection Milestones' },
  { value: 'category', label: 'Category Milestones' },
  { value: 'value', label: 'Value Milestones' },
  { value: 'set_completion', label: 'Set Completion' },
  { value: 'trades', label: 'Trades' },
  { value: 'grading', label: 'Grading' },
  { value: 'scanner', label: 'Scanner Usage' },
  { value: 'community', label: 'Community' },
];

export default function AchievementBuilder() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    badge_type: '',
    badge_name: '',
    badge_icon: '🏆',
    badge_description: '',
    category: 'collection',
    threshold: 0,
    threshold_unit: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AchievementTemplate.list('-created_date', 100);
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.badge_type || !form.badge_name) return;
    setSaving(true);
    try {
      await base44.entities.AchievementTemplate.create({
        ...form,
        threshold: parseFloat(form.threshold) || 0,
        active: true,
      });
      setForm({ badge_type: '', badge_name: '', badge_icon: '🏆', badge_description: '', category: 'collection', threshold: 0, threshold_unit: '' });
      setShowForm(false);
      loadTemplates();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tmpl) => {
    try {
      await base44.entities.AchievementTemplate.update(tmpl.id, { active: !tmpl.active });
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (tmpl) => {
    try {
      await base44.entities.AchievementTemplate.delete(tmpl.id);
      loadTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full h-11 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-accent"
      >
        <Plus className="w-4 h-4" /> Create Achievement
      </button>

      {showForm && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Badge Name</Label>
              <Input
                value={form.badge_name}
                onChange={(e) => setForm({ ...form, badge_name: e.target.value })}
                placeholder="e.g. Pokemon Master"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Icon</Label>
              <Input
                value={form.badge_icon}
                onChange={(e) => setForm({ ...form, badge_icon: e.target.value })}
                className="h-10 text-center"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Badge Type (unique key)</Label>
            <Input
              value={form.badge_type}
              onChange={(e) => setForm({ ...form, badge_type: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="e.g. pokemon_master"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={form.badge_description}
              onChange={(e) => setForm({ ...form, badge_description: e.target.value })}
              placeholder="e.g. Collected 25 Pokémon cards"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Threshold</Label>
              <Input
                type="number"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unit</Label>
              <Input
                value={form.threshold_unit}
                onChange={(e) => setForm({ ...form, threshold_unit: e.target.value })}
                placeholder="items, $, etc."
                className="h-10"
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving || !form.badge_name || !form.badge_type} className="w-full h-10">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Achievement'}
          </Button>
        </div>
      )}

      {templates.map((tmpl) => (
        <div key={tmpl.id} className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3">
          <span className="text-2xl">{tmpl.badge_icon || '🏆'}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{tmpl.badge_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{tmpl.badge_description}</p>
            <p className="text-[10px] text-muted-foreground">Type: {tmpl.badge_type} · {tmpl.category}</p>
          </div>
          <button
            onClick={() => toggleActive(tmpl)}
            className="flex-shrink-0"
            title={tmpl.active ? 'Active' : 'Inactive'}
          >
            {tmpl.active ? (
              <ToggleRight className="w-6 h-6 text-gain" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => handleDelete(tmpl)}
            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {templates.length === 0 && !showForm && (
        <div className="text-center py-8">
          <Award className="w-8 h-8 text-muted-foreground opacity-50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No custom achievements yet.</p>
        </div>
      )}
    </div>
  );
}