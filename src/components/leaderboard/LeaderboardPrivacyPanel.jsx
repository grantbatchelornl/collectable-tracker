import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Globe, Users, Lock, Eye, EyeOff } from 'lucide-react';

const SCOPE_OPTIONS = [
  { key: 'global_friends', label: 'Global + Friends', icon: Globe, desc: 'Compete with everyone' },
  { key: 'friends_only', label: 'Friends Only', icon: Users, desc: 'Compete with friends only' },
  { key: 'hidden', label: 'Private', icon: Lock, desc: 'Hidden from all' },
];

const PRIVACY_TOGGLES = [
  { key: 'hide_collection_value', label: 'Hide exact collection value' },
  { key: 'hide_individual_collectibles', label: 'Hide individual collectibles' },
  { key: 'hide_purchase_prices', label: 'Hide purchase prices' },
];

export default function LeaderboardPrivacyPanel({ profile, onUpdate }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const scope = profile?.leaderboard_scope || (profile?.leaderboard_opt_in ? 'global_friends' : 'hidden');

  const updateScope = async (newScope) => {
    if (scope === newScope) return;
    setSaving(true);
    try {
      let updated;
      if (profile) {
        updated = await base44.entities.CollectorProfile.update(profile.id, {
          leaderboard_scope: newScope,
          leaderboard_opt_in: newScope !== 'hidden',
        });
      } else {
        updated = await base44.entities.CollectorProfile.create({
          user_id: user.id,
          display_name: user.full_name || '',
          leaderboard_scope: newScope,
          leaderboard_opt_in: newScope !== 'hidden',
        });
      }
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const togglePrivacy = async (field) => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await base44.entities.CollectorProfile.update(profile.id, {
        [field]: !profile[field],
      });
      onUpdate(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => updateScope(opt.key)}
            disabled={saving}
            className={`p-3 rounded-xl border text-center transition-colors ${
              scope === opt.key ? 'border-primary bg-primary/10' : 'border-border bg-card'
            }`}
          >
            <opt.icon className={`w-5 h-5 mx-auto mb-1 ${scope === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-[10px] font-medium leading-tight">{opt.label}</p>
          </button>
        ))}
      </div>
      {scope !== 'hidden' && profile && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hide While Ranking</p>
          {PRIVACY_TOGGLES.map((toggle) => (
            <button
              key={toggle.key}
              onClick={() => togglePrivacy(toggle.key)}
              disabled={saving}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <span className="text-xs font-medium flex items-center gap-2">
                {profile[toggle.key] ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-gain" />}
                {toggle.label}
              </span>
              <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${profile[toggle.key] ? 'bg-muted' : 'bg-gain'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${profile[toggle.key] ? 'translate-x-0.5' : 'translate-x-[16px]'}`} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}