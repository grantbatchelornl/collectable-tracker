import { Sparkles } from 'lucide-react';

export default function FoundingBadge({ badgeType, size = 'sm' }) {
  if (!badgeType) return null;
  const isCreator = badgeType === 'founding_creator';
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';
  const iconSize = size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center gap-1 ${sizeClasses} font-bold rounded-full ${
        isCreator
          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950'
          : 'bg-gradient-to-r from-primary to-violet-500 text-white'
      }`}
    >
      <Sparkles className={iconSize} />
      {isCreator ? 'Founding Creator' : 'Founding Collector'}
    </span>
  );
}