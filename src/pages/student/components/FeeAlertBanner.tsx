import { useState } from 'react';
import { FeeStatus } from '../../../hooks/useStudentDashboard';

interface Props {
  feeStatus: FeeStatus;
  onNavigateFees?: () => void;
}

const DISMISS_KEY = 'fee_alert_dismissed';

function getDismissKey(urgency: string) {
  const today = new Date().toISOString().split('T')[0];
  return `${DISMISS_KEY}_${urgency}_${today}`;
}

function isBannerDismissed(urgency: string) {
  // Overdue and due_today are never permanently dismissible — too important
  if (urgency === 'overdue' || urgency === 'due_today') return false;
  try {
    return localStorage.getItem(getDismissKey(urgency)) === '1';
  } catch (_e) {
    return false;
  }
}

function dismissBanner(urgency: string) {
  try {
    localStorage.setItem(getDismissKey(urgency), '1');
  } catch (_e) {
    // ignore storage errors in restricted environments
  }
}

export default function FeeAlertBanner({ feeStatus, onNavigateFees }: Props) {
  const [dismissed, setDismissed] = useState(() => isBannerDismissed(feeStatus.urgency));

  if (!feeStatus.hasBalance || dismissed) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format(n);

  const paidPct = feeStatus.amountDue > 0
    ? Math.min(100, Math.round((feeStatus.amountPaid / feeStatus.amountDue) * 100))
    : 0;

  const dueDateStr = feeStatus.dueDate
    ? new Date(feeStatus.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const handleDismiss = () => {
    dismissBanner(feeStatus.urgency);
    setDismissed(true);
  };

  /* ------------------------------------------------------------------ */
  /*  OVERDUE                                                             */
  /* ------------------------------------------------------------------ */
  if (feeStatus.urgency === 'overdue') {
    const daysOverdue = Math.abs(feeStatus.daysUntilDue ?? 0);
    return (
      <div className="rounded-2xl overflow-hidden border-2 border-red-300 bg-gradient-to-br from-red-50 to-red-100">
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-400 to-rose-500" />

        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-500 shadow-lg shadow-red-200">
                <i className="ri-error-warning-fill text-3xl text-white"></i>
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white uppercase tracking-wide">
                  <i className="ri-alarm-warning-line"></i>
                  Overdue
                </span>
                <span className="text-xs font-semibold text-red-600">
                  {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} past due date
                  {dueDateStr ? ` (${dueDateStr})` : ''}
                </span>
              </div>

              <h3 className="text-lg font-bold text-red-900 mb-1">
                Fee Payment Overdue — Immediate Action Required
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Your school fee payment is overdue. Please visit the school finance office as soon as possible to avoid disruption to your academic records.
              </p>

              {/* Balance breakdown */}
              <div className="bg-white/70 rounded-xl p-4 mb-4 border border-red-200">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500 text-xs">Total Fee</span>
                    <p className="font-bold text-gray-800">{fmt(feeStatus.amountDue)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Paid</span>
                    <p className="font-bold text-emerald-600">{fmt(feeStatus.amountPaid)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Remaining</span>
                    <p className="text-xl font-extrabold text-red-600">{fmt(feeStatus.balance)}</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{paidPct}% paid</span>
                </div>
              </div>

              <button
                onClick={onNavigateFees}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
              >
                <i className="ri-building-line"></i>
                Visit School Finance Office
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  DUE TODAY                                                           */
  /* ------------------------------------------------------------------ */
  if (feeStatus.urgency === 'due_today') {
    return (
      <div className="rounded-2xl overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-200">
                <i className="ri-alarm-fill text-3xl text-white"></i>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white uppercase tracking-wide">
                  <i className="ri-time-line"></i>
                  Due Today
                </span>
              </div>

              <h3 className="text-lg font-bold text-amber-900 mb-1">
                Fee Payment Due Today
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Your school fee payment is due today{dueDateStr ? ` (${dueDateStr})` : ''}. Please make payment at the school finance office before end of day.
              </p>

              <div className="bg-white/70 rounded-xl p-4 mb-4 border border-amber-200">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-500 text-xs">Total Fee</span>
                    <p className="font-bold text-gray-800">{fmt(feeStatus.amountDue)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Paid</span>
                    <p className="font-bold text-emerald-600">{fmt(feeStatus.amountPaid)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Outstanding</span>
                    <p className="text-xl font-extrabold text-amber-600">{fmt(feeStatus.balance)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{paidPct}% paid</span>
                </div>
              </div>

              <button
                onClick={onNavigateFees}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
              >
                <i className="ri-money-dollar-circle-line"></i>
                Pay Now — {fmt(feeStatus.balance)} Due
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  DUE SOON (1–7 days)                                                */
  /* ------------------------------------------------------------------ */
  if (feeStatus.urgency === 'due_soon') {
    const days = feeStatus.daysUntilDue ?? 0;
    return (
      <div className="rounded-2xl overflow-hidden border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-400" />

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-yellow-400 shadow-md">
                <i className="ri-calendar-close-line text-xl text-white"></i>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900 uppercase tracking-wide">
                    {days} day{days !== 1 ? 's' : ''} left
                  </span>
                  {dueDateStr && (
                    <span className="text-xs text-yellow-700">Due {dueDateStr}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-yellow-900">Fee Payment Coming Up</h3>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Outstanding balance: <strong>{fmt(feeStatus.balance)}</strong>.
                  {days <= 3 ? ' Please arrange payment soon.' : ' Plan ahead to avoid late fees.'}
                </p>

                {/* Compact progress */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-yellow-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-yellow-700 whitespace-nowrap">{paidPct}% paid of {fmt(feeStatus.amountDue)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onNavigateFees}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold transition-colors whitespace-nowrap"
              >
                <i className="ri-money-dollar-circle-line"></i>
                View Fees
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-yellow-600 hover:bg-yellow-200 transition-colors cursor-pointer"
                title="Dismiss for today"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  PENDING (balance exists, no urgent due date)                       */
  /* ------------------------------------------------------------------ */
  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-teal-100">
            <i className="ri-money-dollar-circle-line text-lg text-teal-600"></i>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-teal-900">Outstanding Fee Balance</p>
            <p className="text-xs text-teal-700">
              {fmt(feeStatus.balance)} remaining
              {dueDateStr ? ` · Due ${dueDateStr}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onNavigateFees}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 border border-teal-300 hover:bg-teal-100 transition-colors whitespace-nowrap"
          >
            View Details
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-teal-500 hover:bg-teal-100 transition-colors cursor-pointer"
            title="Dismiss for today"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
