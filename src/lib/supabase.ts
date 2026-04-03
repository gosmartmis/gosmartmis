import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Clear all auth-related storage (localStorage + sessionStorage).
 * Call this whenever a session becomes invalid.
 */
export function clearAllAuthStorage() {
  sessionStorage.clear();
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // ignore
  }
}

// Global listener — catches TOKEN_REFRESH_FAILURE from anywhere in the app
// and wipes stale tokens so the user gets redirected to login cleanly.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESH_FAILURE' || event === 'SIGNED_OUT') {
    clearAllAuthStorage();
  }
});

export type UserProfile = {
  id: string;
  school_id: string | null;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  must_change_password: boolean;
  registration_number: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Sign in with email and password, then fetch the user's profile.
 * Returns the profile (which contains the role) or throws an error.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Authentication failed. Please try again.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[supabase] Profile fetch error:', profileError);
    throw new Error(`Could not load your profile: ${profileError.message}. Contact your administrator.`);
  }
  if (!profile) throw new Error('No profile found for this account. Contact your administrator.');
  if (!profile.is_active) throw new Error('Your account has been deactivated. Contact your administrator.');

  return profile as UserProfile;
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  sessionStorage.clear();
}

/**
 * Get the currently authenticated user's profile.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return profile as UserProfile | null;
}

/**
 * Returns a guaranteed fresh access token by calling refreshSession() first.
 * Falls back to the cached session if refresh fails for a non-expiry reason.
 * Throws if the user is not authenticated at all.
 */
export async function getAuthToken(): Promise<string> {
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshed?.session?.access_token) return refreshed.session.access_token;

  // If refresh failed, try the existing (possibly still-valid) cached session
  if (refreshErr) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    throw new Error('Session expired. Please log in again.');
  }

  throw new Error('Not authenticated. Please log in again.');
}

/**
 * Send a password reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw new Error(error.message);
}
