import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function FloatingAIButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (
    location.pathname === '/collector-ai' ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/onboarding')
  ) return null;

  return (
    <button
      onClick={() => navigate('/collector-ai')}
      className="fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
      aria-label="Open Collector AI"
    >
      <Sparkles className="w-6 h-6" />
    </button>
  );
}