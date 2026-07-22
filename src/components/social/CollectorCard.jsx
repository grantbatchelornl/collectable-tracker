import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import FollowButton from './FollowButton';

export default function CollectorCard({ profile, currentUserId }) {
  const navigate = useNavigate();
  const displayName = profile.display_name || 'Collector';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex flex-col items-center text-center">
      <button
        onClick={() => navigate(`/collector/${profile.user_id}`)}
        className="flex flex-col items-center w-full"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-muted mb-3">
          {profile.profile_photo ? (
            <Image src={profile.profile_photo} fittingType="fill" className="w-full h-full" alt={displayName} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
              {initial}
            </div>
          )}
        </div>
        <p className="font-semibold text-sm truncate w-full">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate w-full">@{profile.username || 'collector'}</p>
      </button>
      {profile.bio && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{profile.bio}</p>
      )}
      {profile.user_id !== currentUserId && (
        <div className="mt-3 w-full">
          <FollowButton
            targetUserId={profile.user_id}
            targetName={displayName}
            targetPhoto={profile.profile_photo}
          />
        </div>
      )}
    </div>
  );
}