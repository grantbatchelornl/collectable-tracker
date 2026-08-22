import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, LayoutGrid, ScanLine, Users, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/collection', icon: LayoutGrid, label: 'Collection', tabRoot: '/collection' },
  { to: '/scan', icon: ScanLine, label: 'Scan', isCenter: true },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/profile', icon: User, label: 'Profile', tabRoot: '/profile' },
];

const TAB_PREFIXES = {
  '/collection': ['/collection'],
  '/profile': ['/profile', '/settings'],
};

const CACHE_KEY = 'b44_tab_route_cache';

function getTabRoot(pathname) {
  for (const [root, prefixes] of Object.entries(TAB_PREFIXES)) {
    if (prefixes.some((p) => pathname.startsWith(p))) {
      return root;
    }
  }
  return null;
}

function getCachedRoute(tabRoot) {
  try {
    const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
    return cache[tabRoot] || null;
  } catch {
    return null;
  }
}

function setCachedRoute(tabRoot, path) {
  try {
    const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
    cache[tabRoot] = path;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function isTabActive(pathname, item) {
  if (item.to === '/') return pathname === '/';
  if (item.tabRoot) return getTabRoot(pathname) === item.tabRoot;
  return pathname === item.to || pathname.startsWith(item.to);
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Cache the last visited sub-route for each tabbed section
  useEffect(() => {
    const tabRoot = getTabRoot(location.pathname);
    if (tabRoot) {
      setCachedRoute(tabRoot, location.pathname);
    }
  }, [location.pathname]);

  const handleNav = (item) => {
    const isOnTab = item.tabRoot
      ? getTabRoot(location.pathname) === item.tabRoot
      : location.pathname === item.to;

    if (isOnTab) {
      if (location.pathname === item.to) {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(item.to);
      }
    } else {
      const target = item.tabRoot ? getCachedRoute(item.tabRoot) || item.to : item.to;
      navigate(target);
    }
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const active = isTabActive(location.pathname, item);

    if (item.isCenter) {
      return (
        <button
          key={item.to}
          onClick={() => handleNav(item)}
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
      <button
        key={item.to}
        onClick={() => handleNav(item)}
        aria-label={item.label}
        className={`flex flex-col items-center gap-1 py-2 px-2 min-w-[44px] min-h-[44px] transition-colors ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-end justify-around h-16 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-1">
        {NAV_ITEMS.map(renderNavItem)}
      </div>
    </nav>
  );
}