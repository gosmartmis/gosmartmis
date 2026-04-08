import { useState } from 'react';
import { useSchools, School } from '../../../hooks/useSchools';
import SchoolFormModal from './SchoolFormModal';
import DirectorManageModal from './DirectorManageModal';
import { getSchoolUrl } from '../../../utils/subdomain';
import { supabase, getAuthToken, EDGE_FUNCTIONS_BASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase';

type NotifType = 'success' | 'error';

interface Notif {
  type: NotifType;
  message: string;
}

interface OnboardResult {
  school_name: string;
  director_email: string;
  user_created: boolean;
  user_already_existed: boolean;
  temp_password: string | null;
  email_sent: boolean;
  email_error: string | null;
}

type BulkAction = 'activate' | 'suspend' | null;

export default function Schools() {
  const { schools, loading, addSchool, updateSchool, deleteSchool } = useSchools();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const [showCreate, setShowCreate] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [detailSchool, setDetailSchool] = useState<School | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<School | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [directorManageSchool, setDirectorManageSchool] = useState<School | null>(null);
  const [onboardResult, setOnboardResult] = useState<OnboardResult | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const showNotif = (type: NotifType, message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3500);
  };

  const filteredSchools = schools.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || s.subscription_status === filterStatus;
    const matchPlan = filterPlan === 'all' || s.subscription_plan === filterPlan;
    return matchSearch && matchStatus && matchPlan;
  });

  // Selection helpers
  const allSelected = filteredSchools.length > 0 && filteredSchools.every((s) => selectedIds.has(s.id));
  const someSelected = filteredSchools.some((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSchools.map((s) => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Count ALL selected (even if hidden by current filter)
  const selectedCount = selectedIds.size;

  // Quick-select: pick all schools with a given subscription_status from the full list
  const selectByStatus = (status: string) => {
    const ids = schools.filter((s) => s.subscription_status === status).map((s) => s.id);
    setSelectedIds(new Set(ids));
  };

  // Quick-select: schools expiring within 30 days (but not yet expired)
  const selectExpiringSoon = () => {
    const ids = schools.filter((s) => {
      const expiry = (s as any).subscription_expiry_date;
      if (!expiry) return false;
      const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
      return days >= 0 && days <= 30;
    }).map((s) => s.id);
    setSelectedIds(new Set(ids));
  };

  // Counts for quick-select pills
  const countByStatus = (status: string) => schools.filter((s) => s.subscription_status === status).length;
  const countExpiringSoon = schools.filter((s) => {
    const expiry = (s as any).subscription_expiry_date;
    if (!expiry) return false;
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  }).length;

  const handleBulkStatusUpdate = async () => {
    if (!bulkAction) return;
    setBulkProcessing(true);

    // Operate on ALL selected IDs regardless of current filter
    const idsToUpdate = Array.from(selectedIds);

    const newStatus = bulkAction === 'activate' ? 'active' : 'suspended';
    const newIsActive = bulkAction === 'activate';

    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      idsToUpdate.map(async (id) => {
        const result = await updateSchool(id, {
          subscription_status: newStatus,
          is_active: newIsActive,
        });
        if (result.success) successCount += 1;
        else failCount += 1;
      })
    );

    setBulkProcessing(false);
    setBulkAction(null);
    setSelectedIds(new Set());

    if (failCount === 0) {
      showNotif('success', `${successCount} school${successCount !== 1 ? 's' : ''} ${newIsActive ? 'activated' : 'suspended'} successfully.`);
    } else {
      showNotif('error', `${successCount} updated, ${failCount} failed. Please try again.`);
    }
  };

  const handleCreate = async (data: any) => {
    setSubmitting(true);
    const result = await addSchool(data);
    setSubmitting(false);
    if (result.success) {
      setShowCreate(false);
      showNotif('success', 'School created successfully!');

      if (data.create_director_account && data.director_email && result.data?.id) {
  setOnboarding(true);
  try {
    const token = await getAuthToken();

    const cleanDirectorEmail = data.director_email?.trim().toLowerCase();
    const cleanDirectorName = data.director_name?.trim();

    // ✅ FIXED PAYLOAD
    const payload = {
      action: 'create',
      school_id: result.data.id,
      school_name: data.name,
      school_slug: data.slug,
      director_name: cleanDirectorName,
      director_email: cleanDirectorEmail,
      send_welcome_email: !!data.send_welcome_email,
    };

    // ✅ FIXED FETCH
    const res = await fetch(
      `${EDGE_FUNCTIONS_BASE_URL}/manage-school-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Failed to create director');
    }

    setOnboardResult({
      school_name: data.name,
      director_email: data.director_email,
      user_created: json.user_created ?? false,
      user_already_existed: json.user_already_existed ?? false,
      temp_password: json.temp_password ?? null,
      email_sent: json.email_sent ?? false,
      email_error: json.email_error ?? null,
    });

  } catch (err) {
    setOnboardResult({
      school_name: data.name,
      director_email: data.director_email,
      user_created: false,
      user_already_existed: false,
      temp_password: null,
      email_sent: false,
      email_error: err instanceof Error ? err.message : 'Failed to run onboarding',
    });
  } finally {
    setOnboarding(false);
  }
}
    } else {
      showNotif('error', result.error || 'Failed to create school');
    }
  };

  const handleEdit = async (data: any) => {
    if (!editSchool) return;
    setSubmitting(true);
    const result = await updateSchool(editSchool.id, data);
    setSubmitting(false);
    if (result.success) {
      setEditSchool(null);
      showNotif('success', 'School updated successfully!');
    } else {
      showNotif('error', result.error || 'Failed to update school');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const result = await deleteSchool(confirmDelete.id);
    setDeleting(false);
    setConfirmDelete(null);
    if (result.success) {
      showNotif('success', 'School deleted.');
    } else {
      showNotif('error', result.error || 'Failed to delete school');
    }
  };

  const handleToggleActive = async (school: School) => {
    const result = await updateSchool(school.id, { is_active: !school.is_active });
    if (!result.success) showNotif('error', result.error || 'Failed to update status');
    else showNotif('success', `School ${!school.is_active ? 'activated' : 'deactivated'}.`);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'trial': return 'bg-amber-100 text-amber-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      case 'expired': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const planColor = (p: string) => {
    switch ((p || '').toLowerCase()) {
      case 'enterprise': return 'bg-violet-100 text-violet-700';
      case 'professional': return 'bg-teal-100 text-teal-700';
      case 'basic': return 'bg-sky-100 text-sky-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const daysUntilExpiry = (expiry: string) => {
    if (!expiry) return null;
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {notif && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          notif.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <i className={notif.type === 'success' ? 'ri-checkbox-circle-line text-lg' : 'ri-error-warning-line text-lg'}></i>
          {notif.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {schools.length} school{schools.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer text-sm font-medium shadow-sm"
        >
          <i className="ri-add-line text-base"></i>
          Add New School
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', value: schools.length, icon: 'ri-building-line', color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Active', value: schools.filter(s => s.subscription_status === 'active').length, icon: 'ri-checkbox-circle-line', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'On Trial', value: schools.filter(s => s.subscription_status === 'trial').length, icon: 'ri-time-line', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Suspended', value: schools.filter(s => s.subscription_status === 'suspended').length, icon: 'ri-forbid-line', color: 'text-red-600', bg: 'bg-red-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <i className={`${card.icon} ${card.color} text-xl`}></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search by name, subdomain or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            <option value="all">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        {/* Quick Select Strip */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 flex-wrap">
          <span className="text-xs font-medium text-gray-400 shrink-0">Quick select:</span>
          {[
            {
              label: 'Suspended',
              count: countByStatus('suspended'),
              action: () => selectByStatus('suspended'),
              icon: 'ri-forbid-line',
              style: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
              activeStyle: 'ring-2 ring-red-400',
            },
            {
              label: 'Expired',
              count: countByStatus('expired'),
              action: () => selectByStatus('expired'),
              icon: 'ri-calendar-close-line',
              style: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200',
              activeStyle: 'ring-2 ring-gray-400',
            },
            {
              label: 'Expiring Soon',
              count: countExpiringSoon,
              action: selectExpiringSoon,
              icon: 'ri-alarm-warning-line',
              style: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
              activeStyle: 'ring-2 ring-amber-400',
            },
            {
              label: 'Trial',
              count: countByStatus('trial'),
              action: () => selectByStatus('trial'),
              icon: 'ri-time-line',
              style: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100',
              activeStyle: 'ring-2 ring-amber-300',
            },
            {
              label: 'Active',
              count: countByStatus('active'),
              action: () => selectByStatus('active'),
              icon: 'ri-checkbox-circle-line',
              style: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
              activeStyle: 'ring-2 ring-emerald-400',
            },
          ].map((pill) => {
            if (pill.count === 0) return null;
            // Check if this pill's set is exactly the current selection
            const pillIds = pill.label === 'Expiring Soon'
              ? schools.filter((s) => {
                  const expiry = (s as any).subscription_expiry_date;
                  if (!expiry) return false;
                  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
                  return days >= 0 && days <= 30;
                }).map((s) => s.id)
              : schools.filter((s) => s.subscription_status === pill.label.toLowerCase()).map((s) => s.id);
            const isActive =
              pillIds.length > 0 &&
              pillIds.length === selectedIds.size &&
              pillIds.every((id) => selectedIds.has(id));
            return (
              <button
                key={pill.label}
                onClick={pill.action}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${pill.style} ${isActive ? pill.activeStyle : ''}`}
              >
                <i className={`${pill.icon} text-sm`}></i>
                {pill.label}
                <span className="font-bold">{pill.count}</span>
              </button>
            );
          })}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap ml-auto"
            >
              <i className="ri-close-line text-sm"></i>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="bg-gray-900 text-white rounded-xl px-5 py-3 flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center shrink-0">
              <i className="ri-checkbox-multiple-line text-sm text-white"></i>
            </div>
            <span className="text-sm font-medium">
              <span className="font-bold text-teal-400">{selectedCount}</span> school{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkAction('activate')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-checkbox-circle-line text-sm"></i>
              Activate All
            </button>
            <button
              onClick={() => setBulkAction('suspend')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-forbid-line text-sm"></i>
              Suspend All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              <i className="ri-close-line text-base"></i>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                    />
                  </div>
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subdomain</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <i className="ri-building-line text-5xl text-gray-200"></i>
                      <p className="text-sm text-gray-400">
                        {searchTerm || filterStatus !== 'all' || filterPlan !== 'all'
                          ? 'No schools match your filters'
                          : 'No schools registered yet — add one to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school) => {
                  const expiry = (school as any).subscription_expiry_date;
                  const days = daysUntilExpiry(expiry);
                  const isSelected = selectedIds.has(school.id);
                  return (
                    <tr
                      key={school.id}
                      className={`hover:bg-gray-50/60 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}
                    >
                      <td className="px-4 py-4 w-10">
                        <div className="w-5 h-5 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(school.id)}
                            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {(school as any).logo_url ? (
                            <img
                              src={(school as any).logo_url}
                              alt={school.name}
                              className="w-9 h-9 rounded-lg object-contain border border-gray-100 bg-gray-50 shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                              style={{ background: `linear-gradient(135deg, ${(school as any).primary_color || '#0d9488'}, ${(school as any).secondary_color || '#059669'})` }}
                            >
                              {school.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{school.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="text-xs text-gray-400">{school.email}</div>
                              {((school as any).primary_color || (school as any).secondary_color) && (
                                <div className="flex items-center gap-0.5">
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: (school as any).primary_color || '#0d9488' }} title="Primary color"></div>
                                  <div className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: (school as any).secondary_color || '#059669' }} title="Secondary color"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{school.slug}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planColor(school.subscription_plan)}`}>
                          {school.subscription_plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(school.subscription_status)}`}>
                          {school.subscription_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-800 font-medium">{school.student_count ?? 0}</div>
                        <div className="text-xs text-gray-400">/ {school.max_students} max</div>
                      </td>
                      <td className="px-5 py-4">
                        {expiry ? (
                          <div>
                            <div className="text-xs text-gray-700">{fmt(expiry)}</div>
                            {days !== null && (
                              <div className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days <= 30 ? 'text-amber-500' : 'text-gray-400'}`}>
                                {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? 'Expires today' : `${days}d left`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <a
                            href={getSchoolUrl(school.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-500 hover:bg-teal-50 hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
                            title="Preview School Site"
                          >
                            <i className="ri-external-link-line text-base"></i>
                          </a>
                          <button
                            onClick={() => setDetailSchool(school)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <i className="ri-eye-line text-base"></i>
                          </button>
                          <button
                            onClick={() => setEditSchool(school)}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <i className="ri-edit-line text-base"></i>
                          </button>
                          <button
                            onClick={() => setDirectorManageSchool(school)}
                            className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                            title="Manage Director Account"
                          >
                            <i className="ri-user-settings-line text-base"></i>
                          </button>
                          <button
                            onClick={() => handleToggleActive(school)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              school.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={school.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i className={school.is_active ? 'ri-toggle-line text-base' : 'ri-toggle-fill text-base'}></i>
                          </button>
                          <button
                            onClick={() => setConfirmDelete(school)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <i className="ri-delete-bin-line text-base"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredSchools.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Showing {filteredSchools.length} of {schools.length} schools</span>
            {selectedCount > 0 && (
              <span className="text-teal-600 font-medium">{selectedCount} selected</span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Confirmation Modal */}
      {bulkAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${bulkAction === 'activate' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <i className={`text-2xl ${bulkAction === 'activate' ? 'ri-checkbox-circle-line text-emerald-600' : 'ri-forbid-line text-red-600'}`}></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">
              {bulkAction === 'activate' ? 'Activate Schools?' : 'Suspend Schools?'}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              This will{' '}
              <strong className={bulkAction === 'activate' ? 'text-emerald-600' : 'text-red-600'}>
                {bulkAction === 'activate' ? 'activate' : 'suspend'}
              </strong>{' '}
              <strong>{selectedCount}</strong> selected school{selectedCount !== 1 ? 's' : ''}.
            </p>
            {bulkAction === 'suspend' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center mb-4">
                Suspended schools will lose portal access until reactivated.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setBulkAction(null)}
                disabled={bulkProcessing}
                className="flex-1 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={bulkProcessing}
                className={`flex-1 py-2.5 text-white rounded-xl transition-colors text-sm font-medium cursor-pointer whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2 ${
                  bulkAction === 'activate'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {bulkProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing…
                  </>
                ) : (
                  <>
                    <i className={bulkAction === 'activate' ? 'ri-checkbox-circle-line' : 'ri-forbid-line'}></i>
                    {bulkAction === 'activate' ? `Activate ${selectedCount}` : `Suspend ${selectedCount}`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Loading Overlay */}
      {onboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
            <div className="w-14 h-14 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">Setting up onboarding…</p>
              <p className="text-sm text-gray-500 mt-1">Creating director account &amp; sending welcome email</p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Result Modal */}
      {onboardResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`px-6 py-5 flex items-center gap-3 ${onboardResult.user_created || onboardResult.user_already_existed ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-red-50 border-b border-red-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${onboardResult.user_created || onboardResult.user_already_existed ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <i className={`text-xl ${onboardResult.user_created || onboardResult.user_already_existed ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-error-warning-fill text-red-600'}`}></i>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {onboardResult.user_created ? 'Director Account Created!' : onboardResult.user_already_existed ? 'Account Already Existed' : 'Onboarding Issue'}
                </h3>
                <p className="text-xs text-gray-500">{onboardResult.school_name}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Account info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Director Email</span>
                  <span className="font-semibold text-gray-800 font-mono text-xs">{onboardResult.director_email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg">Director</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Account Status</span>
                  <span className={`text-xs font-semibold ${onboardResult.user_created ? 'text-emerald-600' : onboardResult.user_already_existed ? 'text-amber-600' : 'text-red-600'}`}>
                    {onboardResult.user_created ? 'Newly Created' : onboardResult.user_already_existed ? 'Already Existed (linked)' : 'Failed'}
                  </span>
                </div>
              </div>

              {/* Temp password */}
              {onboardResult.temp_password && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Temporary Password — Share Securely</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-gray-900 tracking-wide">
                      {onboardResult.temp_password}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(onboardResult.temp_password!);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {copiedPassword ? <><i className="ri-check-line"></i> Copied!</> : <><i className="ri-clipboard-line"></i> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">The director should change this after first login.</p>
                </div>
              )}

              {/* Email status */}
              <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${onboardResult.email_sent ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
                <i className={`text-sm mt-0.5 ${onboardResult.email_sent ? 'ri-mail-check-line text-emerald-600' : 'ri-mail-close-line text-gray-400'}`}></i>
                <div>
                  {onboardResult.email_sent
                    ? `Welcome email sent to ${onboardResult.director_email}`
                    : onboardResult.email_error
                      ? onboardResult.email_error
                      : 'Welcome email was not sent (disabled or no API key)'}
                </div>
              </div>
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => { setOnboardResult(null); setCopiedPassword(false); }}
                className="w-full py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <SchoolFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          submitting={submitting}
        />
      )}

      {/* Edit Modal */}
      {editSchool && (
        <SchoolFormModal
          mode="edit"
          school={editSchool}
          onClose={() => setEditSchool(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}

      {/* Detail Drawer */}
      {detailSchool && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {(detailSchool as any).logo_url ? (
                  <img
                    src={(detailSchool as any).logo_url}
                    alt={detailSchool.name}
                    className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-gray-50"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ background: `linear-gradient(135deg, ${(detailSchool as any).primary_color || '#0d9488'}, ${(detailSchool as any).secondary_color || '#059669'})` }}
                  >
                    {detailSchool.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{detailSchool.name}</h2>
                  <p className="text-xs text-gray-400 font-mono">{detailSchool.slug}</p>
                </div>
              </div>
              <button onClick={() => setDetailSchool(null)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                <i className="ri-close-line text-xl text-gray-500"></i>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6">
              {/* Status Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(detailSchool.subscription_status)}`}>
                  {detailSchool.subscription_status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planColor(detailSchool.subscription_plan)}`}>
                  {detailSchool.subscription_plan}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${detailSchool.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {detailSchool.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                <div className="space-y-2">
                  {[
                    { icon: 'ri-mail-line', label: 'Email', value: detailSchool.email },
                    { icon: 'ri-phone-line', label: 'Phone', value: detailSchool.phone },
                    { icon: 'ri-map-pin-line', label: 'Address', value: detailSchool.address },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-3">
                      <div className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg shrink-0 mt-0.5">
                        <i className={`${row.icon} text-gray-500 text-sm`}></i>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">{row.label}</div>
                        <div className="text-sm text-gray-800">{row.value || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {[
                    { label: 'Package', value: (detailSchool as any).subscription_package || '—' },
                    { label: 'Billing Cycle', value: (detailSchool as any).billing_cycle || '—' },
                    { label: 'Start Date', value: fmt((detailSchool as any).subscription_start_date) },
                    { label: 'Expiry Date', value: fmt((detailSchool as any).subscription_expiry_date) },
                    { label: 'Amount', value: (detailSchool as any).subscription_amount != null ? `$${Number((detailSchool as any).subscription_amount).toFixed(2)}` : '—' },
                    { label: 'Discount', value: (detailSchool as any).subscription_discount != null ? `$${Number((detailSchool as any).subscription_discount).toFixed(2)}` : '—' },
                    { label: 'Net Payable', value: (detailSchool as any).subscription_amount != null ? `$${(Number((detailSchool as any).subscription_amount) - Number((detailSchool as any).subscription_discount || 0)).toFixed(2)}` : '—' },
                    { label: 'Auto-Renew', value: (detailSchool as any).auto_renew ? 'Yes' : 'No' },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="font-medium text-gray-800 capitalize">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Limits</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-teal-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-teal-700">{detailSchool.student_count ?? 0}</div>
                    <div className="text-xs text-teal-600">Students enrolled</div>
                    <div className="text-xs text-gray-400 mt-0.5">Max: {detailSchool.max_students}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{detailSchool.max_teachers}</div>
                    <div className="text-xs text-emerald-600">Max Teachers</div>
                    <div className="text-xs text-gray-400 mt-0.5">Registered since {fmt(detailSchool.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Disabled Modules */}
              {((detailSchool as any).disabled_modules || []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Disabled Modules</h3>
                  <div className="flex flex-wrap gap-2">
                    {((detailSchool as any).disabled_modules as string[]).map((m) => (
                      <span key={m} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 capitalize">
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Branding */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Branding Preview</h3>

                {/* Live visual preview card */}
                <div className="rounded-2xl overflow-hidden border border-gray-200 mb-3">
                  {/* Mock Navbar */}
                  {(() => {
                    const p = (detailSchool as any).primary_color || '#0d9488';
                    const s = (detailSchool as any).secondary_color || '#059669';
                    const logoUrl = (detailSchool as any).logo_url;
                    const initials = detailSchool.name.charAt(0).toUpperCase();
                    return (
                      <>
                        <div className="px-4 py-3 bg-white border-b flex items-center justify-between" style={{ borderColor: `${p}30` }}>
                          <div className="flex items-center gap-2.5">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt="logo"
                                className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-gray-50"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                                style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
                              >
                                {initials}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-gray-900 leading-tight">{detailSchool.name}</div>
                              <div className="text-xs font-medium" style={{ color: p }}>Excellence Through Education</div>
                            </div>
                          </div>
                          <div
                            className="px-3 py-1 rounded-lg text-white text-xs font-semibold whitespace-nowrap"
                            style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
                          >
                            Login
                          </div>
                        </div>

                        {/* Mock Hero */}
                        <div
                          className="px-4 py-6 flex flex-col items-center text-center"
                          style={{ background: `linear-gradient(135deg, ${p}12, ${s}0a)` }}
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="logo"
                              className="w-14 h-14 rounded-xl object-contain border border-gray-100 bg-white mb-3"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-3"
                              style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="text-sm font-bold text-gray-900 mb-0.5">{detailSchool.name}</div>
                          <div className="text-xs font-medium mb-4" style={{ color: p }}>Excellence Through Education</div>
                          <div
                            className="px-5 py-2 rounded-xl text-white text-xs font-semibold"
                            style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
                          >
                            Login to Portal
                          </div>
                        </div>

                        {/* Color palette strip */}
                        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md border border-gray-200 shrink-0" style={{ backgroundColor: p }}></div>
                            <div>
                              <div className="text-xs text-gray-400 leading-none">Primary</div>
                              <div className="text-xs font-mono font-semibold text-gray-700">{p}</div>
                            </div>
                          </div>
                          <div className="w-px h-6 bg-gray-200"></div>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md border border-gray-200 shrink-0" style={{ backgroundColor: s }}></div>
                            <div>
                              <div className="text-xs text-gray-400 leading-none">Secondary</div>
                              <div className="text-xs font-mono font-semibold text-gray-700">{s}</div>
                            </div>
                          </div>
                          {!logoUrl && (
                            <>
                              <div className="w-px h-6 bg-gray-200 ml-auto"></div>
                              <span className="text-xs text-gray-400 italic">No logo</span>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Logo URL row (if set) */}
                {(detailSchool as any).logo_url && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <i className="ri-links-line text-gray-400 text-sm shrink-0"></i>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 mb-0.5">Logo URL</div>
                      <div className="text-xs text-gray-600 truncate font-mono">{(detailSchool as any).logo_url}</div>
                    </div>
                    <a
                      href={(detailSchool as any).logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Open in new tab"
                    >
                      <i className="ri-external-link-line text-sm"></i>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => { setDetailSchool(null); setEditSchool(detailSchool); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
              >
                <i className="ri-edit-line"></i> Edit School
              </button>
              <button
                onClick={() => { setDetailSchool(null); setDirectorManageSchool(detailSchool); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-xl transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
                title="Manage Director Account"
              >
                <i className="ri-user-settings-line"></i> Director
              </button>
              <a
                href={getSchoolUrl(detailSchool.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
                title="Open school landing page in new tab"
              >
                <i className="ri-external-link-line"></i> Preview
              </a>
              <button
                onClick={() => setDetailSchool(null)}
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Director Account Manager Modal */}
      {directorManageSchool && (
        <DirectorManageModal
          school={directorManageSchool}
          onClose={() => setDirectorManageSchool(null)}
        />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-delete-bin-line text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">Delete School?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <strong>{confirmDelete.name}</strong> and all its data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
