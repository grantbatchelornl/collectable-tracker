import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pencil,
  LogOut,
  Shield,
  Settings,
  Camera,
  Loader2,
  X,
  Package,
  DollarSign,
  Bell,
  Eye,
  UserPlus,
  Check,
  ArrowLeftRight,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { syncCollectorProfile } from '@/lib/social';
import { checkAndAwardBadges } from '@/lib/achievements';
import AchievementBadges from '@/components/AchievementBadges';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collectibles, setCollectibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editData, setEditData] = useState({});
  const [friendRequests, setFriendRequests] = useState([]);
  const [collectorProfile, setCollectorProfile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadData();
    if (user?.id) syncCollectorProfile(user);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, requests, profiles] = await Promise.all([
        base44.entities.Collectible.list('-created_date', 200),
        base44.entities.Follow.filter({ following_id: user?.id, status: 'pending' }, '-created_date', 50),
        base44.entities.CollectorProfile.filter({ user_id: user?.id }),
      ]);
      setCollectibles(items);
      setCollectorProfile(profiles[0] || null);
      setFriendRequests(requests);
      checkAndAwardBadges(user).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (request) => {
    try {
      await base44.entities.Follow.update(request.id, { status: 'active' });
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error(err);
    }
  };

  const declineRequest = async (request) => {
    try {
      await base44.entities.Follow.delete(request.id);
      setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = () => {
    setEditData({
      display_name: user?.display_name || user?.full_name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      profile_photo: user?.profile_photo || '',
      privacy_show_public_value: user?.privacy_show_public_value || false,
      notification_in_app_enabled: user?.notification_in_app_enabled ?? true,
      favorite_categories: collectorProfile?.favorite_categories || '',
      favorite_sets: collectorProfile?.favorite_sets || '',
      favorite_franchises: collectorProfile?.favorite_franchises || '',
      favorite_athletes: collectorProfile?.favorite_athletes || '',
      favorite_teams: collectorProfile?.favorite_teams || '',
      favorite_characters: collectorProfile?.favorite_characters || '',
      budget: collectorProfile?.budget || '',
      goals: collectorProfile?.goals || '',
      risk_tolerance: collectorProfile?.risk_tolerance || 'moderate',
    });
    setEditing(true);
  };

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setEditData((d) => ({ ...d, profile_photo: result.file_url }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        display_name: editData.display_name,
        username: editData.username,
        bio: editData.bio,
        profile_photo: editData.profile_photo,
        privacy_show_public_value: editData.privacy_show_public_value,
        notification_in_app_enabled: editData.notification_in_app_enabled,
      });
      if (collectorProfile) {
        await base44.entities.CollectorProfile.update(collectorProfile.id, {
          favorite_categories: editData.favorite_categories,
          favorite_sets: editData.favorite_sets,
          favorite_franchises: editData.favorite_franchises,
          favorite_athletes: editData.favorite_athletes,
          favorite_teams: editData.favorite_teams,
          favorite_characters: editData.favorite_characters,
          budget: parseFloat(editData.budget) || 0,
          goals: editData.goals,
          risk_tolerance: editData.risk_tolerance,
        });
      }
      await syncCollectorProfile({
        ...user,
        display_name: editData.display_name,
        username: editData.username,
        bio: editData.bio,
        profile_photo: editData.profile_photo,
        privacy_show_public_value: editData.privacy_show_public_value,
      });
      setEditing(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const totalValue = collectibles.reduce(
    (sum, c) => sum + (c.estimated_value || 0),
    0
  );
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const displayName = user?.display_name || user?.full_name || 'Collector';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Profile header */}
      <div className="rounded-3xl bg-card border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-muted flex-shrink-0">
            {user?.profile_photo ? (
              <Image src={user.profile_photo} fittingType="fill" className="w-full h-full" alt="Profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold truncate">{displayName}</h2>
            <p className="text-sm text-muted-foreground truncate">
              @{user?.username || 'username'}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                <Shield className="w-3 h-3" />
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            )}
          </div>
        </div>
        {user?.bio && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{user.bio}</p>
        )}
        <button
          onClick={startEdit}
          className="w-full mt-4 h-10 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          <Pencil className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <Package className="w-5 h-5 text-muted-foreground mb-2" />
          <p className="font-display text-2xl font-bold">{collectibles.length}</p>
          <p className="text-xs text-muted-foreground">Collectibles</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <DollarSign className="w-5 h-5 text-gold mb-2" />
          <p className="font-display text-2xl font-bold">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-muted-foreground">Total Value</p>
        </div>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserPlus className="w-3.5 h-3.5" /> Friend Requests ({friendRequests.length})
            </h3>
            <div className="space-y-3">
              {friendRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex-shrink-0">
                    {req.follower_photo ? (
                      <Image src={req.follower_photo} fittingType="fill" className="w-full h-full" alt={req.follower_name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {(req.follower_name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate flex-1">{req.follower_name || 'Collector'}</p>
                  <button
                    onClick={() => declineRequest(req)}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-accent flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => acceptRequest(req)}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 flex-shrink-0"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboards, AI & Settings */}
      <div className="space-y-2">
        <button
          onClick={() => navigate('/leaderboards')}
          className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="font-semibold text-sm">Leaderboards</p>
            <p className="text-xs text-muted-foreground">Compete with other collectors</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/collector-ai')}
          className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Collector AI</p>
            <p className="text-xs text-muted-foreground">Ask questions about your collection</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">Settings</p>
            <p className="text-xs text-muted-foreground">Account, privacy, notifications</p>
          </div>
        </button>
      </div>

      {/* Trades & Messages link */}
      <button
        onClick={() => navigate('/messages')}
        className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:bg-accent transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Trades & Messages</p>
          <p className="text-xs text-muted-foreground">View trade offers and conversations</p>
        </div>
      </button>

      {/* Badges */}
      <AchievementBadges userId={user?.id} />

      {/* Settings */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" /> Settings
          </h3>
          <div className="space-y-3">
            <ToggleRow
              icon={Eye}
              label="Show public collection value"
              description="Display total value on your public profile"
              checked={user?.privacy_show_public_value || false}
              onChange={async (v) => {
                await base44.auth.updateMe({ privacy_show_public_value: v });
                window.location.reload();
              }}
            />
            <ToggleRow
              icon={Bell}
              label="In-app notifications"
              description="Receive notifications in the app"
              checked={user?.notification_in_app_enabled ?? true}
              onChange={async (v) => {
                await base44.auth.updateMe({ notification_in_app_enabled: v });
                window.location.reload();
              }}
            />
          </div>
        </div>
      </div>

      {/* Admin link */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="w-full rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3 text-left hover:bg-primary/15 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Admin Dashboard</p>
            <p className="text-xs text-muted-foreground">Manage users, categories & settings</p>
          </div>
        </button>
      )}

      <button
        onClick={() => logout()}
        className="w-full h-12 rounded-xl border border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-accent"
      >
        <LogOut className="w-4 h-4" /> Log out
      </button>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Edit Profile</h3>
              <button onClick={() => setEditing(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center">
              <button onClick={() => fileRef.current?.click()} className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted">
                {editData.profile_photo ? (
                  <Image src={editData.profile_photo} fittingType="fill" className="w-full h-full" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-8 h-8 text-muted-foreground" />}
                  </div>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePhoto(e.target.files[0])} />
            </div>

            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={editData.display_name} onChange={(e) => setEditData((d) => ({ ...d, display_name: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={editData.username} onChange={(e) => setEditData((d) => ({ ...d, username: e.target.value }))} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData((d) => ({ ...d, bio: e.target.value }))}
                className="w-full h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <ToggleRow
              icon={Eye}
              label="Show public collection value"
              checked={editData.privacy_show_public_value}
              onChange={(v) => setEditData((d) => ({ ...d, privacy_show_public_value: v }))}
            />
            <ToggleRow
              icon={Bell}
              label="In-app notifications"
              checked={editData.notification_in_app_enabled}
              onChange={(v) => setEditData((d) => ({ ...d, notification_in_app_enabled: v }))}
            />

            <div className="pt-2 border-t border-border space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Collector Preferences</p>
              <div className="space-y-2">
                <Label>Favorite Categories</Label>
                <Input value={editData.favorite_categories} onChange={(e) => setEditData((d) => ({ ...d, favorite_categories: e.target.value }))} placeholder="Pokémon, Sports Cards..." className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Favorite Sets</Label>
                  <Input value={editData.favorite_sets} onChange={(e) => setEditData((d) => ({ ...d, favorite_sets: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Favorite Franchises</Label>
                  <Input value={editData.favorite_franchises} onChange={(e) => setEditData((d) => ({ ...d, favorite_franchises: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Favorite Athletes</Label>
                  <Input value={editData.favorite_athletes} onChange={(e) => setEditData((d) => ({ ...d, favorite_athletes: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Favorite Teams</Label>
                  <Input value={editData.favorite_teams} onChange={(e) => setEditData((d) => ({ ...d, favorite_teams: e.target.value }))} className="h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Favorite Characters</Label>
                <Input value={editData.favorite_characters} onChange={(e) => setEditData((d) => ({ ...d, favorite_characters: e.target.value }))} className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Budget ($)</Label>
                  <Input type="number" value={editData.budget} onChange={(e) => setEditData((d) => ({ ...d, budget: e.target.value }))} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Risk Tolerance</Label>
                  <select value={editData.risk_tolerance} onChange={(e) => setEditData((d) => ({ ...d, risk_tolerance: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-transparent px-2 text-sm">
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Goals</Label>
                <textarea value={editData.goals} onChange={(e) => setEditData((d) => ({ ...d, goals: e.target.value }))} placeholder="What are you collecting for?" className="w-full h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 h-11" disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 h-11" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}