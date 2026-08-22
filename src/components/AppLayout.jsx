import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
    <div className="h-screen overflow-hidden bg-background">
      <TopBar />
      <main className="pb-24 h-screen max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto overflow-y-auto overscroll-y-contain" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top))' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <FloatingAIButton />
    </div>
  );
}