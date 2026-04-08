import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SUPABASE_URL as string | undefined);

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL: set VITE_SUPABASE_URL (or VITE_PUBLIC_SUPABASE_URL).');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key: set VITE_SUPABASE_ANON_KEY (or VITE_PUBLIC_SUPABASE_ANON_KEY).');
}

export const EDGE_FUNCTIONS_BASE_URL = `${supabaseUrl}/functions/v1`;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

type SupabaseSingleton = {
  supabase?: SupabaseClient;
};

const globalForSupabase = globalThis as typeof globalThis & SupabaseSingleton;

export const supabase =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

if (!globalForSupabase.supabase) {
  globalForSupabase.supabase = supabase;
}

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

// Listen for auth/session invalidation events
supabase.auth.onAuthStateChange((event) => {
  // 'TOKEN_REFRESH_FAILURE' is not a valid AuthChangeEvent in supabase-js.
  // A failed refresh ultimately results in SIGNED_OUT, so handle that event.
  if (event === 'SIGNED_OUT') {
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
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  const isExpired = session?.expires_at
    ? session.expires_at * 1000 <= Date.now() + 30_000
    : false;

  if (isExpired) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      throw new Error(refreshError?.message || 'Session expired. Please log in again.');
    }

    return refreshed.session.access_token;
  }

  if (!session || !session.access_token) {
    throw new Error("Not authenticated. Please log in again.");
  }

  return session.access_token;
}

function isUnauthorizedEdgeError(error: unknown): boolean {
  const err = error as {
    context?: { status?: number };
    status?: number;
    message?: string;
  };

  return (
    err?.context?.status === 401 ||
    err?.status === 401 ||
    /unauthorized|401/i.test(err?.message ?? '')
  );
}

/**
 * Invoke an authenticated edge function with one automatic retry on 401.
 */
export async function invokeAuthedEdgeFunction<T = unknown>(
  functionName: string,
  payload: unknown
): Promise<T> {
  // Ensures we have a valid access token first.
  await getAuthToken();

  const invoke = () => supabase.functions.invoke(functionName, { body: payload });

  let { data, error } = await invoke();

  if (error && isUnauthorizedEdgeError(error)) {
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError) {
      ({ data, error } = await invoke());
    }
  }

  if (error) {
    const edgeError = error as { context?: { status?: number }; message?: string };
    const statusSuffix = edgeError?.context?.status ? ` (HTTP ${edgeError.context.status})` : '';
    throw new Error((edgeError?.message || 'Edge function request failed') + statusSuffix);
  }

  return data as T;
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