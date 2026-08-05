import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Layers,
  Image as ImageIcon,
  Package,
  Coins,
  Trophy,
  ArrowRight,
} from 'lucide-react';

const SCAN_OPTIONS = [
  {
    label: 'Scan One Card',
    description: 'Photograph or upload a single collectible for AI identification and pricing.',
    icon: ScanLine,
    route: '/add',
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'Scan Binder Page',
    description: 'Photograph a binder page to detect and import multiple cards at once.',
    icon: Layers,
    route: '/binder-scan',
    color: 'bg-gold/10 text-gold',
  },
  {
    label: 'Bulk Scanner',
    description: 'Upload multiple card images and import them in a single batch. Supports Pokémon, Magic, Lorcana, and Sports cards.',
    icon: ImageIcon,
    route: '/bulk-scan',
    color: 'bg-gain/10 text-gain',
    featured: true,
  },
  {
    label: 'Scan Funko Pop!',
    description: 'Identify and price Funko Pop! figures from photos.',
    icon: Package,
    route: '/add?category=Funko',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    label: 'Scan Coin',
    description: 'Identify and value coins from obverse/reverse photos.',
    icon: Coins,
    route: '/add?category=Coin',
    color: 'bg-amber-600/10 text-amber-600',
  },
  {
    label: 'Scan Sports Memorabilia',
    description: 'Identify sports cards, autographs, and memorabilia.',
    icon: Trophy,
    route: '/add?category=Sports',
    color: 'bg-blue-500/10 text-blue-500',
  },
];

export default function Scan() {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold mb-1">Scan</h1>
        <p className="text-sm text-muted-foreground">Choose how you'd like to add collectibles to your collection.</p>
      </div>

      <div className="space-y-3">
        {SCAN_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.label}
              onClick={() => navigate(option.route)}
              className={`w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98] hover:border-primary/50 ${
                option.featured
                  ? 'border-primary/30 bg-primary/5 shadow-soft'
                  : 'border-border bg-card'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${option.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{option.label}</p>
                  {option.featured && (
                    <span className="text-[9px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}