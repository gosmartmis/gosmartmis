import { useState } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';

const TEST_ACCOUNTS = [
  { role: 'super-admin', email: 'superadmin@gosmartmis.rw', name: 'Super Admin', icon: 'ri-shield-star-line', color: 'bg-rose-100 text-rose-700' },
  { role: 'director', email: 'demo.director@gosmartmis.rw', name: 'Dr. Marie Uwimana', icon: 'ri-building-2-line', color: 'bg-amber-100 text-amber-700' },
  { role: 'school-manager', email: 'demo.manager@gosmartmis.rw', name: 'Mr. Eric Nkurunziza', icon: 'ri-settings-3-line', color: 'bg-slate-100 text-slate-700' },
  { role: 'dean', email: 'demo.dean@gosmartmis.rw', name: 'Mr. Jean Habimana', icon: 'ri-user-star-line', color: 'bg-violet-100 text-violet-700' },
  { role: 'registrar', email: 'demo.registrar@gosmartmis.rw', name: 'Ms. Alice Mukamana', icon: 'ri-file-list-3-line', color: 'bg-teal-100 text-teal-700' },
  { role: 'accountant', email: 'demo.accountant@gosmartmis.rw', name: 'Mr. Patrick Nzeyimana', icon: 'ri-money-dollar-circle-line', color: 'bg-yellow-100 text-yellow-700' },
  { role: 'teacher', email: 'demo.teacher@gosmartmis.rw', name: 'Mrs. Grace Ingabire', icon: 'ri-book-open-line', color: 'bg-sky-100 text-sky-700' },
  { role: 'student', email: 'demo.student@gosmartmis.rw', name: 'Kevin Mugisha', icon: 'ri-graduation-cap-line', color: 'bg-green-100 text-green-700' },
];

type SeedResult = { email: string; status: string; error?: string };

export default function SeedUsers() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const token = await getAuthToken();

      const res = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/seed-test-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),          },
        }
      );
      const json = await res.json();
      if (json.results) {
        setResults(json.results);
        setDone(true);
      } else {
        setError(json.error || 'Unexpected response from server.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed users.');
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'created') return <span className="text-emerald-600 font-semibold flex items-center gap-1"><i className="ri-checkbox-circle-fill" /> Created</span>;
    if (status === 'updated' || status === 'already_exists') return <span className="text-amber-600 font-semibold flex items-center gap-1"><i className="ri-information-line" /> Updated</span>;
    return <span className="text-rose-600 font-semibold flex items-center gap-1"><i className="ri-close-circle-line" /> Error</span>;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-50">
            <i className="ri-user-add-line text-teal-600 text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create Test Accounts</h2>
            <p className="text-sm text-gray-500">One-click setup for all role-based test users</p>
          </div>
        </div>
      </div>

      {/* Account list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Demo Accounts — Password: <span className="font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Demo@GoSmart2024</span>
          </p>
          <span className="text-xs text-gray-400">School: <span className="font-mono text-gray-600">demo</span></span>
        </div>
        <div className="divide-y divide-gray-50">
          {TEST_ACCOUNTS.map((acc) => {
            const result = results.find(r => r.email === acc.email);
            return (
              <div key={acc.email} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${acc.color}`}>
                    <i className={`${acc.icon} text-base`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{acc.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{acc.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">{acc.role}</span>
                  {result && <div className="text-xs">{statusIcon(result.status)}</div>}
                  {result?.error && (
                    <span className="text-xs text-rose-500 max-w-[120px] truncate" title={result.error}>{result.error}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <i className="ri-error-warning-line text-base" />
          {error}
        </div>
      )}

      {/* Success banner */}
      {done && results.every(r => r.status !== 'error') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-xl" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">All test accounts are ready!</p>
              <p className="text-xs text-emerald-600 mt-0.5">Demo password: <span className="font-mono font-bold">Demo@GoSmart2024</span> — Super Admin: <span className="font-mono font-bold">Admin@1234</span></p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-emerald-100 p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">Login instructions:</p>
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <i className="ri-shield-star-line text-rose-500 mt-0.5" />
              <span><strong>Super Admin</strong> — go to <span className="font-mono bg-gray-100 px-1 rounded">/login</span>, select Super Admin role</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <i className="ri-building-2-line text-amber-500 mt-0.5" />
              <span><strong>School roles</strong> (Director, Dean, Registrar, Accountant, Teacher, Student, School Manager) — go to <span className="font-mono bg-gray-100 px-1 rounded">/login</span> and select the matching role</span>
            </div>
          </div>
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleSeed}
        disabled={loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
      >
        {loading ? (
          <><i className="ri-loader-4-line animate-spin" /> Creating accounts...</>
        ) : done ? (
          <><i className="ri-refresh-line" /> Re-run Seed</>
        ) : (
          <><i className="ri-user-add-line" /> Create All Test Accounts</>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        Only accessible by Super Admin. Existing accounts will have their password refreshed to the correct demo password.
      </p>
    </div>
  );
}
