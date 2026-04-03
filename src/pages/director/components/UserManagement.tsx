import { useState, useEffect, useCallback } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';
import BulkImportModal from './BulkImportModal';

interface SchoolUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  avatar_url: string | null;
}

interface ActionResult {
  userId: string;
  success: boolean;
  message: string;
  temp_password?: string | null;
  reset_link?: string;
}

interface DirectorCtx {
  school_id: string;
  school_name: string;
  school_slug: string;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  dean:       { label: 'Dean',        color: 'text-purple-700', bg: 'bg-purple-100', icon: 'ri-user-star-line' },
  registrar:  { label: 'Registrar',   color: 'text-teal-700',   bg: 'bg-teal-100',   icon: 'ri-file-list-line' },
  accountant: { label: 'Accountant',  color: 'text-amber-700',  bg: 'bg-amber-100',  icon: 'ri-money-dollar-circle-line' },
  teacher:    { label: 'Teacher',     color: 'text-blue-700',   bg: 'bg-blue-100',   icon: 'ri-booklet-line' },
  student:    { label: 'Student',     color: 'text-emerald-700',bg: 'bg-emerald-100',icon: 'ri-graduation-cap-line' },
};

const MANAGEABLE_ROLES = Object.keys(ROLE_META);

function roleBadge(role: string) {
  const m = ROLE_META[role];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.bg} ${m.color}`}>
      <i className={`${m.icon} text-xs`}></i> {m.label}
    </span>
  );
}

function initials(name: string, email: string) {
  const src = name || email;
  return src.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '??';
}

export default function UserManagement() {
  const [ctx, setCtx] = useState<DirectorCtx | null>(null);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Create form
  const [newRole, setNewRole] = useState('teacher');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchContext = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile?.school_id) return;
    const { data: school } = await supabase
      .from('schools')
      .select('name, slug')
      .eq('id', profile.school_id)
      .maybeSingle();
    setCtx({
      school_id: profile.school_id,
      school_name: school?.name ?? '',
      school_slug: school?.slug ?? '',
    });
  }, []);

  const fetchUsers = useCallback(async (schoolId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active, created_at, avatar_url')
      .eq('school_id', schoolId)
      .in('role', MANAGEABLE_ROLES)
      .order('role')
      .order('full_name');
    setUsers((data as SchoolUser[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  useEffect(() => {
    if (ctx?.school_id) fetchUsers(ctx.school_id);
  }, [ctx, fetchUsers]);

  const getToken = async () => getAuthToken();

  const callEdge = async (token: string, payload: object) => {
    const res = await fetch(
      `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-school-user`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Edge function error');
    return json;
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreate = async () => {
    if (!newEmail.trim() || !ctx) return;
    setCreateLoading(true);
    try {
      const token = await getToken();
      const json = await callEdge(token, {
        action: 'create',
        school_id: ctx.school_id,
        school_name: ctx.school_name,
        school_slug: ctx.school_slug,
        director_name: newName.trim() || newRole.charAt(0).toUpperCase() + newRole.slice(1),
        director_email: newEmail.trim(),
        target_role: newRole,
      });
      setResults((prev) => ({
        ...prev,
        [`create_${Date.now()}`]: {
          userId: json.user_id || '',
          success: true,
          message: json.user_already_existed
            ? `Account already existed — linked as ${newRole}.`
            : `${ROLE_META[newRole]?.label} account created!`,
          temp_password: json.temp_password,
          reset_link: json.reset_link,
        },
      }));
      setNewName('');
      setNewEmail('');
      setShowCreate(false);
      fetchUsers(ctx.school_id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleReset = async (u: SchoolUser) => {
    if (!ctx) return;
    setActionLoading(`reset_${u.id}`);
    try {
      const token = await getToken();
      const json = await callEdge(token, {
        action: 'reset_password',
        user_id: u.id,
        director_email: u.email,
        director_name: u.full_name,
        school_id: ctx.school_id,
        school_slug: ctx.school_slug,
        target_role: u.role,
      });
      setResults((prev) => ({
        ...prev,
        [u.id]: {
          userId: u.id,
          success: true,
          message: 'Password reset. Share credentials securely.',
          temp_password: json.temp_password,
          reset_link: json.reset_link,
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [u.id]: { userId: u.id, success: false, message: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggle = async (u: SchoolUser) => {
    if (!ctx) return;
    setActionLoading(`toggle_${u.id}`);
    try {
      const token = await getToken();
      const json = await callEdge(token, {
        action: 'toggle_active',
        user_id: u.id,
        is_active: u.is_active,
        director_email: u.email,
        director_name: u.full_name,
        school_id: ctx.school_id,
        school_name: ctx.school_name,
        target_role: u.role,
      });
      setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_active: json.is_active } : p));
      setResults((prev) => ({
        ...prev,
        [u.id]: {
          userId: u.id,
          success: true,
          message: json.is_active ? 'Account activated.' : 'Account deactivated.',
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [u.id]: { userId: u.id, success: false, message: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (u: SchoolUser) => {
    if (!ctx) return;
    setConfirmDelete(null);
    setActionLoading(`delete_${u.id}`);
    try {
      const token = await getToken();
      await callEdge(token, {
        action: 'delete',
        user_id: u.id,
        school_id: ctx.school_id,
        school_name: ctx.school_name,
        target_role: u.role,
      });
      setUsers((prev) => prev.filter((p) => p.id !== u.id));
      setResults((prev) => ({
        ...prev,
        [u.id]: { userId: u.id, success: true, message: 'Account deleted. All school data preserved.' },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [u.id]: { userId: u.id, success: false, message: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const roleCounts = MANAGEABLE_ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all staff and student accounts for your school
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-upload-line text-base text-teal-600"></i>
            Bulk Import
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
          >
            <i className="ri-user-add-line text-base"></i>
            Create Account
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setFilterRole('all')}
          className={`bg-white rounded-xl border p-3 flex items-center gap-3 cursor-pointer transition-all ${filterRole === 'all' ? 'border-teal-400 ring-1 ring-teal-300' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <i className="ri-team-line text-gray-600"></i>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{users.length}</div>
            <div className="text-xs text-gray-400">All Users</div>
          </div>
        </div>
        {MANAGEABLE_ROLES.map((r) => {
          const m = ROLE_META[r];
          return (
            <div
              key={r}
              onClick={() => setFilterRole(r)}
              className={`bg-white rounded-xl border p-3 flex items-center gap-3 cursor-pointer transition-all ${filterRole === r ? 'border-teal-400 ring-1 ring-teal-300' : 'border-gray-100 hover:border-gray-200'}`}
            >
              <div className={`w-9 h-9 ${m.bg} rounded-lg flex items-center justify-center shrink-0`}>
                <i className={`${m.icon} ${m.color}`}></i>
              </div>
              <div>
                <div className={`text-xl font-bold ${m.color}`}>{roleCounts[r] ?? 0}</div>
                <div className="text-xs text-gray-400">{m.label}s</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Account Banner - visible results */}
      {Object.values(results).filter((r) => r.userId.startsWith('create_') || !users.find((u) => u.id === r.userId)).map((res) => (
        <div key={res.userId} className={`rounded-xl border p-4 space-y-3 ${res.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className={`${res.success ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-red-600'}`}></i>
              <p className={`text-sm font-semibold ${res.success ? 'text-emerald-800' : 'text-red-700'}`}>{res.message}</p>
            </div>
            <button onClick={() => setResults((prev) => { const n = { ...prev }; delete n[res.userId]; return n; })} className="text-gray-400 hover:text-gray-600 cursor-pointer"><i className="ri-close-line"></i></button>
          </div>
          {res.temp_password && (
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-2.5">
              <code className="flex-1 text-sm font-mono font-bold text-gray-900">{res.temp_password}</code>
              <button onClick={() => copyText(res.temp_password!, `p_${res.userId}`)} className="px-2.5 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 cursor-pointer whitespace-nowrap">
                {copiedField === `p_${res.userId}` ? 'Copied!' : 'Copy Password'}
              </button>
            </div>
          )}
          {res.reset_link && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2.5">
              <input readOnly value={res.reset_link} className="flex-1 text-xs font-mono text-gray-700 bg-transparent truncate" />
              <button onClick={() => copyText(res.reset_link!, `l_${res.userId}`)} className="px-2.5 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 cursor-pointer whitespace-nowrap">
                {copiedField === `l_${res.userId}` ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
          <span className="text-sm">Loading accounts…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="ri-team-line text-2xl text-gray-300"></i>
          </div>
          <p className="text-sm text-gray-400 font-medium">No accounts found</p>
          <p className="text-xs text-gray-400">
            {users.length === 0 ? 'Create accounts to give staff and students portal access.' : 'Try adjusting your search or role filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const res = results[u.id];
                  const isResetting = actionLoading === `reset_${u.id}`;
                  const isToggling = actionLoading === `toggle_${u.id}`;
                  const isDeleting = actionLoading === `delete_${u.id}`;
                  const isBusy = isResetting || isToggling || isDeleting;

                  return (
                    <>
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.full_name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {initials(u.full_name, u.email)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{u.full_name || '—'}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">{roleBadge(u.role)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            <i className={u.is_active ? 'ri-checkbox-circle-line' : 'ri-forbid-line'}></i>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">{fmtDate(u.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset Password */}
                            <button
                              onClick={() => handleReset(u)}
                              disabled={isBusy}
                              title="Reset Password"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {isResetting ? <div className="w-3 h-3 border border-amber-400 border-t-amber-600 rounded-full animate-spin"></div> : <i className="ri-lock-password-line text-sm"></i>}
                            </button>
                            {/* Toggle Active */}
                            <button
                              onClick={() => handleToggle(u)}
                              disabled={isBusy}
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-40 ${u.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            >
                              {isToggling ? <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div> : <i className={`text-sm ${u.is_active ? 'ri-forbid-line' : 'ri-checkbox-circle-line'}`}></i>}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              disabled={isBusy}
                              title="Delete Account"
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              {isDeleting ? <div className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin"></div> : <i className="ri-delete-bin-line text-sm"></i>}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Action result row */}
                      {res && (
                        <tr key={`${u.id}-res`} className={res.success ? 'bg-emerald-50/50' : 'bg-red-50/50'}>
                          <td colSpan={5} className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <i className={`text-sm ${res.success ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-red-600'}`}></i>
                                <span className="text-xs font-medium text-gray-700">{res.message}</span>
                              </div>
                              {res.temp_password && (
                                <div className="flex items-center gap-1.5">
                                  <code className="px-2 py-0.5 bg-white border border-amber-200 rounded text-xs font-mono font-bold">{res.temp_password}</code>
                                  <button onClick={() => copyText(res.temp_password!, `pw_${u.id}`)} className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 cursor-pointer whitespace-nowrap">
                                    {copiedField === `pw_${u.id}` ? 'Copied!' : 'Copy'}
                                  </button>
                                </div>
                              )}
                              {res.reset_link && (
                                <button onClick={() => copyText(res.reset_link!, `rl_${u.id}`)} className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 cursor-pointer whitespace-nowrap">
                                  {copiedField === `rl_${u.id}` ? 'Link Copied!' : 'Copy Reset Link'}
                                </button>
                              )}
                              <button onClick={() => setResults((prev) => { const n = { ...prev }; delete n[u.id]; return n; })} className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer">Dismiss</button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Confirm delete row */}
                      {confirmDelete === u.id && (
                        <tr key={`${u.id}-confirm`} className="bg-red-50/70">
                          <td colSpan={5} className="px-5 py-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <i className="ri-error-warning-line text-red-500"></i>
                              <span className="text-xs text-red-700 font-medium flex-1">
                                Delete <strong>{u.full_name || u.email}</strong>? All school data stays intact.
                              </span>
                              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
                              <button onClick={() => handleDelete(u)} className="px-3 py-1.5 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer whitespace-nowrap">Yes, Delete</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            <i className="ri-shield-check-line mr-1 text-teal-500"></i>
            {filtered.length} account{filtered.length !== 1 ? 's' : ''} — all account actions are logged for accountability.
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && ctx && (
        <BulkImportModal
          schoolId={ctx.school_id}
          schoolName={ctx.school_name}
          onClose={() => setShowBulkImport(false)}
          onImported={() => { fetchUsers(ctx.school_id); }}
        />
      )}

      {/* Create Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                  <i className="ri-user-add-line text-teal-600"></i>
                </div>
                <h2 className="text-base font-semibold text-gray-900">Create Account</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <i className="ri-close-line text-xl text-gray-500"></i>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {MANAGEABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_META[r].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`e.g. ${newRole === 'student' ? 'Alice Mukamana' : 'Dr. Jean Bosco'}`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={`${newRole}@yourschool.com`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">This will be their login username</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <i className="ri-information-line text-amber-600 text-sm shrink-0 mt-0.5"></i>
                <p className="text-xs text-amber-700">
                  A temporary password will be generated. Share it securely with the {ROLE_META[newRole]?.label}.
                  This action will be logged in the school audit trail.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading || !newEmail.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {createLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Creating…</>
                ) : (
                  <><i className="ri-user-add-line"></i>Create {ROLE_META[newRole]?.label}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
