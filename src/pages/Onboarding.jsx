import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { syncCollectorProfile } from '@/lib/social';
import WelcomeTutorial from '@/components/WelcomeTutorial';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(true);
  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setProfilePhoto(result.file_url);
    } catch (err) {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    setSaving(true);
    try {
      await syncCollectorProfile({
        ...user,
        display_name: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        profile_photo: profilePhoto,
        has_completed_onboarding: true,
      });
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to save profile');
      setSaving(false);
    }
  };

  if (showTutorial) {
    return <WelcomeTutorial onComplete={() => setShowTutorial(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto overscroll-contain">
      <div className="flex flex-col items-center px-6 pt-12 pb-32 max-w-md mx-auto w-full min-h-max">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-center mb-2">Set Up Your Profile</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Tell us a bit about yourself to get started.
        </p>

        <div className="mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted"
          >
            {profilePhoto ? (
              <Image src={profilePhoto} fittingType="fill" className="w-full h-full" alt="Profile" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files[0])}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm w-full">
            {error}
          </div>
        )}

        <div className="space-y-4 w-full">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@collector"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label>Bio (optional)</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other collectors about yourself..."
              className="w-full h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="w-full h-12 font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}