import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';

export default function FollowButton({ targetUserId, targetName, targetPhoto, onStatusChange }) {
  const { user } = useAuth();
  const [followRecord, setFollowRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !targetUserId || targetUserId === user.id) {
      setLoading(false);
      return;
    }
    checkFollowStatus();
  }, [user?.id, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const records = await base44.entities.Follow.filter({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setFollowRecord(records[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setActionLoading(true);
    try {
      if (followRecord) {
        await base44.entities.Follow.delete(followRecord.id);
        setFollowRecord(null);
      } else {
        const record = await base44.entities.Follow.create({
          follower_id: user.id,
          following_id: targetUserId,
          follower_name: user.display_name || user.full_name || '',
          following_name: targetName || '',
          follower_photo: user.profile_photo || '',
          following_photo: targetPhoto || '',
          status: 'pending',
        });
        setFollowRecord(record);
      }
      onStatusChange?.();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || targetUserId === user?.id) return null;

  if (followRecord?.status === 'pending') {
    return (
      <button
        onClick={handleToggle}
        disabled={actionLoading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
      >
        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
        Pending
      </button>
    );
  }

  if (followRecord?.status === 'active') {
    return (
      <button
        onClick={handleToggle}
        disabled={actionLoading}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
      >
        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
        Following
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={actionLoading}
      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
      Follow
    </button>
  );
}