import { Moon, Sun, Sparkles, MessageCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import QuickActionsSheet from './QuickActionsSheet';

export default function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-[#080704]/90 backdrop-blur-2xl border-b border-[#d8b570]/20 shadow-[0_8px_32px_rgba(0,0,0,0.28)]"
      style={{ paddingTop: 'env(safe-area-inset-top)', minHeight: '4rem' }}
    >
      <div className="flex items-center justify-between h-full px-4 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl border border-[#d8b570]/35 bg-gradient-to-br from-[#2a2112] to-[#0d0b07] flex items-center justify-center shadow-[0_0_24px_rgba(216,181,112,0.12)]">
            <Sparkles className="w-5 h-5 text-[#e3c486]" />
          </div>
          <div className="text-left">
            <h1 className="font-display font-bold text-base leading-none tracking-tight text-[#f4ead5]">COLLECTABLE</h1>
            <p className="text-[9px] text-[#b99a61] leading-none tracking-[0.24em] mt-0.5">TRACKER</p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <QuickActionsSheet />
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-transparent text-[#cfc4ae] flex items-center justify-center hover:text-[#e3c486] hover:bg-[#d8b570]/10 hover:border-[#d8b570]/20 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="w-10 h-10 rounded-full border border-transparent text-[#cfc4ae] flex items-center justify-center hover:text-[#e3c486] hover:bg-[#d8b570]/10 hover:border-[#d8b570]/20 transition-all"
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