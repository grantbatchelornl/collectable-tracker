import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

async function mapUser(authUser) {
  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load Supabase profile:', error);
  }

  return {
    id: authUser.id,
    email: authUser.email,
    role: profile?.role || authUser.user_metadata?.role || 'user',
    display_name:
      profile?.display_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      '',
    full_name:
      profile?.display_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    profile_photo:
      profile?.profile_photo ||
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      '',
    has_completed_onboarding: Boolean(profile?.has_completed_onboarding),
    is_suspended: Boolean(profile?.is_suspended),
    auth_provider: authUser.app_metadata?.provider || null,
    raw_user: authUser,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Kept temporarily for compatibility with existing app consumers.
  const [appPublicSettings] = useState({});
  const [isLoadingPublicSettings] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setAuthError({
          type: 'auth_error',
          message: error.message,
        });
      }

      const mapped = await mapUser(data?.session?.user ?? null);
      setUser(mapped);
      setIsAuthenticated(Boolean(mapped));
      setIsLoadingAuth(false);
      setAuthChecked(true);
    };

    initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const mapped = await mapUser(session?.user ?? null);
      setUser(mapped);
      setIsAuthenticated(Boolean(mapped));
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: 'auth_required',
        message: error.message,
      });
    } else {
      const mapped = await mapUser(data?.user ?? null);
      setUser(mapped);
      setIsAuthenticated(Boolean(mapped));
      setAuthError(null);
    }

    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const checkAppState = checkUserAuth;

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();

    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
