import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/theme';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';

// Route-level code splitting keeps feature-heavy screens out of the initial bundle.
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Home = lazy(() => import('@/pages/Home'));
const Discover = lazy(() => import('@/pages/Discover'));
const AddCollectible = lazy(() => import('@/pages/AddCollectible'));
const Scan = lazy(() => import('@/pages/Scan'));
const BulkScanner = lazy(() => import('@/pages/BulkScanner'));
const CollectorAI = lazy(() => import('@/pages/CollectorAI'));
const Leaderboards = lazy(() => import('@/pages/Leaderboards'));
const CommunityRankings = lazy(() => import('@/pages/CommunityRankings'));
const LeagueDetail = lazy(() => import('@/pages/LeagueDetail'));
const CollectionGoals = lazy(() => import('@/pages/CollectionGoals'));
const CollectionTimeline = lazy(() => import('@/pages/CollectionTimeline'));
const ConventionMode = lazy(() => import('@/pages/ConventionMode'));
const TradeBinder = lazy(() => import('@/pages/TradeBinder'));
const AIReviewQueue = lazy(() => import('@/pages/AIReviewQueue'));
const TimeMachine = lazy(() => import('@/pages/TimeMachine'));
const HallOfFame = lazy(() => import('@/pages/HallOfFame'));
const RoomScanner = lazy(() => import('@/pages/RoomScanner'));
const FoundingCollectors = lazy(() => import('@/pages/FoundingCollectors'));
const Settings = lazy(() => import('@/pages/Settings'));
const CollectibleDetail = lazy(() => import('@/pages/CollectibleDetail'));
const EditCollectible = lazy(() => import('@/pages/EditCollectible'));
const Messages = lazy(() => import('@/pages/Messages'));
const Chat = lazy(() => import('@/pages/Chat'));
const PublicProfile = lazy(() => import('@/pages/PublicProfile'));
const Profile = lazy(() => import('@/pages/Profile'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));
const DataQuality = lazy(() => import('@/pages/DataQuality'));
const Collection = lazy(() => import('@/pages/Collection'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const SupabaseAuthTest = lazy(() => import('@/pages/SupabaseAuthTest'));

const RouteFallback = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-background"
    role="status"
    aria-label="Loading page"
  >
    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/supabase-auth-test" element={<SupabaseAuthTest />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/login" replace />}
            />
          }
        >
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/add" element={<AddCollectible />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/bulk-scan" element={<BulkScanner />} />
            <Route path="/collector-ai" element={<CollectorAI />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/community" element={<CommunityRankings />} />
            <Route path="/league/:id" element={<LeagueDetail />} />
            <Route path="/goals" element={<CollectionGoals />} />
            <Route path="/timeline" element={<CollectionTimeline />} />
            <Route path="/conventions" element={<ConventionMode />} />
            <Route path="/trade-binder/:userId" element={<TradeBinder />} />
            <Route path="/review-queue" element={<AIReviewQueue />} />
            <Route path="/time-machine" element={<TimeMachine />} />
            <Route path="/hall-of-fame" element={<HallOfFame />} />
            <Route path="/room-scanner" element={<RoomScanner />} />
            <Route path="/founding-collectors" element={<FoundingCollectors />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/collectible/:id" element={<CollectibleDetail />} />
            <Route path="/collectible/:id/edit" element={<EditCollectible />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/collector/:userId" element={<PublicProfile />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/data-quality" element={<DataQuality />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  // Initialize the saved theme for every route, including logged-out pages.
  // New visitors with no saved preference default to Light Mode.
  useTheme();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
