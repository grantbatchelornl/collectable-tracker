import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, ScanLine, User, Settings, BookOpen } from 'lucide-react';
import QuickActionsSheet from './QuickActionsSheet';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/collection', icon: LayoutGrid, label: 'Collection' },
  { to: '/add', icon: ScanLine, label: 'Scan', isCenter: true },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/binders', icon: BookOpen, label: 'Binders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          if (item.isCenter) {
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center -mt-6"
                aria-label="Scan collectible"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-background">
                  <Icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </button>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 px-2 min-w-[44px] transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        <QuickActionsSheet />
        {NAV_ITEMS.slice(4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 px-2 min-w-[44px] transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}