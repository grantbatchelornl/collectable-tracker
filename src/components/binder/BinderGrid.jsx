import { useMemo } from 'react';
import BinderSlot from './BinderSlot';
import { Image } from '@/components/ui/image';
import { Check, Star, Trophy, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const GRID_CONFIGS = {
  grid: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
  gallery: 'grid-cols-2',
  large: 'grid-cols-2',
  small: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8',
};

// Maps rarity strings to numeric ranks — higher = rarer.
// Covers TCG (Pokémon, Magic, Lorcana), sports cards, Funko, and coins.
const RARITY_RANKS = {
  'common': 1, 'uncommon': 2, 'rare': 3, 'rare holo': 4, 'holo rare': 4,
  'holo': 4, 'reverse holo': 4, 'super rare': 5, 'ultra rare': 6,
  'secret rare': 7, 'hyper rare': 8, 'rainbow rare': 8, 'gold rare': 8,
  'golden rare': 8, 'full art': 7, 'alternate art': 7, 'short print': 3,
  'sp': 3, 'super short print': 4, 'ssp': 4, 'insert': 3, 'parallel': 4,
  'rookie': 4, 'autograph': 6, 'auto': 6, 'patch': 6, 'relic': 5,
  'auto patch': 7, 'superfractor': 8, '1/1': 9, 'one of one': 9,
  'very rare': 5, 'legendary': 7, 'chase': 6, 'exclusive': 5,
  'limited': 5, 'limited edition': 6, 'grail': 9, 'variant': 4,
  'promo': 4, 'special': 4, 'mythic': 8, 'masterpiece': 9,
};

function getRarityRank(rarity) {
  if (!rarity) return 0;
  const normalized = rarity.toLowerCase().trim();
  if (normalized in RARITY_RANKS) return RARITY_RANKS[normalized];
  let bestRank = 0;
  for (const [key, rank] of Object.entries(RARITY_RANKS)) {
    if (normalized.includes(key) && rank > bestRank) bestRank = rank;
  }
  if (bestRank === 0 && normalized.includes('rare')) return 3;
  return bestRank;
}

export default function BinderGrid({ checklist, viewMode, sorting, onSlotClick }) {
  const sorted = useMemo(() => {
    const arr = [...checklist];
    switch (sorting) {
      case 'value':
        return arr.sort(
          (a, b) =>
            (b.estimated_price || b.collectible?.estimated_value || 0) -
            (a.estimated_price || a.collectible?.estimated_value || 0)
        );
      case 'name':
        return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'rarity':
        return arr.sort((a, b) => {
          const rankDiff = getRarityRank(b.rarity) - getRarityRank(a.rarity);
          if (rankDiff !== 0) return rankDiff;
          return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
        });
      default:
        return arr.sort((a, b) =>
          (a.number || '').localeCompare(b.number || '', undefined, { numeric: true })
        );
    }
  }, [checklist, sorting]);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-muted-foreground">No items match this filter</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1.5">
        {sorted.map((item, idx) => (
          <BinderListRow key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} />
        ))}
      </div>
    );
  }

  if (viewMode === 'gallery') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((item, idx) => (
          <BinderGalleryItem key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} />
        ))}
      </div>
    );
  }

  const gridClass = GRID_CONFIGS[viewMode] || GRID_CONFIGS.grid;
  return (
    <div className={`grid ${gridClass} gap-2`}>
      {sorted.map((item, idx) => (
        <BinderSlot key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} />
      ))}
    </div>
  );
}

function BinderListRow({ item, onClick }) {
  const { status, collectible, isGraded, duplicateCount, name, number, rarity } = item;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-2 hover:bg-accent"
    >
      <div className="w-10 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
        {collectible?.primary_photo_url ? (
          <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
            {number || '?'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{number} {rarity && `· ${rarity}`}</p>
        {item.estimated_price > 0 && (
          <p className="text-xs font-bold text-primary mt-0.5">{formatCurrency(item.estimated_price)}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {status === 'owned' && (
          <div className="w-5 h-5 rounded-full bg-gain flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {status === 'wishlisted' && (
          <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
        )}
        {isGraded && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Trophy className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
        {duplicateCount > 1 && (
          <span className="text-[10px] font-bold bg-gain text-white rounded-full px-1.5 py-0.5">
            +{duplicateCount - 1}
          </span>
        )}
      </div>
    </button>
  );
}

function BinderGalleryItem({ item, onClick }) {
  const { status, collectible, isGraded, duplicateCount, name, number } = item;
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border-2 overflow-hidden aspect-[3/4] ${
        status === 'owned' ? 'border-gain' : status === 'wishlisted' ? 'border-gold' : 'border-border'
      }`}
    >
      {collectible?.primary_photo_url ? (
        <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={name} />
      ) : (
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center p-2 text-center">
          {number && <p className="text-[10px] text-muted-foreground mb-1">{number}</p>}
          <p className="text-xs font-medium leading-tight">{name}</p>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="text-[10px] text-white font-medium truncate">{name}</p>
      </div>
      {status === 'owned' && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gain flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      {status === 'wishlisted' && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
          <Star className="w-3 h-3 text-white fill-white" />
        </div>
      )}
      {isGraded && (
        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Trophy className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {duplicateCount > 1 && (
        <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold bg-gain text-white rounded-full px-1.5 py-0.5">
          +{duplicateCount - 1}
        </span>
      )}
    </button>
  );
}