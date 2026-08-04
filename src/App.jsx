import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Onboarding from '@/pages/Onboarding';
import Home from '@/pages/Home';
import Discover from '@/pages/Discover';
import AddCollectible from '@/pages/AddCollectible';
import BinderScanner from '@/pages/BinderScanner';
import CollectorAI from '@/pages/CollectorAI';
import Leaderboards from '@/pages/Leaderboards';
import CommunityRankings from '@/pages/CommunityRankings';
import LeagueDetail from '@/pages/LeagueDetail';
import CollectionGoals from '@/pages/CollectionGoals';
import CollectionTimeline from '@/pages/CollectionTimeline';
import ConventionMode from '@/pages/ConventionMode';
import TradeBinder from '@/pages/TradeBinder';
import Binders from '@/pages/Binders';
import BinderDetail from '@/pages/BinderDetail';
import Settings from '@/pages/Settings';
import CollectibleDetail from '@/pages/CollectibleDetail';
import EditCollectible from '@/pages/EditCollectible';
import Messages from '@/pages/Messages';
import Chat from '@/pages/Chat';
import PublicProfile from '@/pages/PublicProfile';
import Profile from '@/pages/Profile';
import Watchlist from '@/pages/Watchlist';
import DataQuality from '@/pages/DataQuality';
import Collection from '@/pages/Collection';
import AdminDashboard from '@/pages/AdminDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/add" element={<AddCollectible />} />
          <Route path="/binder-scan" element={<BinderScanner />} />
          <Route path="/collector-ai" element={<CollectorAI />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/community" element={<CommunityRankings />} />
          <Route path="/league/:id" element={<LeagueDetail />} />
          <Route path="/goals" element={<CollectionGoals />} />
          <Route path="/timeline" element={<CollectionTimeline />} />
          <Route path="/conventions" element={<ConventionMode />} />
          <Route path="/trade-binder/:userId" element={<TradeBinder />} />
          <Route path="/binders" element={<Binders />} />
          <Route path="/binder/:id" element={<BinderDetail />} />
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
  );
};


function App() {

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
  )
}

export default App