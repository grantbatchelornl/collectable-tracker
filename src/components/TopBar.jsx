import { Moon, Sun, Sparkles, MessageCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: '4rem' }}>
      <div className="flex items-center justify-between h-full px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base leading-none tracking-tight">COLLECTABLE</h1>
            <p className="text-[9px] text-muted-foreground leading-none tracking-[0.2em] mt-0.5">TRACKER</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}