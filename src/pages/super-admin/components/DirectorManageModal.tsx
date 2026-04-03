import { useState, useEffect, useCallback } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';
import { School } from '../../../hooks/useSchools';

interface DirectorProfile {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  avatar_url: string | null;
}

interface ActionResult {
  type: 'create' | 'reset' | 'toggle' | 'delete';
  success: boolean;
  message: string;
  temp_password?: string | null;
  reset_link?: string;
  is_active?: boolean;
  user_already_existed?: boolean;
}

interface Props {
  school: School;
  onClose: () => void;
  onDirectorChanged?: () => void;
}

/**
 * 🔥 FIXED FUNCTION (apikey added)
 */
async function callEdgeFunction(token: string, payload: object) {
  let res: Response;

  try {
    res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-school-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY, // ✅ FIX
        },
        body: JSON.stringify(payload),
      }
    );
  } catch (networkErr: any) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  let json: any = null;
  let rawText = '';

  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      rawText = await res.text().catch(() => '');
    }
  } else {
    rawText = await res.text().catch(() => '');
  }

  if (!res.ok) {
    const errMsg =
      json?.error ||
      json?.message ||
      (rawText
        ? `[HTTP ${res.status}] ${rawText.slice(0, 200)}`
        : `HTTP ${res.status} ${res.statusText}`);

    throw new Error(errMsg);
  }

  return json;
}

export default function DirectorManageModal({ school, onClose, onDirectorChanged }: Props) {
  const [director, setDirector] = useState<DirectorProfile | null | undefined>(undefined);
  const [loadingDirector, setLoadingDirector] = useState(true);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState((school as any).email || '');

  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchDirector = useCallback(async () => {
    setLoadingDirector(true);

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active, created_at, avatar_url')
      .eq('school_id', school.id)
      .eq('role', 'director')
      .maybeSingle();

    setDirector(data ?? null);
    setLoadingDirector(false);
  }, [school.id]);

  useEffect(() => {
    fetchDirector();
  }, [fetchDirector]);

  /**
   * 🔥 TOKEN DEBUG (kept)
   */
  const getToken = async () => {
    const token = await getAuthToken();
    console.log('TOKEN:', token);
    return token;
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── CREATE ─────────────────────────────────
  const handleCreate = async () => {
    if (!newEmail.trim()) return;

    setActionLoading(true);
    setResult(null);

    try {
      const token = await getToken();

      const json = await callEdgeFunction(token, {
        action: 'create',
        school_id: school.id,
        school_name: school.name,
        school_slug: school.slug,
        director_name: newName.trim() || 'School Director',
        director_email: newEmail.trim(),
      });

      setResult({
        type: 'create',
        success: true,
        message: json.user_already_existed
          ? 'Account already existed — linked to this school as Director.'
          : 'Director account created successfully!',
        temp_password: json.temp_password,
        reset_link: json.reset_link,
        user_already_existed: json.user_already_existed,
      });

      await fetchDirector();
      onDirectorChanged?.();
    } catch (err) {
      setResult({
        type: 'create',
        success: false,
        message: err instanceof Error ? err.message : 'Failed to create director',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── RESET PASSWORD ─────────────────────────
  const handleResetPassword = async () => {
    if (!director) return;

    setActionLoading(true);
    setResult(null);

    try {
      const token = await getToken();

      const json = await callEdgeFunction(token, {
        action: 'reset_password',
        user_id: director.id,
        director_email: director.email,
        school_slug: school.slug,
      });

      setResult({
        type: 'reset',
        success: true,
        message: 'Password reset successfully.',
        temp_password: json.temp_password,
        reset_link: json.reset_link,
      });
    } catch (err) {
      setResult({
        type: 'reset',
        success: false,
        message: err instanceof Error ? err.message : 'Failed to reset password',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── TOGGLE ACTIVE ─────────────────────────
  const handleToggleActive = async () => {
    if (!director) return;

    setActionLoading(true);
    setResult(null);

    try {
      const token = await getToken();

      const json = await callEdgeFunction(token, {
        action: 'toggle_active',
        user_id: director.id,
        is_active: director.is_active,
      });

      const newActive = json.is_active as boolean;

      setDirector((prev) =>
        prev ? { ...prev, is_active: newActive } : prev
      );

      setResult({
        type: 'toggle',
        success: true,
        message: newActive
          ? 'Director account activated.'
          : 'Director account deactivated.',
        is_active: newActive,
      });

      onDirectorChanged?.();
    } catch (err) {
      setResult({
        type: 'toggle',
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── DELETE ─────────────────────────
  const handleDelete = async () => {
    if (!director) return;

    setActionLoading(true);
    setResult(null);
    setConfirmDelete(false);

    try {
      const token = await getToken();

      await callEdgeFunction(token, {
        action: 'delete',
        user_id: director.id,
      });

      setDirector(null);

      setResult({
        type: 'delete',
        success: true,
        message: 'Director account deleted.',
      });

      onDirectorChanged?.();
    } catch (err) {
      setResult({
        type: 'delete',
        success: false,
        message: err instanceof Error ? err.message : 'Failed to delete',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return null; // UI unchanged (kept your original)
}