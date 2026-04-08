import { useState } from 'react';

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const SEED_URL = `${SUPABASE_URL}/functions/v1/seed-test-users`;

const TEST_ACCOUNTS = [
  { role: 'super-admin', email: 'superadmin@gosmartmis.rw', name: 'Super Admin', icon: 'ri-shield-star-line', color: 'bg-rose-100 text-rose-700' },
  { role: 'director', email: 'director@gosmartmis.com', name: 'Dr. Marie Uwimana', icon: 'ri-building-2-line', color: 'bg-amber-100 text-amber-700' },
  { role: 'school_manager', email: 'schoolmanager@gosmartmis.com', name: 'Mr. Eric Nkurunziza', icon: 'ri-settings-3-line', color: 'bg-slate-100 text-slate-700' },
  { role: 'dean', email: 'dean@gosmartmis.com', name: 'Mr. Jean Habimana', icon: 'ri-user-star-line', color: 'bg-violet-100 text-violet-700' },
  { role: 'registrar', email: 'registrar@gosmartmis.com', name: 'Ms. Alice Mukamana', icon: 'ri-file-list-3-line', color: 'bg-teal-100 text-teal-700' },
  { role: 'accountant', email: 'accountant@gosmartmis.com', name: 'Mr. Patrick Nzeyimana', icon: 'ri-money-dollar-circle-line', color: 'bg-yellow-100 text-yellow-700' },
  { role: 'teacher', email: 'teacher@gosmartmis.com', name: 'Mrs. Grace Ingabire', icon: 'ri-book-open-line', color: 'bg-sky-100 text-sky-700' },
  { role: 'student', email: 'student@gosmartmis.com', name: 'Kevin Mugisha', icon: 'ri-graduation-cap-line', color: 'bg-green-100 text-green-700' },
];

type SeedResult = { email: string; status: string; error?: string };

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState('');

  const handleSeed = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    setRawResponse('');
    setDone(false);

    try {
      const res = await fetch(SEED_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const text = await res.text();
      setRawResponse(text);

      let json: { results?: SeedResult[]; error?: string; success?: boolean };
      try {
        json = JSON.parse(text);
      } catch {
        setError(`Server returned non-JSON response (status ${res.status}): ${text.slice(0, 300)}`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(`Server error (${res.status}): ${json.error || text}`);
        setLoading(false);
        return;
      }

      if (json.results) {
        setResults(json.results);
        setDone(true);
      } else {
        setError(json.error || 'Unexpected response — no results returned.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'created') return (
      <span className="text-emerald-600 font-semibold flex items-center gap-1 text-xs">
        <i className="ri-checkbox-circle-fill" /> Created
      </span>
    );
    if (status === 'already_exists') return (
      <span className="text-amber-600 font-semibold flex items-center gap-1 text-xs">
        <i className="ri-information-line" /> Already exists
      </span>
    );
    return (
      <span className="text-rose-600 font-semibold flex items-center gap-1 text-xs">
        <i className="ri-close-circle-line" /> Error
      </span>
    );
  };

  const hasErrors = results.some(r => r.status === 'error');
  const allSuccess = done && !hasErrors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-teal-600 mx-auto mb-4">
            <i className="ri-graduation-cap-fill text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Go Smart M.I.S — Setup</h1>
          <p className="text-gray-500 text-sm mt-1">Create all accounts with one click</p>
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <i className="ri-information-line text-amber-600 text-base mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800 leading-relaxed space-y-1">
            <p>Creates all role-based accounts in Supabase + the demo school <span className="font-mono font-semibold">future.gosmartmis.rw</span>.</p>
            <p>Run this <strong>once</strong> before logging in. Existing accounts will have their password reset to <span className="font-mono font-bold">Admin@1234</span>.</p>
          </div>
        </div>

        {/* What will be created */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What this creates</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Super Admin account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> Demo school: <span className="font-mono text-teal-600">future.gosmartmis.rw</span></div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Director account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × School Manager account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Dean account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Registrar account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Accountant account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Teacher account</div>
            <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-teal-500" /> 1 × Student account</div>
          </div>
        </div>

        {/* Account list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounts</p>
            <span className="font-mono text-teal-700 bg-teal-50 border border-teal-100 text-xs px-2.5 py-1 rounded-full font-semibold">
              Password: Admin@1234
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {TEST_ACCOUNTS.map((acc) => {
              const result = results.find(r => r.email === acc.email);
              return (
                <div key={acc.email} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${acc.color} flex-shrink-0`}>
                      <i className={`${acc.icon} text-sm`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{acc.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{acc.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium capitalize hidden sm:block">
                      {acc.role}
                    </span>
                    {result && statusIcon(result.status)}
                    {result?.status === 'error' && result.error && (
                      <span className="text-xs text-rose-500 max-w-[100px] truncate" title={result.error}>
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 text-rose-600 text-sm font-semibold">
              <i className="ri-error-warning-line text-base" />
              Setup Failed
            </div>
            <p className="text-xs text-rose-700 break-all">{error}</p>
            {rawResponse && (
              <details className="mt-2">
                <summary className="text-xs text-rose-500 cursor-pointer">Raw server response</summary>
                <pre className="text-xs text-rose-600 mt-1 whitespace-pre-wrap break-all bg-rose-100 rounded p-2">{rawResponse}</pre>
              </details>
            )}
          </div>
        )}

        {/* Success */}
        {allSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <i className="ri-checkbox-circle-fill text-emerald-600 text-xl flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-800">All 8 accounts are ready!</p>
            </div>
            <div className="bg-white rounded-lg border border-emerald-100 p-4 space-y-3 text-xs text-gray-700">
              <p className="font-semibold text-gray-800">Login instructions:</p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                  <div>
                    <p className="font-semibold">Super Admin</p>
                    <p className="text-gray-500 mt-0.5">Go to <a href="/login" className="text-teal-600 underline">/login</a> → select <strong>Super Admin</strong></p>
                    <p className="font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block text-gray-700">superadmin@gosmartmis.rw / Admin@1234</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                  <div>
                    <p className="font-semibold">School roles (Director, Dean, Registrar, Teacher, Student…)</p>
                    <p className="text-gray-500 mt-0.5">Go to <a href="/login" className="text-teal-600 underline">/login</a> → select the matching role</p>
                    <p className="font-mono bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block text-gray-700">e.g. director@gosmartmis.com / Admin@1234</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                  <div>
                    <p className="font-semibold">Demo school subdomain</p>
                    <p className="text-gray-500 mt-0.5">School slug is <span className="font-mono text-teal-700 bg-teal-50 px-1 rounded">future</span> → accessible at <span className="font-mono text-teal-700">future.gosmartmis.rw</span></p>
                  </div>
                </div>
              </div>
            </div>
            <a
              href="/login"
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <i className="ri-login-box-line" /> Go to Login Page
            </a>
          </div>
        )}

        {/* Partial errors */}
        {done && hasErrors && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <i className="ri-alert-line text-amber-600 text-xl mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Some accounts had errors</p>
              <p className="text-xs text-amber-700 mt-1">
                Successfully created accounts can still be used. Try running setup again to retry failed ones.
              </p>
            </div>
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold text-sm hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <><i className="ri-loader-4-line animate-spin" /> Creating accounts...</>
          ) : done ? (
            <><i className="ri-refresh-line" /> Re-run Setup</>
          ) : (
            <><i className="ri-user-add-line" /> Create All Test Accounts</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          After setup, go to{' '}
          <a href="/login" className="text-teal-600 hover:underline font-medium">/login</a>{' '}
          to sign in.
        </p>
      </div>
    </div>
  );
}
