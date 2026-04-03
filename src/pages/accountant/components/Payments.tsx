import { useState, useEffect } from 'react';
import { useFeePayments } from '../../../hooks/useFeePayments';
import { useStudents } from '../../../hooks/useStudents';
import { useClasses } from '../../../hooks/useClasses';
import { useTenant } from '../../../contexts/TenantContext';
import { supabase } from '../../../lib/supabase';

interface FeeRecordInfo {
  id: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  term_id: string;
}

export default function Payments() {
  const { schoolId } = useTenant();
  const { payments, loading, error, refetch, recordPayment } = useFeePayments(schoolId);
  const { students } = useStudents(schoolId);
  const { classes } = useClasses(schoolId);
  
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [feeRecordInfo, setFeeRecordInfo] = useState<FeeRecordInfo | null>(null);
  const [loadingFeeRecord, setLoadingFeeRecord] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter students by search term
  const filteredStudents = students.filter(s => 
    (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.student_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load fee record when student is selected
  useEffect(() => {
    if (selectedStudent) {
      loadFeeRecord(selectedStudent);
    } else {
      setFeeRecordInfo(null);
    }
  }, [selectedStudent]);

  const loadFeeRecord = async (studentId: string) => {
    setLoadingFeeRecord(true);
    try {
      const { data, error } = await supabase
        .from('fee_records')
        .select('id, amount_due, amount_paid, balance, term_id')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFeeRecordInfo(data);
      } else {
        setFeeRecordInfo(null);
      }
    } catch (err) {
      console.error('Error loading fee record:', err);
      setFeeRecordInfo(null);
    } finally {
      setLoadingFeeRecord(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedStudent) {
      setSubmitMessage({ type: 'error', text: 'Please select a student' });
      return;
    }
    if (!feeRecordInfo) {
      setSubmitMessage({ type: 'error', text: 'No active fee record found for this student' });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setSubmitMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    if (parseFloat(amount) > feeRecordInfo.balance) {
      setSubmitMessage({ type: 'error', text: 'Amount exceeds outstanding balance' });
      return;
    }
    if (!paymentMethod) {
      setSubmitMessage({ type: 'error', text: 'Please select a payment method' });
      return;
    }
    if (!referenceNumber.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please enter a reference number' });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    const result = await recordPayment({
      student_id: selectedStudent,
      fee_record_id: feeRecordInfo.id,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim(),
      notes: notes.trim() || undefined,
      student_name: searchTerm,
    });

    setSubmitting(false);

    if (result.success) {
      setSubmitMessage({ type: 'success', text: 'Payment recorded successfully!' });
      setTimeout(() => {
        resetForm();
        setShowModal(false);
      }, 1500);
    } else {
      setSubmitMessage({ type: 'error', text: result.error || 'Failed to record payment' });
    }
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedStudent('');
    setSelectedClass('');
    setAmount('');
    setPaymentMethod('');
    setReferenceNumber('');
    setNotes('');
    setFeeRecordInfo(null);
    setSubmitMessage(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'ri-money-dollar-circle-line';
      case 'bank': return 'ri-bank-line';
      case 'mobile': return 'ri-smartphone-line';
      default: return 'ri-wallet-line';
    }
  };

  // Calculate summary stats
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayCollection = payments
    .filter(p => new Date(p.payment_date) >= todayStart && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const monthCollection = payments
    .filter(p => new Date(p.payment_date) >= monthStart && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Payments</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">Track and manage all payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap"
        >
          <i className="ri-add-line mr-2"></i>
          Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Collection</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : formatCurrency(todayCollection)}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : formatCurrency(monthCollection)}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <i className="ri-calendar-line text-2xl text-white"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl md:text-3xl font-bold text-amber-600 mt-1">
                {loading ? '...' : pendingCount}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
              <i className="ri-time-line text-2xl text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
          <p className="text-sm text-gray-600 mt-1">{payments.length} payments recorded</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-3">Loading payments...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <i className="ri-error-warning-line text-4xl text-red-400 mb-3"></i>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <i className="ri-file-list-3-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-sm text-gray-500">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
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
                {payments.map((payment, index) => (
                  <tr key={payment.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {payment.student_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {payment.class_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        payment.payment_method === 'bank' ? 'bg-blue-100 text-blue-700' :
                        payment.payment_method === 'mobile' ? 'bg-purple-100 text-purple-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        <i className={getPaymentMethodIcon(payment.payment_method)}></i>
                        {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {payment.reference_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(payment.payment_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View Receipt">
                          <i className="ri-file-text-line text-lg"></i>
                        </button>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print Receipt">
                          <i className="ri-printer-line text-lg"></i>
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

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Record New Payment</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Student Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Student</label>
                <input
                  type="text"
                  placeholder="Type student name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                {searchTerm && filteredStudents.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                    {filteredStudents.slice(0, 10).map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student.id);
                          setSelectedClass(student.class_id);
                          setSearchTerm(student.full_name || '');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{student.full_name}</div>
                        <div className="text-sm text-gray-500">{student.student_id} • {student.class_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fee Record Info */}
              {selectedStudent && (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 border border-teal-200">
                  {loadingFeeRecord ? (
                    <div className="text-center py-4">
                      <div className="inline-block w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading fee details...</p>
                    </div>
                  ) : feeRecordInfo ? (
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 mb-3">Fee Information</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Due:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(feeRecordInfo.amount_due)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(feeRecordInfo.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-teal-200">
                        <span className="text-gray-700 font-semibold">Current Balance:</span>
                        <span className="font-bold text-lg text-red-600">{formatCurrency(feeRecordInfo.balance)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="ri-error-warning-line text-3xl text-amber-500 mb-2"></i>
                      <p className="text-sm text-gray-700 font-medium">No active fee record found</p>
                      <p className="text-xs text-gray-500 mt-1">Please assign fees to this student first</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={!!selectedStudent}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (RWF)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={!feeRecordInfo}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mobile">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    placeholder="Enter reference number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div className={`p-4 rounded-xl ${
                  submitMessage.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <i className={`${
                      submitMessage.type === 'success' 
                        ? 'ri-checkbox-circle-line text-emerald-600' 
                        : 'ri-error-warning-line text-red-600'
                    } text-xl`}></i>
                    <p className={`text-sm font-medium ${
                      submitMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {submitMessage.text}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting || !feeRecordInfo}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Recording...
                  </>
                ) : (
                  'Record Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}