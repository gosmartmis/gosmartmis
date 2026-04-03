import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';

interface CheckResult {
  label: string;
  status: 'ok' | 'warn' | 'error' | 'checking';
  detail: string;
  latency?: number;
}

export default function HealthPanel() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const results: CheckResult[] = [];

    // 1. DB connection check
    const t0 = Date.now();
    try {
      const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const latency = Date.now() - t0;
      if (error) throw error;
      results.push({ label: 'Database Connection', status: 'ok', detail: `Connected. ${count ?? 0} profiles found.`, latency });
    } catch (e: unknown) {
      results.push({ label: 'Database Connection', status: 'error', detail: `Failed: ${e instanceof Error ? e.message : 'Unknown error'}` });
    }

    // 2. Auth service check
    const t1 = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      const latency = Date.now() - t1;
      if (error) throw error;
      results.push({ label: 'Auth Service', status: 'ok', detail: data.session ? 'Session active.' : 'Auth reachable, no active session.', latency });
    } catch (e: unknown) {
      results.push({ label: 'Auth Service', status: 'error', detail: `Auth error: ${e instanceof Error ? e.message : 'Unknown error'}` });
    }

    // 3. Storage check
    const t2 = Date.now();
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const latency = Date.now() - t2;
      if (error) throw error;
      results.push({ label: 'Storage Service', status: 'ok', detail: `${data.length} bucket(s): ${data.map(b => b.name).join(', ') || 'none'}`, latency });
    } catch (e: unknown) {
      results.push({ label: 'Storage Service', status: 'error', detail: `Storage error: ${e instanceof Error ? e.message : 'Unknown error'}` });
    }

    // 4. Key tables row counts
    const tables = ['schools', 'profiles', 'students', 'timetables', 'marks', 'attendance'];
    for (const table of tables) {
      const t = Date.now();
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        const latency = Date.now() - t;
        if (error) throw error;
        const status = (count ?? 0) === 0 ? 'warn' : 'ok';
        results.push({ label: `Table: ${table}`, status, detail: `${count ?? 0} rows`, latency });
      } catch (e: unknown) {
        results.push({ label: `Table: ${table}`, status: 'error', detail: `Query failed: ${e instanceof Error ? e.message : 'Unknown'}` });
      }
    }

    // 5. Check RLS on profiles
    const t3 = Date.now();
    try {
      const { data, error } = await supabase.rpc('check_policy_exists' as never, {});
      const latency = Date.now() - t3;
      if (error) {
        results.push({ label: 'RLS Policies', status: 'warn', detail: 'Could not verify RLS (RPC not available). Manual check recommended.', latency });
      } else {
        results.push({ label: 'RLS Policies', status: 'ok', detail: 'RLS check passed.', latency });
      }
    } catch {
      results.push({ label: 'RLS Policies', status: 'warn', detail: 'Could not auto-verify RLS. Check Supabase dashboard manually.', latency: Date.now() - t3 });
    }

    setChecks(results);
    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const statusColor: Record<string, string> = {
    ok: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    warn: 'text-amber-600 bg-amber-50 border-amber-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    checking: 'text-gray-500 bg-gray-50 border-gray-200',
  };
  const statusIcon: Record<string, string> = {
    ok: 'ri-checkbox-circle-fill',
    warn: 'ri-alert-line',
    error: 'ri-close-circle-fill',
    checking: 'ri-loader-4-line animate-spin',
  };
  const totalOk = checks.filter(c => c.status === 'ok').length;
  const totalWarn = checks.filter(c => c.status === 'warn').length;
  const totalErr = checks.filter(c => c.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <i className="ri-checkbox-circle-fill" /> {totalOk} Passing
          </span>
          {totalWarn > 0 && (
            <span className="flex items-center gap-1 text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <i className="ri-alert-line" /> {totalWarn} Warnings
            </span>
          )}
          {totalErr > 0 && (
            <span className="flex items-center gap-1 text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              <i className="ri-close-circle-fill" /> {totalErr} Errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastRun && <span className="text-xs text-gray-400">Last run: {lastRun.toLocaleTimeString()}</span>}
          <button
            onClick={runChecks}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <i className={`ri-refresh-line ${running ? 'animate-spin' : ''}`} />
            {running ? 'Running...' : 'Re-run Checks'}
          </button>
        </div>
      </div>

      {/* Check results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {running && checks.length === 0
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))
          : checks.map((c, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${statusColor[c.status]}`}>
                <i className={`${statusIcon[c.status]} text-xl w-5 h-5 flex items-center justify-center flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{c.label}</div>
                  <div className="text-xs opacity-80 truncate">{c.detail}</div>
                </div>
                {c.latency !== undefined && (
                  <span className="text-xs font-mono opacity-60 flex-shrink-0">{c.latency}ms</span>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
