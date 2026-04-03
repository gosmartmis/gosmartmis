import { useState } from 'react';
import { useFeeRecords } from '../../../hooks/useFeeRecords';
import { useTerms } from '../../../hooks/useTerms';
import { useTenant } from '../../../contexts/TenantContext';
import { supabase } from '../../../lib/supabase';
import FeeRemindersPanel from './FeeRemindersPanel';

interface PaymentHistory {
  id: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  payment_date: string;
  notes?: string;
}

export default function FeeManagement() {
  const { schoolId } = useTenant();
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const { terms, activeTerm, loading: termsLoading } = useTerms(schoolId);
  const { records, loading, error, refetch } = useFeeRecords(schoolId, selectedTermId);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'overdue'>('all');
  
  // Balance detail modal state
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Set active term as default when terms load
  if (!selectedTermId && activeTerm && !termsLoading) {
    setSelectedTermId(activeTerm.id);
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.class_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount);
  };

  const totalExpected = records.reduce((sum, r) => sum + r.total_amount, 0);
  const totalCollected = records.reduce((sum, r) => sum + r.amount_paid, 0);
  const totalOutstanding = records.reduce((sum, r) => sum + r.balance, 0);
  const overdueCount = records.filter(r => r.status === 'overdue').length;

  const handleViewBalance = async (record: any) => {
    setSelectedRecord(record);
    setShowBalanceModal(true);
    setLoadingHistory(true);

    try {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('id, amount, payment_method, reference_number, payment_date, notes')
        .eq('fee_record_id', record.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      setPaymentHistory(data || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closeBalanceModal = () => {
    setShowBalanceModal(false);
    setSelectedRecord(null);
    setPaymentHistory([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Fee Management</h2>
        <p className="text-sm md:text-base text-gray-600 mt-1">Manage student fee records and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expected</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : formatCurrency(totalExpected)}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 mt-1">
                {loading ? '...' : formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <i className="ri-check-double-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl md:text-3xl font-bold text-amber-600 mt-1">
                {loading ? '...' : formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
              <i className="ri-time-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">
                {loading ? '...' : overdueCount}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <i className="ri-alert-line text-2xl text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Reminder System */}
      <FeeRemindersPanel />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-56">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Term</label>
            <select
              value={selectedTermId || ''}
              onChange={(e) => setSelectedTermId(e.target.value || null)}
              disabled={termsLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by student name or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Fee Records</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredRecords.length} records found</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-3">Loading fee records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-3"></i>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <i className="ri-file-list-3-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-sm text-gray-500">No fee records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Term
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Fee
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {record.student_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {record.class_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {record.term_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(record.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-emerald-600">
                      {formatCurrency(record.amount_paid)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-amber-600">
                      {formatCurrency(record.balance)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(record.due_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        record.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleViewBalance(record)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer" 
                          title="View Details"
                        >
                          <i className="ri-eye-line text-lg"></i>
                        </button>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Record Payment">
                          <i className="ri-money-dollar-circle-line text-lg"></i>
                        </button>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer" title="Send Reminder">
                          <i className="ri-mail-send-line text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance Detail Modal */}
      {showBalanceModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Fee Balance Details</h3>
                <p className="text-sm text-teal-50 mt-1">{selectedRecord.student_name}</p>
              </div>
              <button 
                onClick={closeBalanceModal}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Student Name</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRecord.student_name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Class</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRecord.class_name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Term</p>
                  <p className="text-base font-semibold text-gray-900">{selectedRecord.term_name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Due Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(selectedRecord.due_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {/* Fee Summary */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 mb-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Fee Summary</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Fee Assigned</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedRecord.total_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount Paid</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(selectedRecord.amount_paid)}</span>
                  </div>
                  <div className="h-px bg-teal-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-700">Remaining Balance</span>
                    <span className="text-2xl font-bold text-amber-600">{formatCurrency(selectedRecord.balance)}</span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Payment History</h4>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading payment history...</p>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <i className="ri-file-list-line text-3xl text-gray-300 mb-2"></i>
                    <p className="text-sm text-gray-500">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-base font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(payment.payment_date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
                            {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <i className="ri-file-text-line"></i>
                          <span>Ref: {payment.reference_number}</span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button 
                onClick={closeBalanceModal}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Close
              </button>
              <button className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-printer-line mr-2"></i>
                Print Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}