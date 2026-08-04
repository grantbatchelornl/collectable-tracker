import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Settings as SettingsIcon, Trash2 } from 'lucide-react';

export default function AISettings({ open, onOpenChange }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (open && user) loadProfile();
  }, [open, user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      setProfile(profiles[0] || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (profile.id) {
        await base44.entities.CollectorProfile.update(profile.id, {
          ai_enabled: profile.ai_enabled,
          ai_response_detail: profile.ai_response_detail,
          ai_collector_level: profile.ai_collector_level,
          ai_recommendation_style: profile.ai_recommendation_style,
          ai_enable_recommendations: profile.ai_enable_recommendations,
          ai_enable_binder_suggestions: profile.ai_enable_binder_suggestions,
          ai_enable_trade_suggestions: profile.ai_enable_trade_suggestions,
          ai_enable_grading_suggestions: profile.ai_enable_grading_suggestions,
          ai_enable_health_suggestions: profile.ai_enable_health_suggestions,
          ai_include_purchase_price: profile.ai_include_purchase_price,
          ai_include_manual_values: profile.ai_include_manual_values,
          ai_save_history: profile.ai_save_history,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Delete all AI conversation history? This cannot be undone.')) return;
    setClearing(true);
    try {
      const conversations = await base44.entities.AIConversation.filter({ user_id: user.id });
      for (const conv of conversations) {
        await base44.entities.AIConversation.delete(conv.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> Collector AI Settings
          </DialogTitle>
          <DialogDescription>Customize how Collector AI assists you.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <SettingRow
              label="Enable Collector AI"
              description="Turn the assistant on or off"
            >
              <Switch checked={profile?.ai_enabled !== false} onCheckedChange={(v) => update('ai_enabled', v)} />
            </SettingRow>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Response Detail</Label>
              <SelectRow
                value={profile?.ai_response_detail || 'standard'}
                options={[{ value: 'brief', label: 'Brief' }, { value: 'standard', label: 'Standard' }, { value: 'detailed', label: 'Detailed' }]}
                onChange={(v) => update('ai_response_detail', v)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Collector Level</Label>
              <SelectRow
                value={profile?.ai_collector_level || 'beginner'}
                options={[{ value: 'beginner', label: 'Beginner — explain terms' }, { value: 'advanced', label: 'Advanced — use jargon' }]}
                onChange={(v) => update('ai_collector_level', v)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Recommendation Style</Label>
              <SelectRow
                value={profile?.ai_recommendation_style || 'balanced'}
                options={[{ value: 'conservative', label: 'Conservative' }, { value: 'balanced', label: 'Balanced' }, { value: 'aggressive', label: 'Aggressive' }]}
                onChange={(v) => update('ai_recommendation_style', v)}
              />
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Suggestions</p>
              <SettingRow label="Buy / Hold / Trade / Sell" description="Investment recommendations">
                <Switch checked={profile?.ai_enable_recommendations !== false} onCheckedChange={(v) => update('ai_enable_recommendations', v)} />
              </SettingRow>
              <SettingRow label="Binder Suggestions" description="Help complete sets and binders">
                <Switch checked={profile?.ai_enable_binder_suggestions !== false} onCheckedChange={(v) => update('ai_enable_binder_suggestions', v)} />
              </SettingRow>
              <SettingRow label="Trade Suggestions" description="Find fair trade matches">
                <Switch checked={profile?.ai_enable_trade_suggestions !== false} onCheckedChange={(v) => update('ai_enable_trade_suggestions', v)} />
              </SettingRow>
              <SettingRow label="Grading Suggestions" description="Identify grading candidates">
                <Switch checked={profile?.ai_enable_grading_suggestions !== false} onCheckedChange={(v) => update('ai_enable_grading_suggestions', v)} />
              </SettingRow>
              <SettingRow label="Collection Health" description="Proactive health suggestions">
                <Switch checked={profile?.ai_enable_health_suggestions !== false} onCheckedChange={(v) => update('ai_enable_health_suggestions', v)} />
              </SettingRow>
            </div>

            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data Inclusion</p>
              <SettingRow label="Include Purchase Price" description="Show cost and profit/loss in analysis">
                <Switch checked={profile?.ai_include_purchase_price || false} onCheckedChange={(v) => update('ai_include_purchase_price', v)} />
              </SettingRow>
              <SettingRow label="Include Manual Values" description="Include manually set values (clearly labeled)">
                <Switch checked={profile?.ai_include_manual_values !== false} onCheckedChange={(v) => update('ai_include_manual_values', v)} />
              </SettingRow>
              <SettingRow label="Save Chat History" description="Persist conversations for later reference">
                <Switch checked={profile?.ai_save_history !== false} onCheckedChange={(v) => update('ai_save_history', v)} />
              </SettingRow>
            </div>

            <div className="pt-2 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                onClick={clearHistory}
                disabled={clearing}
                className="w-full"
              >
                {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Clear All AI History
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SelectRow({ value, options, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs rounded-full px-3 py-1.5 font-medium transition-colors ${
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground hover:bg-primary/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}