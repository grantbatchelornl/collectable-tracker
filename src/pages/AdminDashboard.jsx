import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Shield,
  Users as UsersIcon,
  Package,
  DollarSign,
  Loader2,
  ShieldAlert,
  Plus,
  ScrollText,
  Settings as SettingsIcon,
  Tag,
  Crown,
  Ban,
  CheckCircle2,
  TrendingUp,
  Flag,
  ToggleLeft,
  Award,
  Server,
} from 'lucide-react';
import AchievementBuilder from '@/components/AchievementBuilder';
import { formatCurrency, formatRelativeDate, formatDate } from '@/lib/format';

const TABS = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'users', label: 'Users', icon: UsersIcon },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
  { key: 'audit', label: 'Audit Log', icon: ScrollText },
  { key: 'reports', label: 'Reports', icon: Flag },
  { key: 'flags', label: 'Feature Flags', icon: ToggleLeft },
  { key: 'achievements', label: 'Achievements', icon: Award },
  { key: 'system', label: 'System', icon: Server },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    try { return sessionStorage.getItem('admin_unlocked') === 'true'; } catch { return false; }
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pwError, setPwError] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [collectibles, setCollectibles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦', sort_order: 0 });
  const [thresholdValue, setThresholdValue] = useState('10');
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [reports, setReports] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [usersData, cats, logs, allCollectibles, allSettings] = await Promise.all([
          base44.entities.User.list('-created_date', 200),
          base44.entities.CollectibleCategory.list('sort_order', 50),
          base44.entities.AuditLog.list('-created_date', 100),
          base44.entities.Collectible.list('-created_date', 500),
          base44.entities.AppSetting.list(),
        ]);
        setUsers(usersData);
        setCategories(cats);
        setAuditLogs(logs);
        setCollectibles(allCollectibles);
        setSettings(allSettings);
        const threshold = allSettings.find((s) => s.key === 'default_alert_threshold');
        if (threshold) setThresholdValue(threshold.value);
        const [reportData, flagData] = await Promise.all([
          base44.entities.Report.list('-created_date', 100),
          base44.entities.AppFeatureFlag.list(),
        ]);
        setReports(reportData);
        setFeatureFlags(flagData);
      }
    } catch (err) {
      console.error('Admin load failed', err);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (action, targetType, targetId, targetName, details) => {
    try {
      await base44.entities.AuditLog.create({
        action,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        details,
      });
    } catch (err) {
      console.error('Audit log failed', err);
    }
  };

  const toggleSuspend = async (u) => {
    try {
      await base44.entities.User.update(u.id, { is_suspended: !u.is_suspended });
      await logAction(
        u.is_suspended ? 'reactivate_user' : 'suspend_user',
        'user',
        u.id,
        u.email,
        u.is_suspended ? 'Reactivated account' : 'Suspended account'
      );
      loadData();
    } catch (err) {
      alert('Failed to update user: ' + (err.message || ''));
    }
  };

  const setRole = async (u, role) => {
    if (!isAdmin || !['admin', 'user'].includes(role) || u.id === user.id) return;
    try {
      const response = await base44.functions.invoke('updateUserRole', {
        targetUserId: u.id,
        newRole: role,
        reason: 'Role change via Admin Dashboard',
      });
      if (response.data?.error) {
        alert(response.data.error);
        return;
      }
      loadData();
    } catch (err) {
      alert('Failed to update role: ' + (err.message || ''));
    }
  };

  const addCategory = async () => {
    if (!newCategory.name) return;
    try {
      const slug = newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await base44.entities.CollectibleCategory.create({
        name: newCategory.name,
        slug,
        icon: newCategory.icon || '📦',
        sort_order: newCategory.sort_order || 0,
        active: true,
      });
      await logAction('create_category', 'category', '', newCategory.name, 'Created category');
      setShowAddCategory(false);
      setNewCategory({ name: '', icon: '📦', sort_order: 0 });
      loadData();
    } catch (err) {
      alert('Failed to add category: ' + (err.message || ''));
    }
  };

  const toggleCategoryActive = async (cat) => {
    try {
      await base44.entities.CollectibleCategory.update(cat.id, { active: !cat.active });
      await logAction(
        cat.active ? 'deactivate_category' : 'activate_category',
        'category',
        cat.id,
        cat.name,
        cat.active ? 'Deactivated' : 'Activated'
      );
      loadData();
    } catch (err) {
      alert('Failed to update category: ' + (err.message || ''));
    }
  };

  const saveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const existing = settings.find((s) => s.key === 'default_alert_threshold');
      if (existing) {
        await base44.entities.AppSetting.update(existing.id, { value: thresholdValue });
      } else {
        await base44.entities.AppSetting.create({
          key: 'default_alert_threshold',
          value: thresholdValue,
          label: 'Default Price Alert Threshold ($)',
        });
      }
      await logAction('update_setting', 'setting', '', 'default_alert_threshold', `Set to $${thresholdValue}`);
      setSavingThreshold(false);
      loadData();
    } catch (err) {
      alert('Failed to save setting: ' + (err.message || ''));
      setSavingThreshold(false);
    }
  };

  const handleUnlock = async () => {
    setVerifying(true);
    setPwError('');
    try {
      const response = await base44.functions.invoke('verifyAdminAccess', { password: adminPassword });
      if (response.data?.authorized) {
        try { sessionStorage.setItem('admin_unlocked', 'true'); } catch {}
        setAdminUnlocked(true);
      } else {
        setPwError('Incorrect password.');
      }
    } catch (err) {
      setPwError('Incorrect password.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          You don't have permission to access the admin dashboard.
        </p>
      </div>
    );
  }

  // Password gate
  if (!adminUnlocked) {
    return (
      <div className="px-4 py-8 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold mb-2">Admin Access</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the admin password to unlock the dashboard.
        </p>
        <div className="space-y-3">
          <Input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !verifying && handleUnlock()}
            placeholder="Admin password"
            className="h-12 text-center"
            autoFocus
          />
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          <Button onClick={handleUnlock} disabled={verifying || !adminPassword} className="w-full h-12">
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock'}
          </Button>
        </div>
      </div>
    );
  }

  const activeUsers = users.filter((u) => !u.is_suspended).length;
  const totalValue = collectibles.reduce((s, c) => s + (c.estimated_value || 0), 0);

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Admin Dashboard</h2>
      </div>
      {isSuperAdmin && (
        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">
          <Crown className="w-3 h-3" /> Super Admin
        </span>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={UsersIcon} label="Total Users" value={users.length} />
            <StatCard icon={CheckCircle2} label="Active Users" value={activeUsers} />
            <StatCard icon={Package} label="Collectibles" value={collectibles.length} />
            <StatCard icon={DollarSign} label="Value Tracked" value={formatCurrency(totalValue)} gold />
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <h3 className="font-semibold text-sm mb-3">Recently Registered</h3>
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.display_name || u.full_name || u.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatRelativeDate(u.created_date)}</span>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground">No users yet.</p>}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{u.display_name || u.full_name || u.email}</p>
                    {u.role === 'super_admin' && (
                      <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">Super Admin</span>
                    )}
                    {u.role === 'admin' && (
                      <span className="text-[10px] bg-accent text-accent-foreground rounded-full px-2 py-0.5 font-medium">Admin</span>
                    )}
                    {u.is_suspended && (
                      <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-medium">Suspended</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    @{u.username || '—'} · {u.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => toggleSuspend(u)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 ${
                    u.is_suspended
                      ? 'bg-gain/10 text-gain'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {u.is_suspended ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                  {u.is_suspended ? 'Reactivate' : 'Suspend'}
                </button>
                {isAdmin && u.id !== user.id && u.role !== 'super_admin' && (
                  <>
                    {u.role === 'user' && (
                      <button
                        onClick={() => setRole(u, 'admin')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-primary/10 text-primary flex items-center gap-1"
                      >
                        <Crown className="w-3 h-3" /> Promote
                      </button>
                    )}
                    {u.role === 'admin' && (
                      <button
                        onClick={() => setRole(u, 'user')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-muted text-muted-foreground"
                      >
                        Demote
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users yet.</p>}
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="space-y-2">
          <button
            onClick={() => setShowAddCategory(true)}
            className="w-full h-11 rounded-xl border border-dashed border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg">
                  {cat.icon || '📦'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat.active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleCategoryActive(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  cat.active ? 'bg-destructive/10 text-destructive' : 'bg-gain/10 text-gain'
                }`}
              >
                {cat.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-sm">Default Price Alert Threshold</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Notify users when a collectible's value increases by more than this amount.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(e.target.value)}
                  className="pl-7 h-11"
                />
              </div>
              <Button onClick={saveThreshold} disabled={savingThreshold} className="h-11">
                {savingThreshold ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="rounded-2xl bg-card border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{log.action.replace(/_/g, ' ')}</p>
                  {log.target_name && (
                    <p className="text-xs text-muted-foreground truncate">{log.target_name}</p>
                  )}
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatRelativeDate(log.created_date)}
                </span>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No audit log entries yet.</p>
          )}
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl bg-card border border-border p-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  r.status === 'pending' ? 'bg-gold/10 text-gold' :
                  r.status === 'resolved' ? 'bg-gain/10 text-gain' : 'bg-muted text-muted-foreground'
                }`}>{r.status}</span>
                <span className="text-[10px] text-muted-foreground">{formatRelativeDate(r.created_date)}</span>
              </div>
              <p className="text-sm font-medium mt-1 capitalize">{r.report_type}: {r.reason}</p>
              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
            </div>
          ))}
          {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No reports.</p>}
        </div>
      )}

      {/* Feature Flags */}
      {tab === 'flags' && (
        <div className="space-y-2">
          {featureFlags.map((f) => (
            <div key={f.id} className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{f.label}</p>
                {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
              </div>
              <button
                onClick={async () => {
                  await base44.entities.AppFeatureFlag.update(f.id, { enabled: !f.enabled });
                  await logAction('toggle_feature', 'feature_flag', f.id, f.key, f.enabled ? 'Disabled' : 'Enabled');
                  loadData();
                }}
                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${f.enabled ? 'bg-gain' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${f.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
          {featureFlags.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No feature flags configured.</p>}
        </div>
      )}

      {/* Achievements */}
      {tab === 'achievements' && (
        <AchievementBuilder />
      )}

      {/* System */}
      {tab === 'system' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-card border border-border p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Temporarily restrict app access</p>
            </div>
            <button
              onClick={async () => {
                const existing = settings.find((s) => s.key === 'maintenance_mode');
                const newValue = existing?.value !== 'true';
                if (existing) {
                  await base44.entities.AppSetting.update(existing.id, { value: newValue ? 'true' : 'false' });
                } else {
                  await base44.entities.AppSetting.create({ key: 'maintenance_mode', value: newValue ? 'true' : 'false', label: 'Maintenance Mode' });
                }
                await logAction('toggle_maintenance', 'setting', '', 'maintenance_mode', newValue ? 'Enabled' : 'Disabled');
                loadData();
              }}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${settings.find((s) => s.key === 'maintenance_mode')?.value === 'true' ? 'bg-destructive' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.find((s) => s.key === 'maintenance_mode')?.value === 'true' ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="font-semibold text-sm mb-2">System Health</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Total Users:</span> <span className="font-medium">{users.length}</span></div>
              <div><span className="text-muted-foreground">Active:</span> <span className="font-medium">{activeUsers}</span></div>
              <div><span className="text-muted-foreground">Collectibles:</span> <span className="font-medium">{collectibles.length}</span></div>
              <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">{formatCurrency(totalValue)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
                placeholder="e.g. Yu-Gi-Oh! Cards"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input
                value={newCategory.icon}
                onChange={(e) => setNewCategory((c) => ({ ...c, icon: e.target.value }))}
                placeholder="📦"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={newCategory.sort_order}
                onChange={(e) => setNewCategory((c) => ({ ...c, sort_order: parseInt(e.target.value) || 0 }))}
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button onClick={addCategory}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gold }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <Icon className={`w-5 h-5 mb-2 ${gold ? 'text-gold' : 'text-muted-foreground'}`} />
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}