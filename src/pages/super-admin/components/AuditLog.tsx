import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

interface AuditEntry {
  id: string;
  created_at: string;
  admin_id: string | null;
  admin_email: string | null;
  admin_name: string | null;
  action_type: string;
  target_user_id: string | null;
  target_email: string | null;
  target_name: string | null;
  school_id: string | null;
  school_name: string | null;
  details: Record<string, unknown>;
  status: 'success' | 'error';
  performed_by_role: string | null;
  target_role: string | null;
}

const ACTION_META: Record<string, { label: string; icon: string; color: string; bg: string; badge: string }> = {
  // Legacy: super-admin managing directors
  director_created:        { label: 'Director Created',    icon: 'ri-user-add-line',         color: 'text-emerald-700', bg: 'bg-emerald-50',  badge: 'bg-emerald-100 text-emerald-700' },
  director_reset_password: { label: 'Director Pwd Reset',  icon: 'ri-lock-password-line',    color: 'text-amber-700',   bg: 'bg-amber-50',    badge: 'bg-amber-100 text-amber-700' },
  director_activated:      { label: 'Director Activated',  icon: 'ri-checkbox-circle-line',  color: 'text-teal-700',    bg: 'bg-teal-50',     badge: 'bg-teal-100 text-teal-700' },
  director_deactivated:    { label: 'Director Deactivated',icon: 'ri-forbid-line',           color: 'text-red-600',     bg: 'bg-red-50',      badge: 'bg-red-100 text-red-600' },
  director_deleted:        { label: 'Director Deleted',    icon: 'ri-delete-bin-line',       color: 'text-rose-700',    bg: 'bg-rose-50',     badge: 'bg-rose-100 text-rose-700' },
  // New: any role managed by director or super-admin
  user_created:            { label: 'Account Created',     icon: 'ri-user-add-line',         color: 'text-emerald-700', bg: 'bg-emerald-50',  badge: 'bg-emerald-100 text-emerald-700' },
  user_reset_password:     { label: 'Password Reset',      icon: 'ri-lock-password-line',    color: 'text-amber-700',   bg: 'bg-amber-50',    badge: 'bg-amber-100 text-amber-700' },
  user_activated:          { label: 'Account Activated',   icon: 'ri-checkbox-circle-line',  color: 'text-teal-700',    bg: 'bg-teal-50',     badge: 'bg-teal-100 text-teal-700' },
  user_deactivated:        { label: 'Account Deactivated', icon: 'ri-forbid-line',           color: 'text-red-600',     bg: 'bg-red-50',      badge: 'bg-red-100 text-red-600' },
  user_deleted:            { label: 'Account Deleted',     icon: 'ri-delete-bin-line',       color: 'text-rose-700',    bg: 'bg-rose-50',     badge: 'bg-rose-100 text-rose-700' },
};

const ROLE_LABELS: Record<string, string> = {
  dean: 'Dean', registrar: 'Registrar', accountant: 'Accountant',
  teacher: 'Teacher', student: 'Student', director: 'Director',
};

const ALL_ACTIONS = Object.keys(ACTION_META);

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60)  return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function DetailBadge({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 font-mono">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-800">{String(value)}</span>
    </span>
  );
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDays, setFilterDays] = useState('30');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date();
      const daysNum = parseInt(filterDays, 10);
      if (!isNaN(daysNum)) since.setDate(since.getDate() - daysNum);

      const { data, error: fetchErr } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (fetchErr) throw fetchErr;
      setEntries((data as AuditEntry[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filterDays]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      const matchSearch =
        !q ||
        (e.admin_email ?? '').toLowerCase().includes(q) ||
        (e.admin_name ?? '').toLowerCase().includes(q) ||
        (e.target_email ?? '').toLowerCase().includes(q) ||
        (e.target_name ?? '').toLowerCase().includes(q) ||
        (e.school_name ?? '').toLowerCase().includes(q);
      const matchAction = filterAction === 'all' || e.action_type === filterAction;
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchSearch && matchAction && matchStatus;
    });
  }, [entries, search, filterAction, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: entries.length,
    created: entries.filter((e) => e.action_type === 'director_created').length,
    resets: entries.filter((e) => e.action_type === 'director_reset_password').length,
    toggles: entries.filter((e) => e.action_type === 'director_activated' || e.action_type === 'director_deactivated').length,
    deleted: entries.filter((e) => e.action_type === 'director_deleted').length,
    errors: entries.filter((e) => e.status === 'error').length,
  }), [entries]);

  const exportCSV = () => {
    const cols = ['Timestamp', 'Action', 'Status', 'Admin', 'Admin Email', 'Target Name', 'Target Email', 'School', 'Details'];
    const rows = filtered.map((e) => [
      fmtFull(e.created_at),
      ACTION_META[e.action_type]?.label ?? e.action_type,
      e.status,
      e.admin_name ?? '',
      e.admin_email ?? '',
      e.target_name ?? '',
      e.target_email ?? '',
      e.school_name ?? '',
      JSON.stringify(e.details ?? {}),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Director account actions — who did what, when
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <i className={`ri-refresh-line text-base ${loading ? 'animate-spin' : ''}`}></i>
          </button>
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line text-base"></i>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Events', value: stats.total, icon: 'ri-history-line', color: 'text-gray-700', bg: 'bg-gray-100' },
          { label: 'Created', value: stats.created, icon: 'ri-user-add-line', color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Pwd Resets', value: stats.resets, icon: 'ri-lock-password-line', color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Toggles', value: stats.toggles, icon: 'ri-toggle-line', color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'Deleted', value: stats.deleted, icon: 'ri-delete-bin-line', color: 'text-rose-700', bg: 'bg-rose-50' },
          { label: 'Errors', value: stats.errors, icon: 'ri-error-warning-line', color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center shrink-0`}>
              <i className={`${s.icon} ${s.color} text-lg`}></i>
            </div>
            <div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search admin, director, school…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Actions</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>{ACTION_META[a]?.label ?? a}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
          <select
            value={filterDays}
            onChange={(e) => { setFilterDays(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="3650">All time</option>
          </select>
        </div>

        {filtered.length !== entries.length && (
          <p className="text-xs text-gray-400 mt-3">
            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of{' '}
            <span className="font-semibold text-gray-700">{entries.length}</span> events
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
          <span className="text-sm">Loading audit log…</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <i className="ri-error-warning-line text-xl shrink-0"></i>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <i className="ri-history-line text-3xl text-gray-300"></i>
          </div>
          <p className="text-sm text-gray-400 font-medium">No audit events found</p>
          <p className="text-xs text-gray-400">
            {entries.length === 0
              ? 'Director account actions will appear here once you create, reset, activate, or delete a director.'
              : 'Try adjusting your filters or date range.'}
          </p>
        </div>
      )}

      {/* Log Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Affected</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">School</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Performed By</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((entry) => {
                  const meta = ACTION_META[entry.action_type] ?? {
                    label: entry.action_type,
                    icon: 'ri-information-line',
                    color: 'text-gray-600',
                    bg: 'bg-gray-50',
                    badge: 'bg-gray-100 text-gray-600',
                  };
                  const isExpanded = expandedId === entry.id;
                  const hasDetails = entry.details && Object.keys(entry.details).length > 0;

                  return (
                    <>
                      <tr
                        key={entry.id}
                        className={`hover:bg-gray-50/60 transition-colors ${isExpanded ? 'bg-gray-50/40' : ''}`}
                      >
                        {/* Action */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 ${meta.bg} rounded-lg flex items-center justify-center shrink-0`}>
                              <i className={`${meta.icon} ${meta.color} text-sm`}></i>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badge}`}>
                              {meta.label}
                            </span>
                          </div>
                        </td>

                        {/* Director */}
                        <td className="px-5 py-4">
                          {entry.target_name || entry.target_email ? (
                            <div>
                              <div className="text-sm font-medium text-gray-800">{entry.target_name || '—'}</div>
                              <div className="text-xs text-gray-400">{entry.target_email}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>

                        {/* School */}
                        <td className="px-5 py-4">
                          {entry.school_name ? (
                            <span className="text-sm text-gray-700 font-medium">{entry.school_name}</span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </td>

                        {/* Performed by */}
                        <td className="px-5 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{entry.admin_name || '—'}</div>
                            <div className="text-xs text-gray-400">{entry.admin_email}</div>
                          </div>
                        </td>

                        {/* When */}
                        <td className="px-5 py-4">
                          <div>
                            <div className="text-sm text-gray-700">{timeAgo(entry.created_at)}</div>
                            <div className="text-xs text-gray-400">{fmtFull(entry.created_at)}</div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            entry.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            <i className={entry.status === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                            {entry.status === 'success' ? 'Success' : 'Error'}
                          </span>
                        </td>

                        {/* Expand */}
                        <td className="px-3 py-4">
                          {hasDetails && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="View details"
                            >
                              <i className={`${isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-base`}></i>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && hasDetails && (
                        <tr key={`${entry.id}-expand`} className="bg-gray-50/80">
                          <td colSpan={7} className="px-5 py-3">
                            <div className="flex items-start gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-gray-400 mt-0.5">Details:</span>
                              {Object.entries(entry.details).map(([k, v]) => (
                                <DetailBadge key={k} label={k.replace(/_/g, ' ')} value={v} />
                              ))}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Page <span className="font-semibold">{page}</span> of{' '}
                <span className="font-semibold">{totalPages}</span>{' '}
                &nbsp;·&nbsp; {filtered.length} events
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line text-base"></i>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pg = start + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-7 h-7 text-xs rounded-lg transition-colors cursor-pointer font-medium ${
                        pg === page
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line text-base"></i>
                </button>
              </div>
            </div>
          )}

          {totalPages === 1 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
