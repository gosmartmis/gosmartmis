import { useState, useEffect } from 'react';
import type { SchoolBilling, NewPaymentData, UpdateSubscriptionData } from '../../../hooks/useSubscriptions';

interface RenewalModalProps {
  school: SchoolBilling;
  onClose: () => void;
  onRenew: (paymentData: NewPaymentData, subscriptionUpdate: UpdateSubscriptionData) => Promise<void>;
}

const PAYMENT_METHODS = ['Bank Transfer', 'Mobile Money', 'Cash', 'Cheque'];

const RENEWAL_PERIODS = [
  { label: '1 Year', months: 12 },
  { label: '2 Years', months: 24 },
  { label: '3 Years', months: 36 },
  { label: 'Custom', months: 0 },
];

function addMonths(dateStr: string | null, months: number): string {
  const base = dateStr && new Date(dateStr) > new Date() ? new Date(dateStr) : new Date();
  base.setMonth(base.getMonth() + months);
  return base.toISOString().split('T')[0];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getDaysRemaining(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function RenewalModal({ school, onClose, onRenew }: RenewalModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(12);
  const [customExpiry, setCustomExpiry] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const [amount, setAmount] = useState(school.subscription_amount || 0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending' | 'failed'>('completed');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newExpiry = isCustom
    ? customExpiry
    : addMonths(school.subscription_expiry_date, selectedPeriod);

  const netAmount = amount - discount;
  const daysLeft = getDaysRemaining(school.subscription_expiry_date);
  const isExpired = daysLeft !== null && daysLeft <= 0;

  useEffect(() => {
    // Pre-fill custom expiry when switching to custom
    if (isCustom && !customExpiry) {
      setCustomExpiry(addMonths(school.subscription_expiry_date, 12));
    }
  }, [isCustom, customExpiry, school.subscription_expiry_date]);

  const handlePeriodSelect = (months: number) => {
    if (months === 0) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSelectedPeriod(months);
    }
  };

  const handleSubmit = async () => {
    if (!newExpiry) {
      setError('Please select a valid expiry date.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const paymentData: NewPaymentData = {
        school_id: school.id,
        amount,
        discount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: paymentStatus,
        notes: notes || `Subscription renewal — extended to ${newExpiry}`,
      };
      const subscriptionUpdate: UpdateSubscriptionData = {
        subscription_expiry_date: newExpiry,
        subscription_start_date: new Date().toISOString().split('T')[0],
        subscription_status: 'active',
        is_active: true,
      };
      await onRenew(paymentData, subscriptionUpdate);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Renewal failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <i className="ri-refresh-line text-teal-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Renew Subscription</h2>
              <p className="text-xs text-gray-500">{school.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Current Status Banner */}
          <div className={`rounded-xl p-4 flex items-start gap-3 ${isExpired ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-100' : 'bg-amber-100'}`}>
              <i className={`text-base ${isExpired ? 'ri-error-warning-line text-red-600' : 'ri-alarm-warning-line text-amber-600'}`}></i>
            </div>
            <div>
              <p className={`text-sm font-medium ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                {isExpired
                  ? `Subscription expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? 's' : ''} ago`
                  : `Subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
              </p>
              <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                Current expiry: {school.subscription_expiry_date
                  ? new Date(school.subscription_expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'Not set'}
              </p>
            </div>
          </div>

          {/* Renewal Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Renewal Period</label>
            <div className="grid grid-cols-4 gap-2">
              {RENEWAL_PERIODS.map((p) => {
                const active = p.months === 0 ? isCustom : (!isCustom && selectedPeriod === p.months);
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePeriodSelect(p.months)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {isCustom && (
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Custom Expiry Date</label>
                <input
                  type="date"
                  value={customExpiry}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
          </div>

          {/* New Expiry Preview */}
          {newExpiry && (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <i className="ri-calendar-check-line text-teal-600"></i>
                <span className="text-sm font-medium text-teal-800">New Expiry Date</span>
              </div>
              <span className="text-sm font-bold text-teal-700">
                {new Date(newExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Payment Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i className="ri-receipt-line text-gray-400"></i>
              Payment Details
            </h3>
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (RWF) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Net Amount */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 font-medium">Net Payable</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(netAmount)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TXN-2025-001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as 'completed' | 'pending' | 'failed')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Annual renewal payment via MTN Mobile Money"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Renewal Summary</p>
            {[
              { label: 'School', value: school.name },
              { label: 'Package', value: school.subscription_package || school.subscription_plan },
              { label: 'New Status', value: 'Active', highlight: true },
              { label: 'New Expiry', value: newExpiry ? new Date(newExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', highlight: true },
              { label: 'Payment', value: formatCurrency(netAmount) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className={`font-medium ${row.highlight ? 'text-teal-700' : 'text-gray-800'} capitalize`}>{row.value}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <i className="ri-error-warning-line text-red-500 shrink-0"></i>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !newExpiry || amount <= 0}
            className="flex-1 py-2.5 text-sm text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap font-medium flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><i className="ri-loader-4-line animate-spin"></i> Processing…</>
            ) : (
              <><i className="ri-refresh-line"></i> Confirm Renewal</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
