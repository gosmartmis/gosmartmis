import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Clear all auth-related storage (localStorage + sessionStorage).
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

// Listen for auth failures
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
 * Sign in user
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Authentication failed.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error('No profile found.');
  if (!profile.is_active) throw new Error('Account is deactivated.');

  return profile as UserProfile;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  sessionStorage.clear();
}

/**
 * Get current user profile
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
 * ✅ FIXED TOKEN FUNCTION (IMPORTANT)
 */
export async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.access_token) {
    console.error("❌ No session found");
    throw new Error("Not authenticated. Please log in again.");
  }

  console.log("✅ SESSION TOKEN:", session.access_token);

  return session.access_token;
}

/**
 * Password reset
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });

  if (error) throw new Error(error.message);
}