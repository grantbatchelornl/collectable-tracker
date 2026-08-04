import { useNavigate } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { Users, Lock, Globe, ArrowRight } from 'lucide-react';

export default function LeagueCard({ league }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/league/${league.id}`)}
      className="w-full text-left rounded-2xl bg-card border border-border p-3 flex items-center gap-3 hover:bg-accent transition-colors"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border bg-muted flex-shrink-0">
        {league.photo_url ? (
          <Image src={league.photo_url} fittingType="fill" className="w-full h-full" alt={league.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🏆</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{league.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Users className="w-3 h-3" /> {league.member_count || 1}
          </span>
          {league.is_private ? (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Lock className="w-3 h-3" /> Private
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Globe className="w-3 h-3" /> Public
            </span>
          )}
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}