import { supabase } from './supabaseClient';

export async function signUpWithEmail(email, password) {
  return supabase.auth.signUp({
    email,
    password,
  });
}

export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithGoogle(redirectPath = '/supabase-auth-test') {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectPath}`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return {
    user: data?.user ?? null,
    error,
  };
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}
