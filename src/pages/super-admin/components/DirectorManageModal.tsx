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

async function callEdgeFunction(token: string, payload: object) {
  let res: Response;
  try {
    res = await fetch(
      `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-school-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      (rawText ? `[HTTP ${res.status}] ${rawText.slice(0, 200)}` : `HTTP ${res.status} ${res.statusText}`);
    throw new Error(errMsg);
  }

  return json;
}

export default function DirectorManageModal({ school, onClose, onDirectorChanged }: Props) {
  const [director, setDirector] = useState<DirectorProfile | null | undefined>(undefined);
  const [loadingDirector, setLoadingDirector] = useState(true);

  // Form state for creating a director
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState((school as any).email || '');

  // Action state
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

  const getToken = async () => getAuthToken();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Create Director ────────────────────────────────────────────────────────
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

  // ── Reset Password ─────────────────────────────────────────────────────────
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

  // ── Toggle Active ──────────────────────────────────────────────────────────
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
      setDirector((prev) => prev ? { ...prev, is_active: newActive } : prev);
      setResult({
        type: 'toggle',
        success: true,
        message: newActive
          ? 'Director account activated. They can now log in.'
          : 'Director account deactivated. They cannot log in until reactivated.',
        is_active: newActive,
      });
      onDirectorChanged?.();
    } catch (err) {
      setResult({
        type: 'toggle',
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update account status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete Director ────────────────────────────────────────────────────────
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
        message: 'Director account deleted. All school data (students, marks, reports) is preserved.',
      });
      onDirectorChanged?.();
    } catch (err) {
      setResult({
        type: 'delete',
        success: false,
        message: err instanceof Error ? err.message : 'Failed to delete director',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
              <i className="ri-user-settings-line text-teal-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Manage Director Account</h2>
              <p className="text-xs text-gray-500">{school.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1">

          {/* Loading state */}
          {loadingDirector && (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
              <span className="text-sm">Looking up director account…</span>
            </div>
          )}

          {/* ── Existing director card ── */}
          {!loadingDirector && director && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              {director.avatar_url ? (
                <img
                  src={director.avatar_url}
                  alt={director.full_name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials(director.full_name || director.email)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {director.full_name || '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    director.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {director.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">{director.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">Account since {fmt(director.created_at)}</div>
              </div>
            </div>
          )}

          {/* ── No director — create form ── */}
          {!loadingDirector && director === null && !result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <i className="ri-user-add-line text-amber-600 text-base shrink-0 mt-0.5"></i>
                <p className="text-xs text-amber-700">
                  No Director account found for <strong>{school.name}</strong>. Create one below to give access to the school portal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Director&apos;s Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Marie Uwimana"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Director&apos;s Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="director@school.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">This will be their login username</p>
              </div>

              <button
                onClick={handleCreate}
                disabled={actionLoading || !newEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {actionLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Creating…</>
                ) : (
                  <><i className="ri-user-add-line"></i>Create Director Account</>
                )}
              </button>
            </div>
          )}

          {/* ── Action Result ── */}
          {result && (
            <div className={`rounded-xl border p-4 space-y-3 ${
              result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <i className={`text-base ${
                  result.success ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-red-600'
                }`}></i>
                <p className={`text-sm font-semibold ${result.success ? 'text-emerald-800' : 'text-red-700'}`}>
                  {result.message}
                </p>
              </div>

              {/* Temp password display */}
              {result.temp_password && (
                <div className="bg-white border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    <i className="ri-key-line mr-1"></i>Temporary Password — Share Securely
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-gray-900 tracking-wide">
                      {result.temp_password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(result.temp_password!, 'password')}
                      className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {copiedField === 'password' ? (
                        <><i className="ri-check-line"></i> Copied!</>
                      ) : (
                        <><i className="ri-clipboard-line"></i> Copy</>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 mt-1.5">Director should change this after first login.</p>
                </div>
              )}

              {/* Reset link */}
              {result.reset_link && (
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    <i className="ri-link-m mr-1"></i>Password Reset Link (expires in 24h)
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={result.reset_link}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate"
                    />
                    <button
                      onClick={() => copyToClipboard(result.reset_link!, 'link')}
                      className="px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {copiedField === 'link' ? (
                        <><i className="ri-check-line"></i> Copied!</>
                      ) : (
                        <><i className="ri-clipboard-line"></i> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setResult(null)}
                className="text-xs text-gray-500 hover:text-gray-700 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* ── Action Buttons for existing director ── */}
          {!loadingDirector && director && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Actions</h3>

              {/* Reset Password */}
              <button
                onClick={handleResetPassword}
                disabled={actionLoading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="w-9 h-9 bg-amber-50 group-hover:bg-amber-100 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                  <i className="ri-lock-password-line text-amber-600 text-base"></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800">Reset Password</p>
                  <p className="text-xs text-gray-500">Generate a new temporary password + reset link</p>
                </div>
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin shrink-0"></div>
                ) : (
                  <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-amber-500 transition-colors shrink-0"></i>
                )}
              </button>

              {/* Activate / Deactivate */}
              <button
                onClick={handleToggleActive}
                disabled={actionLoading}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-white border rounded-xl transition-all group cursor-pointer disabled:opacity-50 ${
                  director.is_active
                    ? 'border-gray-200 hover:bg-red-50 hover:border-red-300'
                    : 'border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  director.is_active ? 'bg-red-50 group-hover:bg-red-100' : 'bg-emerald-50 group-hover:bg-emerald-100'
                }`}>
                  <i className={`text-base ${director.is_active ? 'ri-forbid-line text-red-500' : 'ri-checkbox-circle-line text-emerald-600'}`}></i>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800">
                    {director.is_active ? 'Deactivate Account' : 'Activate Account'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {director.is_active
                      ? 'Block this director from logging in (data stays safe)'
                      : 'Restore login access for this director'}
                  </p>
                </div>
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin shrink-0"></div>
                ) : (
                  <i className={`ri-arrow-right-s-line transition-colors shrink-0 ${
                    director.is_active ? 'text-gray-400 group-hover:text-red-500' : 'text-gray-400 group-hover:text-emerald-500'
                  }`}></i>
                )}
              </button>

              {/* Delete Account */}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-9 h-9 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                    <i className="ri-delete-bin-line text-red-500 text-base"></i>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-red-700">Delete Director Account</p>
                    <p className="text-xs text-gray-500">Remove login access. School data stays intact.</p>
                  </div>
                  <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-red-500 transition-colors shrink-0"></i>
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <i className="ri-error-warning-line text-red-500 text-base shrink-0 mt-0.5"></i>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Are you absolutely sure?</p>
                      <p className="text-xs text-red-600 mt-1">
                        This will permanently delete the director login for <strong>{director.full_name || director.email}</strong>.
                        All school data (students, marks, reports, etc.) will remain untouched.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="flex-1 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? (
                        <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Deleting…</>
                      ) : (
                        <><i className="ri-delete-bin-line"></i>Yes, Delete Account</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── No director + after delete: show create form ── */}
          {!loadingDirector && director === null && result?.type === 'delete' && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                You can now create a new Director account for this school:
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Director&apos;s Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Marie Uwimana"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Director&apos;s Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="director@school.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={actionLoading || !newEmail.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {actionLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Creating…</>
                ) : (
                  <><i className="ri-user-add-line"></i>Create New Director Account</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            <i className="ri-shield-check-line mr-1 text-teal-500"></i>
            School data is never deleted by these actions.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
