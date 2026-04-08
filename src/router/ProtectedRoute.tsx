import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { supabase, clearAllAuthStorage } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const normalizeRole = (role?: string | null) => {
  if (!role) return '';
  return role === 'school-manager' ? 'school_manager' : role;
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { schoolId } = useTenant();

  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'wrong_tenant' | 'must_change_password'>('loading');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Handle token refresh failures — wipe storage and mark as unauthenticated
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESH_FAILURE' || event === 'SIGNED_OUT') {
        clearAllAuthStorage();
        if (!cancelled) setAuthState('unauthenticated');
      }
    });

    const verify = async () => {
      // Always verify with Supabase; sessionStorage is treated as cache only.
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          clearAllAuthStorage();
          if (!cancelled) setAuthState('unauthenticated');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email, full_name, school_id, must_change_password')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          clearAllAuthStorage();
          if (!cancelled) setAuthState('unauthenticated');
          return;
        }

        // Check must_change_password before anything else
        if (profile.must_change_password) {
          sessionStorage.setItem('must_change_password', 'true');
          if (!cancelled) setAuthState('must_change_password');
          return;
        }
        sessionStorage.removeItem('must_change_password');

        const normalizedRole = normalizeRole(profile.role);

        // Super-admin bypasses all tenant checks
        if (normalizedRole === 'super-admin') {
          sessionStorage.setItem('user_role', normalizedRole);
          sessionStorage.setItem('user_email', profile.email);
          sessionStorage.setItem('user_name', profile.full_name);
          if (!cancelled) {
            setUserRole(normalizedRole);
            setAuthState('authenticated');
          }
          return;
        }

        // Tenant isolation for school users
        if (schoolId && profile.school_id !== schoolId) {
          clearAllAuthStorage();
          if (!cancelled) setAuthState('wrong_tenant');
          return;
        }

        sessionStorage.setItem('user_role', normalizedRole);
        sessionStorage.setItem('user_email', profile.email);
        sessionStorage.setItem('user_name', profile.full_name);
        if (profile.school_id) sessionStorage.setItem('user_school_id', profile.school_id);

        if (!cancelled) {
          setUserRole(normalizedRole);
          setAuthState('authenticated');
        }
      } catch (err) {
        clearAllAuthStorage();
        if (!cancelled) setAuthState('unauthenticated');
      }
    };

    verify();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [schoolId]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin" />
          <p className="text-sm text-gray-500">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (authState === 'wrong_tenant') {
    return <Navigate to="/login?reason=wrong_school" replace />;
  }

  if (authState === 'must_change_password') {
    return <Navigate to="/login?must_change=1" replace />;
  }

  const normalizedAllowedRoles = allowedRoles.map((r) => normalizeRole(r));

  if (userRole && !normalizedAllowedRoles.includes(normalizeRole(userRole))) {
    const roleRoutes: Record<string, string> = {
      'super-admin': '/super-admin',
      'director': '/director',
      'school_manager': '/school-manager',
      'dean': '/dean',
      'registrar': '/registrar',
      'accountant': '/accountant',
      'teacher': '/teacher',
      'student': '/student',
    };
    return <Navigate to={roleRoutes[normalizeRole(userRole)] || '/login'} replace />;
  }

  return <>{children}</>;
}
