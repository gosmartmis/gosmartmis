import { useMemo, useState } from 'react';
import { useUsers } from '../../../hooks/useUsers';

const ROLE_LABELS: Record<string, string> = {
  'super-admin': 'Super Admin',
  director: 'Director',
  school_manager: 'School Manager',
  dean: 'Dean',
  registrar: 'Registrar',
  accountant: 'Accountant',
  teacher: 'Teacher',
  student: 'Student',
};

const ROLE_BADGE: Record<string, string> = {
  'super-admin': 'bg-rose-100 text-rose-700',
  director: 'bg-violet-100 text-violet-700',
  school_manager: 'bg-indigo-100 text-indigo-700',
  dean: 'bg-sky-100 text-sky-700',
  registrar: 'bg-cyan-100 text-cyan-700',
  accountant: 'bg-orange-100 text-orange-700',
  teacher: 'bg-green-100 text-green-700',
  student: 'bg-gray-100 text-gray-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Users() {
  const { users, loading, error, toggleActive } = useUsers();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Build unique school list from fetched data
  const schools = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      if (u.school_id && u.school_name) map.set(u.school_id, u.school_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        (u.full_name ?? '').toLowerCase().includes(term) ||
        (u.email ?? '').toLowerCase().includes(term);

      const matchRole =
        roleFilter === 'all' || u.role === roleFilter;

      const matchSchool =
        schoolFilter === 'all' || u.school_id === schoolFilter;

      return matchSearch && matchRole && matchSchool;
    });
  }, [users, searchTerm, roleFilter, schoolFilter]);

  const handleToggle = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    await toggleActive(id, isActive);
    setTogglingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Users</h2>
          <p className="text-gray-600 mt-1">Manage all users across schools</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
          <i className="ri-user-3-line text-primary-600 w-4 h-4 flex items-center justify-center" />
          <span className="text-sm font-semibold text-primary-700">
            {loading ? '…' : `${users.length} total`}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl w-6 h-6 flex items-center justify-center" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition-colors cursor-pointer"
          >
            <option value="all">All Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* State: loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
            <i className="ri-loader-4-line animate-spin text-2xl w-6 h-6 flex items-center justify-center" />
            <span className="text-sm">Loading users…</span>
          </div>
        )}

        {/* State: error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg text-red-700 text-sm">
            <i className="ri-error-warning-line text-xl w-5 h-5 flex items-center justify-center" />
            {error}
          </div>
        )}

        {/* State: table */}
        {!loading && !error && (
          <>
            <div className="text-sm text-gray-500 mb-4">
              Showing <span className="font-semibold text-gray-700">{filteredUsers.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{users.length}</span> users
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Role</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">School</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* User */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">{user.full_name || '—'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>

                      {/* School */}
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {user.school_name ?? <span className="text-gray-400 italic">—</span>}
                      </td>

                      {/* Joined */}
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={togglingId === user.id}
                            onClick={() => handleToggle(user.id, user.is_active)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${user.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          >
                            {togglingId === user.id
                              ? '…'
                              : user.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                        No users match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
