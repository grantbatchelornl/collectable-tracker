import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft,
  User,
  Bell,
  Eye,
  Palette,
  Shield,
  Download,
  HelpCircle,
  Package,
  DollarSign,
  Sparkles,
  ChevronRight,
  Loader2,
  Plane,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';
import ThemePicker from '@/components/ThemePicker';
import { getSoundsEnabled, setSoundsEnabled as setSfxEnabled } from '@/lib/sounds';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

const SECTIONS = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'profile', label: 'Profile', icon: User, link: '/profile' },
  { key: 'collection', label: 'Collection', icon: Package },
  { key: 'vacation', label: 'Vacation Mode', icon: Plane },
  { key: 'pricing', label: 'Pricing', icon: DollarSign },
  { key: 'ai', label: 'AI', icon: Sparkles },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'privacy', label: 'Privacy', icon: Eye },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'accessibility', label: 'Accessibility', icon: Eye },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'data_export', label: 'Data Export', icon: Download },
  { key: 'help', label: 'Help', icon: HelpCircle },
  { key: 'delete_account', label: 'Delete Account', icon: Trash2 },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState('notifications');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [soundsOn, setSoundsOn] = useState(getSoundsEnabled());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const profiles = await base44.entities.CollectorProfile.filter({ user_id: user.id });
      setProfile(profiles[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (field, value) => {
    if (!profile) return;
    try {
      const updated = await base44.entities.CollectorProfile.update(profile.id, { [field]: value });
      setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const items = await base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 500);
      const data = JSON.stringify(items.filter((c) => !c.is_deleted), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collection_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-xl font-bold">Settings</h1>
      </div>

      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isExpanded = expanded === section.key;

        if (section.link) {
          return (
            <button
              key={section.key}
              onClick={() => navigate(section.link)}
              className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium flex-1">{section.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        }

        return (
          <div key={section.key} className="rounded-2xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : section.key)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium flex-1">{section.label}</span>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {section.key === 'notifications' && (
                  <>
                    <SettingRow label="Price Increase Alerts" description={`Notify when value rises by $${profile?.price_increase_threshold || 10}+`}>
                      <input
                        type="number"
                        value={profile?.price_increase_threshold || 10}
                        onChange={(e) => updateProfile('price_increase_threshold', parseFloat(e.target.value) || 10)}
                        className="w-20 h-9 rounded-md border border-input bg-transparent px-2 text-sm text-center"
                      />
                    </SettingRow>
                    <SettingRow label="Price Decrease Alerts" description={`Notify when value drops by $${profile?.price_decrease_threshold || 10}+`}>
                      <input
                        type="number"
                        value={profile?.price_decrease_threshold || 10}
                        onChange={(e) => updateProfile('price_decrease_threshold', parseFloat(e.target.value) || 10)}
                        className="w-20 h-9 rounded-md border border-input bg-transparent px-2 text-sm text-center"
                      />
                    </SettingRow>
                    <SettingToggle
                      label="Collection Health Reminders"
                      description="Periodic reminders to improve data quality"
                      checked={profile?.health_reminder_enabled ?? true}
                      onChange={(v) => updateProfile('health_reminder_enabled', v)}
                    />
                  </>
                )}

                {section.key === 'vacation' && (
                  <SettingToggle
                    label="Vacation Mode"
                    description="Hide trade requests, messages, and notifications while you're away"
                    checked={profile?.vacation_mode || false}
                    onChange={(v) => updateProfile('vacation_mode', v)}
                  />
                )}

                {section.key === 'privacy' && (
                  <>
                    <SettingToggle
                      label="Leaderboard Opt-In"
                      description="Show your stats on public leaderboards"
                      checked={profile?.leaderboard_opt_in || false}
                      onChange={(v) => updateProfile('leaderboard_opt_in', v)}
                    />
                    <SettingToggle
                      label="Show Public Value"
                      description="Display total collection value on your profile"
                      checked={user?.privacy_show_public_value || false}
                      onChange={async (v) => {
                        await base44.auth.updateMe({ privacy_show_public_value: v });
                      }}
                    />
                  </>
                )}

                {section.key === 'appearance' && (
                  <>
                    <ThemePicker />
                    <SettingToggle
                      label="Sound Effects"
                      description="Subtle sounds for actions and achievements"
                      checked={soundsOn}
                      onChange={(v) => {
                        setSoundsOn(v);
                        setSfxEnabled(v);
                      }}
                    />
                  </>
                )}

                {section.key === 'accessibility' && (
                  <SettingToggle
                    label="Reduce Motion"
                    description="Minimize animations and transitions"
                    checked={reducedMotion}
                    onChange={(v) => {
                      setReducedMotion(v);
                      if (v) {
                        document.documentElement.style.setProperty('--reduce-motion', '1');
                      } else {
                        document.documentElement.style.removeProperty('--reduce-motion');
                      }
                    }}
                  />
                )}

                {section.key === 'data_export' && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full h-10 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Export Collection Data
                  </button>
                )}

                {section.key === 'account' && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user?.email}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium capitalize">{user?.role}</span></div>
                    <button onClick={() => logout()} className="w-full h-10 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-accent mt-2">
                      Log Out
                    </button>
                  </div>
                )}

                {section.key === 'security' && (
                  <p className="text-xs text-muted-foreground">Security settings and 2FA configuration coming soon. For account security issues, contact support.</p>
                )}

                {section.key === 'help' && (
                  <p className="text-xs text-muted-foreground">Need help? Contact Base44 support for assistance with your account or the app.</p>
                )}

                {section.key === 'delete_account' && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="w-full h-10 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center gap-2 text-sm font-medium hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete My Account
                    </button>
                  </div>
                )}

                {section.key === 'collection' && (
                  <p className="text-xs text-muted-foreground">Default privacy for new items and folder management are available on the Collection page.</p>
                )}

                {section.key === 'pricing' && (
                  <p className="text-xs text-muted-foreground">Value Lock and pricing refresh settings are available on each collectible's detail page.</p>
                )}

                {section.key === 'ai' && (
                  <>
                    <SettingToggle
                      label="Auto-confirm routine changes"
                      description="Allow Collector AI to make low-risk changes (profile edits, favorites, trade status) without asking for confirmation each time. Destructive actions always require confirmation."
                      checked={profile?.ai_auto_confirm_routine || false}
                      onChange={(v) => updateProfile('ai_auto_confirm_routine', v)}
                    />
                    <p className="text-xs text-muted-foreground">AI features include auto-identification, grade worthiness analysis, and action recommendations. These can be triggered from each collectible's detail page.</p>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <DeleteAccountDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} onDeleted={() => logout()} />
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="min-w-0 flex-1 mr-3">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SettingToggle({ label, description, checked, onChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}