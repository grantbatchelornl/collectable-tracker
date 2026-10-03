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

  const immersiveAdd =
    location.pathname === '/add' ||
    location.pathname === '/add-collectible';

  return (
    <div
      className={`h-screen overflow-hidden ${
        immersiveAdd ? 'bg-[#070709]' : 'bg-background'
      }`}
    >
      {!immersiveAdd && <TopBar />}

      <main
        className={
          immersiveAdd
            ? 'h-screen w-full overflow-y-auto overscroll-y-contain bg-[#070709]'
            : 'pb-24 h-screen max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto overflow-y-auto overscroll-y-contain'
        }
        style={
          immersiveAdd
            ? {
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }
            : {
                paddingTop: 'calc(4rem + env(safe-area-inset-top))',
              }
        }
      >
        <div
          key={location.pathname}
          className={
            immersiveAdd
              ? 'min-h-full'
              : 'animate-in fade-in slide-in-from-right-2 duration-200'
          }
        >
          <Outlet />
        </div>
      </main>

      {!immersiveAdd && <BottomNav />}
      {!immersiveAdd && <FloatingAIButton />}
    </div>
  );
}