import { Image } from '@/components/ui/image';
import { Check, Star, Trophy } from 'lucide-react';

export default function BinderSlot({ item, onClick }) {
  const { status, collectible, isGraded, duplicateCount, name, number, rarity } = item;

  const borderClass =
    status === 'owned'
      ? 'border-gain'
      : status === 'wishlisted'
      ? 'border-gold'
      : 'border-border';

  const bgClass =
    status === 'owned'
      ? 'bg-card'
      : status === 'missing'
      ? 'bg-muted/30'
      : 'bg-gold/5';

  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg border-2 aspect-[2.5/3.5] overflow-hidden transition-transform active:scale-95 ${borderClass} ${bgClass}`}
    >
      {collectible?.primary_photo_url ? (
        <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={name} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
          {number && <p className="text-[8px] text-muted-foreground">{number}</p>}
          <p className="text-[9px] font-medium leading-tight line-clamp-3">{name}</p>
          {rarity && <p className="text-[7px] text-muted-foreground mt-0.5">{rarity}</p>}
        </div>
      )}

      {status === 'owned' && (
        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gain flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      {status === 'wishlisted' && (
        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}
      {isGraded && (
        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Trophy className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}
      {duplicateCount > 1 && (
        <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold bg-gain text-white rounded-full px-1 py-0.5">
          +{duplicateCount - 1}
        </span>
      )}
    </button>
  );
}