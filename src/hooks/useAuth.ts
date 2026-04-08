import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, clearAllAuthStorage, type UserProfile } from '../lib/supabase';

const normalizeRole = (role?: string | null) => {
  if (!role) return '';
  return role === 'school-manager' ? 'school_manager' : role;
};

export function useAuth() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for avatar uploads so the header updates instantly without refresh
    function handleAvatarUpdate(e: Event) {
      const url = (e as CustomEvent<{ url: string }>).detail.url;
      setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    }
    window.addEventListener('gosmart:avatar-updated', handleAvatarUpdate);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearAllAuthStorage();
        setProfile(null);
        setLoading(false);
        navigate('/login');
      }
    });

    // Load profile from sessionStorage first for instant display
    const cachedName   = sessionStorage.getItem('user_name');
    const cachedEmail  = sessionStorage.getItem('user_email');
    const cachedRole   = sessionStorage.getItem('user_role');
    const cachedAvatar = sessionStorage.getItem('user_avatar_url');

    if (cachedName && cachedEmail && cachedRole) {
      setProfile({
        id: '',
        school_id: sessionStorage.getItem('user_school_id'),
        email: cachedEmail,
        full_name: cachedName,
        role: cachedRole,
        phone: null,
        avatar_url: cachedAvatar ?? null,
        is_active: true,
        must_change_password: false,
        registration_number: null,
        created_at: '',
        updated_at: '',
      });
    }

    // Then verify with Supabase
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        clearAllAuthStorage();
        setProfile(null);
        setLoading(false);
        navigate('/login');
        return;
      }
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setProfile(data as UserProfile);
            sessionStorage.setItem('user_name', data.full_name);
            sessionStorage.setItem('user_email', data.email);
            sessionStorage.setItem('user_role', normalizeRole(data.role));
            if (data.school_id) sessionStorage.setItem('user_school_id', data.school_id);
            if (data.avatar_url) sessionStorage.setItem('user_avatar_url', data.avatar_url);
          }
          setLoading(false);
        });
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('gosmart:avatar-updated', handleAvatarUpdate);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAllAuthStorage();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return { profile, loading, signOut, getInitials };
}
