import { useState } from 'react';
import HealthPanel from './inspector/HealthPanel';
import AIDebugChat from './inspector/AIDebugChat';
import DBInspector from './inspector/DBInspector';

const TABS = [
  { id: 'ai', label: 'AI Debug Assistant', icon: 'ri-robot-2-line' },
  { id: 'health', label: 'System Health', icon: 'ri-heart-pulse-line' },
  { id: 'db', label: 'DB Inspector', icon: 'ri-database-2-line' },
  { id: 'logs', label: 'Error Logs', icon: 'ri-file-list-3-line' },
];

// ── Inline edge-function tester (lightweight, no separate file) ──
function EdgeFunctionTester() {
  const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
  const ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

  const FUNCTIONS = [
    { slug: 'setup-avatar-bucket', label: 'Setup Avatar Bucket' },
    { slug: 'seed-test-users', label: 'Seed Test Users' },
    { slug: 'onboard-school', label: 'Onboard School' },
    { slug: 'process-notifications', label: 'Process Notifications' },
    { slug: 'fee-reminders', label: 'Fee Reminders' },
    { slug: 'create-notification', label: 'Create Notification' },
  ];

  const [fn, setFn] = useState(FUNCTIONS[0].slug);
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{\n  \n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);

  async function invoke() {
    setLoading(true);
    setResponse(null);
    try {
      const opts: { method: string; headers: Record<string, string>; body?: string } = {
        method,
        headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
      };
      if (method === 'POST') opts.body = body;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, opts);
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not json */ }
      setResponse({ status: res.status, body: pretty });
    } catch (e: unknown) {
      setResponse({ status: 0, body: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Function</label>
          <select
            value={fn}
            onChange={e => setFn(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          >
            {FUNCTIONS.map(f => <option key={f.slug} value={f.slug}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Method</label>
          <div className="flex gap-2">
            {(['GET', 'POST'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${method === m ? 'bg-teal-500 text-white border-teal-500' : 'text-gray-700 border-gray-200 hover:border-teal-400'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {method === 'POST' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Request Body (JSON)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        )}
        <button
          onClick={invoke}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 cursor-pointer"
        >
          <i className={`ri-play-fill ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Invoking…' : 'Invoke Function'}
        </button>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Response</label>
        <div className="h-64 bg-slate-900 rounded-xl overflow-auto">
          {!response ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">Run the function to see the response</div>
          ) : (
            <div>
              <div className={`px-3 py-2 text-xs font-mono font-semibold border-b border-slate-800 ${response.status >= 200 && response.status < 300 ? 'text-emerald-400' : 'text-red-400'}`}>
                HTTP {response.status || 'ERROR'}
              </div>
              <pre className="p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-auto">{response.body}</pre>
            </div>
          )}
        </div>
        <button
          onClick={() => response && navigator.clipboard.writeText(response.body)}
          disabled={!response}
          className="mt-2 text-xs text-gray-500 hover:text-teal-600 flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <i className="ri-clipboard-line" /> Copy response
        </button>
      </div>
    </div>
  );
}

// ── Inline Error Logs viewer ──
import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface LogEntry {
  id: string;
  created_at: string;
  notification_type?: string;
  status?: string;
  error_message?: string;
  recipient?: string;
  [key: string]: unknown;
}

function ErrorLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'failed'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const q = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      const { data } = filter === 'failed'
        ? await q.eq('status', 'failed')
        : await q;
      setLogs((data as LogEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">Recent Notification Logs</span>
        <div className="flex gap-2 ml-auto">
          {(['all', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors cursor-pointer ${filter === f ? 'bg-teal-500 text-white border-teal-500' : 'text-gray-600 border-gray-200 hover:border-teal-400'}`}
            >
              {f === 'all' ? 'All Logs' : 'Failed Only'}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="ri-file-list-3-line text-4xl" />
          <p className="text-sm mt-2">No logs found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className={`flex items-start gap-3 p-3 rounded-xl border ${log.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <i className={`mt-0.5 ${log.status === 'failed' ? 'ri-close-circle-fill text-red-500' : 'ri-checkbox-circle-fill text-emerald-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900">{log.notification_type ?? 'notification'}</span>
                  {log.recipient && <span className="text-xs text-gray-500 truncate">{String(log.recipient)}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{String(log.status ?? 'unknown')}</span>
                </div>
                {log.error_message && <p className="text-xs text-red-600 mt-1 font-mono truncate">{String(log.error_message)}</p>}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main SystemInspector ──
export default function SystemInspector() {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <i className="ri-bug-2-line text-teal-400 text-2xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Debug &amp; System Inspector</h2>
          <p className="text-sm text-gray-500">AI-powered error analysis · Live DB inspector · Edge function tester · System health</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-emerald-700">System Online</span>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <i className={`${tab.icon} text-base`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {activeTab === 'ai' && <AIDebugChat />}
        {activeTab === 'health' && <HealthPanel />}
        {activeTab === 'db' && <DBInspector />}
        {activeTab === 'logs' && <ErrorLogs />}
      </div>

      {/* Edge function tester — always visible at bottom */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i className="ri-code-s-slash-line text-lg text-teal-600" />
          Edge Function Tester
        </h3>
        <EdgeFunctionTester />
      </div>
    </div>
  );
}
