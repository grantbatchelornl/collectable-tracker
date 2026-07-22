import { getTradeFairness } from '@/lib/social';

const COLOR_MAP = {
  gain: 'bg-gain/10 text-gain',
  gold: 'bg-gold/10 text-gold',
  loss: 'bg-loss/10 text-loss',
  muted: 'bg-muted text-muted-foreground',
};

export default function FairnessIndicator({ offered, requested, size = 'sm' }) {
  const fairness = getTradeFairness(offered, requested);
  const padding = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-medium ${padding} ${COLOR_MAP[fairness.color]}`}
    >
      {fairness.label}
    </div>
  );
}