import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  BookOpen,
  Target,
  Clock,
  MapPin,
  Trophy,
  Users,
  Sparkles,
  ShieldCheck,
  Compass,
  Repeat,
  LayoutGrid,
  AlertTriangle,
  History,
  Award,
  ScanLine,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { to: '/binders', icon: BookOpen, label: 'Binders', color: 'text-primary' },
  { to: '/goals', icon: Target, label: 'Goals', color: 'text-primary' },
  { to: '/timeline', icon: Clock, label: 'Timeline', color: 'text-primary' },
  { to: '/time-machine', icon: History, label: 'Time Machine', color: 'text-primary' },
  { to: '/hall-of-fame', icon: Award, label: 'Hall of Fame', color: 'text-gold' },
  { to: '/review-queue', icon: AlertTriangle, label: 'Review Queue', color: 'text-gold' },
  { to: '/room-scanner', icon: ScanLine, label: 'Room Scanner', color: 'text-primary' },
  { to: '/conventions', icon: MapPin, label: 'Shows', color: 'text-primary' },
  { to: '/leaderboards', icon: Trophy, label: 'Leaderboards', color: 'text-gold' },
  { to: '/community', icon: Users, label: 'Community', color: 'text-primary' },
  { to: '/collector-ai', icon: Sparkles, label: 'Collector AI', color: 'text-primary' },
  { to: '/data-quality', icon: ShieldCheck, label: 'Data Quality', color: 'text-gain' },
  { to: '/discover', icon: Compass, label: 'Discover', color: 'text-primary' },
  { to: '/trade-binder', icon: Repeat, label: 'Trade Binder', color: 'text-primary' },
  { to: '/collection', icon: LayoutGrid, label: 'Full Collection', color: 'text-primary' },
];

export default function QuickActionsSheet() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 py-2 px-2 min-w-[44px] text-muted-foreground transition-colors"
      >
        <LayoutGrid className="w-5 h-5" />
        <span className="text-[9px] font-medium">Quick</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-center">Quick Actions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3 mt-4 pb-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.to}
                  onClick={() => handleNavigate(action.to)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{action.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}