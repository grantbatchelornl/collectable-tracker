import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import SuspendedScreen from './SuspendedScreen';
import FloatingAIButton from './FloatingAIButton';

export default function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && !user.has_completed_onboarding && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (user?.is_suspended) return <SuspendedScreen />;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-16 pb-24 min-h-screen max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
      <FloatingAIButton />
    </div>
  );
}