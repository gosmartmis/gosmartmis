import { useState, useMemo } from 'react';
import { useSubscriptions } from '../../../hooks/useSubscriptions';
import type { SchoolBilling, NewPaymentData, UpdateSubscriptionData } from '../../../hooks/useSubscriptions';
import { subscriptionPlans } from '../../../mocks/subscriptions';
import RenewalModal from './RenewalModal';

interface SubscriptionsProps {
  onClose?: () => void;
}

const PAYMENT_METHODS = ['Bank Transfer', 'Mobile Money', 'Cash', 'Cheque'];
const PAGE_SIZE = 10;

export default function Subscriptions({ onClose }: SubscriptionsProps) {
  const { schools, payments, loading, error, updateSubscription, addPayment, suspendSchool, reactivateSchool, refetch } = useSubscriptions();

  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'plans' | 'payments'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<SchoolBilling | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalSchool, setRenewalSchool] = useState<SchoolBilling | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Payment history filters
  const [payFilterSchool, setPayFilterSchool] = useState('all');
  const [payFilterStatus, setPayFilterStatus] = useState('all');
  const [payFilterMethod, setPayFilterMethod] = useState('all');
  const [payFilterFrom, setPayFilterFrom] = useState('');
  const [payFilterTo, setPayFilterTo] = useState('');
  const [payPage, setPayPage] = useState(1);
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState<Omit<NewPaymentData, 'school_id'>>({
    amount: 0,
    discount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    transaction_id: '',
    status: 'completed',
    notes: '',
  });

  // Edit subscription form state
  const [editForm, setEditForm] = useState<UpdateSubscriptionData>({});

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRevenue = schools.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const activeCount = schools.filter(s => s.subscription_status === 'active').length;
  const trialCount = schools.filter(s => s.subscription_status === 'trial').length;

  const now = new Date();
  const monthlyRevenue = payments
    .filter(p => {
      const d = new Date(p.payment_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === 'completed';
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // ── Payment history computed ───────────────────────────────────────────────
  const paymentSchoolOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; name: string }[] = [];
    payments.forEach(p => {
      const schoolName = (p.school as { name: string } | undefined)?.name;
      if (schoolName && !seen.has(p.school_id)) {
        seen.add(p.school_id);
        opts.push({ id: p.school_id, name: schoolName });
      }
    });
    return opts.sort((a, b) => a.name.localeCompare(b.name));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (payFilterSchool !== 'all' && p.school_id !== payFilterSchool) return false;
      if (payFilterStatus !== 'all' && p.status !== payFilterStatus) return false;
      if (payFilterMethod !== 'all' && p.payment_method !== payFilterMethod) return false;
      if (payFilterFrom && p.payment_date < payFilterFrom) return false;
      if (payFilterTo && p.payment_date > payFilterTo) return false;
      return true;
    });
  }, [payments, payFilterSchool, payFilterStatus, payFilterMethod, payFilterFrom, payFilterTo]);

  const paymentStats = useMemo(() => ({
    totalCollected: filteredPayments.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0),
    totalPending: filteredPayments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0),
    totalFailed: filteredPayments.filter(p => p.status === 'failed').reduce((s, p) => s + Number(p.amount), 0),
    count: filteredPayments.length,
  }), [filteredPayments]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const pagedPayments = filteredPayments.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE);

  const resetPayFilters = () => {
    setPayFilterSchool('all');
    setPayFilterStatus('all');
    setPayFilterMethod('all');
    setPayFilterFrom('');
    setPayFilterTo('');
    setPayPage(1);
  };

  const hasActiveFilters = payFilterSchool !== 'all' || payFilterStatus !== 'all' || payFilterMethod !== 'all' || payFilterFrom !== '' || payFilterTo !== '';

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Transaction ID', 'School', 'Amount (RWF)', 'Discount (RWF)', 'Net Amount (RWF)', 'Method', 'Date', 'Status', 'Notes'];
    const rows = filteredPayments.map(p => [
      p.transaction_id || '',
      (p.school as { name: string } | undefined)?.name || '',
      Number(p.amount),
      Number(p.discount),
      Number(p.amount) - Number(p.discount),
      p.payment_method,
      p.payment_date,
      p.status,
      p.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount);

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'trial': return 'bg-teal-100 text-teal-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPayStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { badge: 'bg-green-100 text-green-700', icon: 'ri-check-line text-green-600', bg: 'bg-green-100' };
      case 'pending': return { badge: 'bg-yellow-100 text-yellow-700', icon: 'ri-time-line text-yellow-600', bg: 'bg-yellow-100' };
      case 'failed': return { badge: 'bg-red-100 text-red-700', icon: 'ri-close-line text-red-600', bg: 'bg-red-100' };
      default: return { badge: 'bg-gray-100 text-gray-700', icon: 'ri-question-line text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getPackageColor = (pkg: string) => {
    switch (pkg) {
      case 'nursery': return 'bg-purple-100 text-purple-700';
      case 'primary': return 'bg-sky-100 text-sky-700';
      case 'nursery-primary': return 'bg-teal-100 text-teal-700';
      case 'premium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const packageLabel = (pkg: string) => {
    if (pkg === 'nursery-primary') return 'Nursery + Primary';
    return pkg.charAt(0).toUpperCase() + pkg.slice(1);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Filtered schools ───────────────────────────────────────────────────────
  const filteredSchools = schools.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.subscription_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const expiringSoon = schools.filter(s => {
    const days = getDaysRemaining(s.subscription_expiry_date);
    return days !== null && days > 0 && days <= 30 && s.subscription_status === 'active';
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSuspend = async (school: SchoolBilling) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await suspendSchool(school.id);
      setSelectedSchool(null);
      showSuccess(`${school.name} has been suspended.`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (school: SchoolBilling) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await reactivateSchool(school.id);
      setSelectedSchool(null);
      showSuccess(`${school.name} has been reactivated.`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await addPayment({ ...paymentForm, school_id: selectedSchool.id });
      setShowPaymentModal(false);
      showSuccess('Payment recorded successfully.');
      setPaymentForm({
        amount: 0, discount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Bank Transfer',
        transaction_id: '', status: 'completed', notes: '',
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubscription = async () => {
    if (!selectedSchool) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateSubscription(selectedSchool.id, editForm);
      setShowEditModal(false);
      showSuccess('Subscription updated successfully.');
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async (paymentData: NewPaymentData, subscriptionUpdate: UpdateSubscriptionData) => {
    await addPayment(paymentData);
    await updateSubscription(paymentData.school_id, subscriptionUpdate);
    setShowRenewalModal(false);
    setRenewalSchool(null);
    showSuccess(`Subscription for ${renewalSchool?.name} renewed successfully.`);
  };

  const openRenewalModal = (school: SchoolBilling) => {
    setRenewalSchool(school);
    setShowRenewalModal(true);
  };

  const openEditModal = (school: SchoolBilling) => {
    setSelectedSchool(school);
    setEditForm({
      subscription_package: school.subscription_package || 'demo',
      subscription_status: school.subscription_status || 'trial',
      billing_cycle: school.billing_cycle || 'yearly',
      subscription_start_date: school.subscription_start_date || '',
      subscription_expiry_date: school.subscription_expiry_date || '',
      subscription_amount: school.subscription_amount || 0,
      subscription_discount: school.subscription_discount || 0,
      auto_renew: school.auto_renew || false,
      max_students: school.max_students || 500,
    });
    setShowEditModal(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading subscription data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={refetch} className="mt-3 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 cursor-pointer whitespace-nowrap">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
          <i className="ri-check-line text-lg"></i>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage school subscriptions, packages, and billing</p>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-refresh-line"></i> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-100">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Schools</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="ri-check-double-line text-2xl text-green-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Trial Schools</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{trialCount}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-2xl text-teal-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(monthlyRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-2xl text-amber-600"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex gap-6">
          {(['overview', 'schools', 'plans', 'payments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'plans' ? 'Subscription Plans' : tab === 'payments' ? 'Payment History' : tab === 'schools' ? 'School Subscriptions' : 'Overview'}
              {tab === 'payments' && payments.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">{payments.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Expiring Soon */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Expiring Soon</h2>
                <span className="text-sm text-gray-500">Next 30 days</span>
              </div>
              {expiringSoon.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="ri-calendar-check-line text-3xl mb-2 block"></i>
                  <p className="text-sm">No subscriptions expiring in the next 30 days</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringSoon.map(school => {
                    const daysLeft = getDaysRemaining(school.subscription_expiry_date)!;
                    return (
                      <div key={school.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i className="ri-alarm-warning-line text-xl text-orange-600"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{school.name}</p>
                            <p className="text-sm text-gray-500">
                              Expires {school.subscription_expiry_date ? new Date(school.subscription_expiry_date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-orange-700">{daysLeft} days left</span>
                          <button
                            onClick={() => openRenewalModal(school)}
                            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                          >
                            <i className="ri-refresh-line"></i> Renew
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Payments</h2>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer whitespace-nowrap"
                >
                  View all →
                </button>
              </div>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <i className="ri-receipt-line text-3xl mb-2 block"></i>
                  <p className="text-sm">No payment records yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 6).map(payment => {
                    const style = getPayStatusStyle(payment.status);
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.bg}`}>
                            <i className={`text-xl ${style.icon}`}></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{(payment.school as { name: string } | undefined)?.name ?? '—'}</p>
                            <p className="text-sm text-gray-500">{payment.payment_method}{payment.transaction_id ? ` • ${payment.transaction_id}` : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(Number(payment.amount))}</p>
                          <p className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCHOOLS ── */}
        {activeTab === 'schools' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search schools…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No schools found</td>
                    </tr>
                  ) : filteredSchools.map(school => {
                    const daysLeft = getDaysRemaining(school.subscription_expiry_date);
                    return (
                      <tr key={school.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{school.name}</p>
                          <p className="text-sm text-gray-500">{school.slug}.gosmartmis.rw</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPackageColor(school.subscription_package || school.subscription_plan)}`}>
                            {packageLabel(school.subscription_package || school.subscription_plan)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(school.subscription_status)}`}>
                            {school.subscription_status.charAt(0).toUpperCase() + school.subscription_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{school.studentCount ?? 0}</span>
                          {school.max_students ? <span className="text-xs text-gray-400"> / {school.max_students}</span> : null}
                        </td>
                        <td className="px-6 py-4">
                          {school.subscription_expiry_date ? (
                            <>
                              <p className="text-sm text-gray-900">{new Date(school.subscription_expiry_date).toLocaleDateString()}</p>
                              {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                                <p className="text-xs text-orange-600">{daysLeft}d left</p>
                              )}
                              {daysLeft !== null && daysLeft <= 0 && (
                                <p className="text-xs text-red-600">Expired</p>
                              )}
                            </>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(school.totalPaid || 0)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedSchool(school); setShowPaymentModal(true); }}
                              className="px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              + Payment
                            </button>
                            <button
                              onClick={() => openRenewalModal(school)}
                              className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                            >
                              <i className="ri-refresh-line"></i> Renew
                            </button>
                            <button
                              onClick={() => openEditModal(school)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PLANS ── */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-2 gap-6">
            {subscriptionPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-teal-400 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.billingCycle === 'yearly' ? 'Annual Billing' : '3-Year Billing'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPackageColor(plan.package)}`}>
                    {packageLabel(plan.package)}
                  </span>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(plan.price)}</span>
                    <span className="text-sm text-gray-500">{plan.billingCycle === 'yearly' ? '/year' : '/3 years'}</span>
                  </div>
                  {plan.billingCycle === '3-years' && (
                    <p className="text-xs text-green-600 mt-1">Save 10% with 3-year payment</p>
                  )}
                  {plan.package === 'nursery-primary' && plan.billingCycle === 'yearly' && (
                    <p className="text-xs text-green-600 mt-1">10% combo discount included</p>
                  )}
                </div>

                <div className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <i className="ri-check-line text-teal-600 mt-0.5"></i>
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>

                {plan.limitations && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Limitations:</p>
                    {plan.limitations.maxStudents && <p className="text-xs text-gray-500">• Max {plan.limitations.maxStudents} students</p>}
                    {plan.limitations.duration && <p className="text-xs text-gray-500">• {plan.limitations.duration}-day trial</p>}
                    {plan.limitations.disabledModules && <p className="text-xs text-gray-500">• Some modules disabled</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <div className="space-y-5">

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-check-double-line text-xl text-green-600"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Collected</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(paymentStats.totalCollected)}</p>
                  <p className="text-xs text-gray-400">{filteredPayments.filter(p => p.status === 'completed').length} transactions</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-time-line text-xl text-yellow-600"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Pending</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(paymentStats.totalPending)}</p>
                  <p className="text-xs text-gray-400">{filteredPayments.filter(p => p.status === 'pending').length} transactions</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className="w-11 h-11 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <i className="ri-close-circle-line text-xl text-red-600"></i>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Failed</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(paymentStats.totalFailed)}</p>
                  <p className="text-xs text-gray-400">{filteredPayments.filter(p => p.status === 'failed').length} transactions</p>
                </div>
              </div>
            </div>

            {/* Filters bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium shrink-0">
                  <i className="ri-filter-3-line"></i> Filters
                </div>

                <select
                  value={payFilterSchool}
                  onChange={e => { setPayFilterSchool(e.target.value); setPayPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">All Schools</option>
                  {paymentSchoolOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={payFilterStatus}
                  onChange={e => { setPayFilterStatus(e.target.value); setPayPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={payFilterMethod}
                  onChange={e => { setPayFilterMethod(e.target.value); setPayPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="all">All Methods</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={payFilterFrom}
                    onChange={e => { setPayFilterFrom(e.target.value); setPayPage(1); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="From"
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="date"
                    value={payFilterTo}
                    onChange={e => { setPayFilterTo(e.target.value); setPayPage(1); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="To"
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetPayFilters}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer whitespace-nowrap flex items-center gap-1"
                  >
                    <i className="ri-close-line"></i> Clear
                  </button>
                )}

                <div className="ml-auto">
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-download-line"></i> Export CSV
                  </button>
                </div>
              </div>

              {hasActiveFilters && (
                <p className="text-xs text-gray-500 mt-3">
                  Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> transactions
                </p>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <i className="ri-receipt-line text-4xl"></i>
                            <p className="text-sm font-medium">No payment records found</p>
                            {hasActiveFilters && <p className="text-xs">Try adjusting your filters</p>}
                          </div>
                        </td>
                      </tr>
                    ) : pagedPayments.map(payment => {
                      const style = getPayStatusStyle(payment.status);
                      const isExpanded = expandedPayment === payment.id;
                      return (
                        <>
                          <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-mono text-gray-900 font-medium">
                                {payment.transaction_id || <span className="text-gray-400 font-sans font-normal">—</span>}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">ID: {payment.id.slice(0, 8)}…</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-gray-900">
                                {(payment.school as { name: string } | undefined)?.name ?? '—'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(payment.amount))}</p>
                              {Number(payment.discount) > 0 && (
                                <p className="text-xs text-green-600">-{formatCurrency(Number(payment.discount))} disc.</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <i className={`text-base ${
                                  payment.payment_method === 'Bank Transfer' ? 'ri-bank-line text-gray-500' :
                                  payment.payment_method === 'Mobile Money' ? 'ri-smartphone-line text-teal-500' :
                                  payment.payment_method === 'Cash' ? 'ri-money-dollar-circle-line text-green-500' :
                                  'ri-file-text-line text-gray-500'
                                }`}></i>
                                <span className="text-sm text-gray-900">{payment.payment_method}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">{new Date(payment.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style.badge}`}>
                                <i className={`text-xs ${style.icon}`}></i>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {payment.notes ? (
                                <button
                                  onClick={() => setExpandedPayment(isExpanded ? null : payment.id)}
                                  className="w-8 h-8 flex items-center justify-center mx-auto rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                  title="View notes"
                                >
                                  <i className={`ri-${isExpanded ? 'arrow-up' : 'sticky-note'}-line text-base`}></i>
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && payment.notes && (
                            <tr key={`${payment.id}-notes`} className="bg-teal-50">
                              <td colSpan={7} className="px-6 py-3">
                                <div className="flex items-start gap-2">
                                  <i className="ri-sticky-note-line text-teal-500 mt-0.5 shrink-0"></i>
                                  <p className="text-sm text-teal-800">{payment.notes}</p>
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
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((payPage - 1) * PAGE_SIZE) + 1}–{Math.min(payPage * PAGE_SIZE, filteredPayments.length)} of {filteredPayments.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPayPage(p => Math.max(1, p - 1))}
                      disabled={payPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <i className="ri-arrow-left-s-line"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setPayPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          page === payPage
                            ? 'bg-teal-600 text-white'
                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setPayPage(p => Math.min(totalPages, p + 1))}
                      disabled={payPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <i className="ri-arrow-right-s-line"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ADD PAYMENT MODAL ── */}
      {showPaymentModal && selectedSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">School: <span className="font-medium text-gray-900">{selectedSchool.name}</span></p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (RWF)</label>
                <input
                  type="number"
                  value={paymentForm.discount}
                  onChange={e => setPaymentForm(f => ({ ...f, discount: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={e => setPaymentForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={paymentForm.transaction_id}
                  onChange={e => setPaymentForm(f => ({ ...f, transaction_id: e.target.value }))}
                  placeholder="e.g. TXN-2025-001"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={paymentForm.status}
                  onChange={e => setPaymentForm(f => ({ ...f, status: e.target.value as 'completed' | 'pending' | 'failed' }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {actionError && <p className="text-sm text-red-600">{actionError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={actionLoading || paymentForm.amount <= 0}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {actionLoading ? 'Saving…' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT SUBSCRIPTION MODAL ── */}
      {showEditModal && selectedSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Subscription — {selectedSchool.name}</h2>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                  <select
                    value={editForm.subscription_package}
                    onChange={e => setEditForm(f => ({ ...f, subscription_package: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="demo">Demo</option>
                    <option value="nursery">Nursery</option>
                    <option value="primary">Primary</option>
                    <option value="nursery-primary">Nursery + Primary</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.subscription_status}
                    onChange={e => setEditForm(f => ({ ...f, subscription_status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                  <select
                    value={editForm.billing_cycle}
                    onChange={e => setEditForm(f => ({ ...f, billing_cycle: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="yearly">Yearly</option>
                    <option value="3-years">3 Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={editForm.max_students}
                    onChange={e => setEditForm(f => ({ ...f, max_students: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.subscription_start_date || ''}
                    onChange={e => setEditForm(f => ({ ...f, subscription_start_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={editForm.subscription_expiry_date || ''}
                    onChange={e => setEditForm(f => ({ ...f, subscription_expiry_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
                  <input
                    type="number"
                    value={editForm.subscription_amount}
                    onChange={e => setEditForm(f => ({ ...f, subscription_amount: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (RWF)</label>
                  <input
                    type="number"
                    value={editForm.subscription_discount}
                    onChange={e => setEditForm(f => ({ ...f, subscription_discount: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={editForm.auto_renew || false}
                  onChange={e => setEditForm(f => ({ ...f, auto_renew: e.target.checked }))}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
                <label htmlFor="auto_renew" className="text-sm text-gray-700 cursor-pointer">Auto-renew enabled</label>
              </div>

              {actionError && <p className="text-sm text-red-600">{actionError}</p>}

              <div className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Quick Actions</p>
                <div className="flex gap-3">
                  {selectedSchool.subscription_status !== 'suspended' && (
                    <button
                      onClick={() => handleSuspend(selectedSchool)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      <i className="ri-pause-line mr-1"></i>Suspend
                    </button>
                  )}
                  {selectedSchool.subscription_status === 'suspended' && (
                    <button
                      onClick={() => handleReactivate(selectedSchool)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      <i className="ri-play-line mr-1"></i>Reactivate
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubscription}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {actionLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RENEWAL MODAL ── */}
      {showRenewalModal && renewalSchool && (
        <RenewalModal
          school={renewalSchool}
          onClose={() => { setShowRenewalModal(false); setRenewalSchool(null); }}
          onRenew={handleRenew}
        />
      )}
    </div>
  );
}
