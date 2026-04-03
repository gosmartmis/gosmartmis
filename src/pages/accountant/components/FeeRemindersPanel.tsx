import { useState, useEffect, useCallback } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

interface ReminderStats {
  overdue: number;
  due_today: number;
  due_in_3: number;
  due_in_7: number;
  total_unpaid: number;
}

interface ReminderResult {
  success: boolean;
  overdue: number;
  due_today: number;
  due_soon: number;
  notifications_sent: number;
  errors?: string[];
  error?: string;
}

const AUTO_RUN_KEY = 'fee_reminders_last_run';
const AUTO_RUN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function FeeRemindersPanel() {
  const { schoolId } = useTenant();
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<ReminderResult | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // ------------------------------------------------------------------
  // Load urgency stats from fee_records (client-side bucketing)
  // ------------------------------------------------------------------
  const loadStats = useCallback(async () => {
    if (!schoolId) return;
    setLoadingStats(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('fee_records')
        .select('due_date, balance, status')
        .eq('school_id', schoolId)
        .gt('balance', 0)
        .not('status', 'eq', 'paid');

      if (error) throw error;

      const records = data || [];
      let overdue = 0;
      let due_today = 0;
      let due_in_3 = 0;
      let due_in_7 = 0;

      records.forEach((r) => {
        if (!r.due_date) return;
        const due = new Date(r.due_date);
        due.setHours(0, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24;
        const days = Math.round((due.getTime() - today.getTime()) / msPerDay);

        if (days < 0) overdue++;
        else if (days === 0) due_today++;
        else if (days <= 3) due_in_3++;
        else if (days <= 7) due_in_7++;
      });

      setStats({
        overdue,
        due_today,
        due_in_3,
        due_in_7,
        total_unpaid: records.length,
      });
    } catch (err) {
      console.error('Error loading reminder stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [schoolId]);

  // ------------------------------------------------------------------
  // Trigger edge function to send notifications
  // ------------------------------------------------------------------
  const sendReminders = useCallback(
    async (threshold: number, silent = false): Promise<ReminderResult | null> => {
      if (!schoolId) return null;
      if (!silent) setSending(true);
      try {
        const token = await getAuthToken();

        const res = await fetch(
          'https://kunqiuvnbtfdaraizgev.supabase.co/functions/v1/fee-reminders',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ school_id: schoolId, days_threshold: threshold }),
          },
        );

        const result: ReminderResult = await res.json();
        const now = new Date().toLocaleString();
        localStorage.setItem(AUTO_RUN_KEY, Date.now().toString());
        setLastRunTime(now);

        if (!silent) setLastResult(result);
        return result;
      } catch (err) {
        console.error('Error sending reminders:', err);
        if (!silent) setLastResult({ success: false, overdue: 0, due_today: 0, due_soon: 0, notifications_sent: 0, error: String(err) });
        return null;
      } finally {
        if (!silent) setSending(false);
      }
    },
    [schoolId],
  );

  // ------------------------------------------------------------------
  // Auto-trigger on mount if 24h have passed since last run
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!schoolId || autoTriggered) return;
    setAutoTriggered(true);

    const lastRun = Number(localStorage.getItem(AUTO_RUN_KEY) || '0');
    const elapsed = Date.now() - lastRun;

    if (elapsed > AUTO_RUN_INTERVAL_MS) {
      sendReminders(7, true).then(() => {
        setLastRunTime(new Date().toLocaleString());
      });
    } else {
      const last = new Date(lastRun).toLocaleString();
      setLastRunTime(last);
    }
  }, [schoolId, autoTriggered, sendReminders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ------------------------------------------------------------------
  // Urgency card helper
  // ------------------------------------------------------------------
  const urgencyCards = [
    {
      key: 'overdue',
      label: 'Overdue',
      count: stats?.overdue ?? 0,
      desc: 'Past due date',
      icon: 'ri-error-warning-line',
      bg: 'bg-red-50 border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-700',
      countColor: 'text-red-600',
    },
    {
      key: 'due_today',
      label: 'Due Today',
      count: stats?.due_today ?? 0,
      desc: 'Payment needed now',
      icon: 'ri-alarm-line',
      bg: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-700',
      countColor: 'text-amber-600',
    },
    {
      key: 'due_in_3',
      label: 'Due in 3 Days',
      count: stats?.due_in_3 ?? 0,
      desc: 'Upcoming deadline',
      icon: 'ri-time-line',
      bg: 'bg-orange-50 border-orange-200',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700',
      countColor: 'text-orange-600',
    },
    {
      key: 'due_in_7',
      label: 'Due in 7 Days',
      count: stats?.due_in_7 ?? 0,
      desc: 'Notify ahead of time',
      icon: 'ri-calendar-event-line',
      bg: 'bg-teal-50 border-teal-200',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      textColor: 'text-teal-700',
      countColor: 'text-teal-600',
    },
  ];

  const urgentTotal = (stats?.overdue ?? 0) + (stats?.due_today ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-amber-100 rounded-xl">
            <i className="ri-notification-3-line text-xl text-amber-600"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Fee Reminder System</h3>
            <p className="text-xs text-gray-500">
              {loadingStats
                ? 'Checking fee records…'
                : `${stats?.total_unpaid ?? 0} unpaid records · auto-runs daily`}
            </p>
          </div>
          {urgentTotal > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 whitespace-nowrap">
              {urgentTotal} urgent
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Remind if due within</label>
            <select
              value={daysThreshold}
              onChange={(e) => setDaysThreshold(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
          </div>
          <button
            onClick={() => sendReminders(daysThreshold)}
            disabled={sending || loadingStats}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 whitespace-nowrap"
          >
            {sending ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Sending…
              </>
            ) : (
              <>
                <i className="ri-send-plane-line"></i>
                Send Reminders Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Urgency Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y sm:divide-y-0 divide-gray-100">
        {urgencyCards.map((card) => (
          <div key={card.key} className={`p-5 ${loadingStats ? 'animate-pulse' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${card.iconBg}`}>
                <i className={`${card.icon} text-lg ${card.iconColor}`}></i>
              </div>
              {card.count > 0 && !loadingStats && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.bg} ${card.textColor} border`}>
                  {card.count}
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold ${loadingStats ? 'text-gray-200' : card.countColor}`}>
              {loadingStats ? '—' : card.count}
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{card.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Result banner + last run info */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <i className="ri-history-line text-gray-400"></i>
          {lastRunTime
            ? <>Last auto-run: <span className="font-semibold text-gray-700">{lastRunTime}</span></>
            : 'Auto-run scheduled at next page load'}
        </div>

        {lastResult && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
            lastResult.success && !lastResult.error
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <i className={lastResult.success && !lastResult.error
              ? 'ri-checkbox-circle-line'
              : 'ri-error-warning-line'}></i>
            {lastResult.success && !lastResult.error
              ? `${lastResult.notifications_sent} notification${lastResult.notifications_sent !== 1 ? 's' : ''} sent — ${lastResult.overdue} overdue · ${lastResult.due_today} due today · ${lastResult.due_soon} due soon`
              : `Failed: ${lastResult.error || 'Unknown error'}`}
          </div>
        )}
      </div>

      {/* How it works info */}
      <div className="px-6 pb-5">
        <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 flex gap-3">
          <i className="ri-information-line text-teal-600 text-lg flex-shrink-0 mt-0.5"></i>
          <div className="text-xs text-teal-800 space-y-1">
            <p className="font-semibold">How reminders work</p>
            <p>
              Each time a reminder runs, students with a portal account receive a bell notification with their outstanding balance and due date. 
              Staff (Accountant, Director) receive a summary count. Reminders also <strong>auto-trigger once per day</strong> when this page is opened.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
