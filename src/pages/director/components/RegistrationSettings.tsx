import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

interface RegConfig {
  prefix: string;
  padding: number;
  counter: number;
  year_reset: boolean;
}

const PADDING_OPTIONS = [
  { value: 3, label: '3 digits', example: '001' },
  { value: 4, label: '4 digits', example: '0001' },
  { value: 5, label: '5 digits', example: '00001' },
];

function buildPreview(prefix: string, padding: number, start: number, count: number): string[] {
  if (!prefix.trim()) return [];
  const year = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => {
    const n = start + i + 1;
    const padded = String(n).padStart(padding, '0');
    return `${prefix.trim().toUpperCase()}${padded}/${year}`;
  });
}

export default function RegistrationSettings({ schoolId }: { schoolId: string }) {
  const [config, setConfig] = useState<RegConfig>({ prefix: '', padding: 3, counter: 0, year_reset: true });
  const [original, setOriginal] = useState<RegConfig>({ prefix: '', padding: 3, counter: 0, year_reset: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from('schools')
      .select('reg_number_prefix, reg_number_padding, reg_number_counter, reg_number_year_reset')
      .eq('id', schoolId)
      .maybeSingle();
    if (data) {
      const c: RegConfig = {
        prefix: data.reg_number_prefix || '',
        padding: data.reg_number_padding || 3,
        counter: data.reg_number_counter || 0,
        year_reset: data.reg_number_year_reset ?? true,
      };
      setConfig(c);
      setOriginal(c);
    }
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const isDirty = config.prefix !== original.prefix || config.padding !== original.padding || config.year_reset !== original.year_reset;

  const handleSave = async () => {
    if (!config.prefix.trim()) { setError('Please enter a prefix before saving.'); return; }
    if (!/^[A-Za-z0-9]+$/.test(config.prefix.trim())) { setError('Prefix can only contain letters and numbers.'); return; }
    setSaving(true); setError('');
    const { error: dbErr } = await supabase
      .from('schools')
      .update({
        reg_number_prefix: config.prefix.trim().toUpperCase(),
        reg_number_padding: config.padding,
        reg_number_year_reset: config.year_reset,
      })
      .eq('id', schoolId);
    if (dbErr) { setError(dbErr.message); }
    else {
      const saved: RegConfig = { ...config, prefix: config.prefix.trim().toUpperCase() };
      setConfig(saved);
      setOriginal(saved);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleResetCounter = async () => {
    setResetting(true);
    await supabase.from('schools').update({ reg_number_counter: 0 }).eq('id', schoolId);
    setConfig((c) => ({ ...c, counter: 0 }));
    setOriginal((o) => ({ ...o, counter: 0 }));
    setConfirmReset(false);
    setResetting(false);
  };

  const previews = buildPreview(config.prefix, config.padding, config.counter, 4);
  const isConfigured = !!original.prefix.trim();

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-10 justify-center text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
        <span className="text-sm">Loading configuration…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Status banner */}
      {isConfigured ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <i className="ri-checkbox-circle-fill text-emerald-600"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Registration numbers are active</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Students can log in using their registration number (e.g. <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono">{previews[0]}</code>) as their username.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <i className="ri-information-line text-amber-600"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Not configured yet</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Set a prefix below to enable automatic registration number generation for new students.
              Once configured, students without an email can log in using their registration number.
            </p>
          </div>
        </div>
      )}

      {/* Format configuration */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <i className="ri-settings-3-line text-gray-500"></i>
          Registration Number Format
        </h3>

        {/* Prefix */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            School Prefix <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <input
                type="text"
                value={config.prefix}
                onChange={(e) => setConfig((c) => ({ ...c, prefix: e.target.value.replace(/[^A-Za-z0-9]/g, '') }))}
                placeholder="e.g. GS, ELTS, REG"
                maxLength={8}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500 tracking-widest"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{config.prefix.length}/8</span>
            </div>
            <p className="text-xs text-gray-400 flex-1">Letters and numbers only. This will prefix every student registration number (e.g. <strong>GS</strong>001/2026).</p>
          </div>
        </div>

        {/* Padding */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Number Length</label>
          <div className="flex gap-2 flex-wrap">
            {PADDING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setConfig((c) => ({ ...c, padding: opt.value }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer whitespace-nowrap
                  ${config.padding === opt.value ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                <code className="font-mono">{opt.example}</code>
                <span className="text-xs text-gray-400">({opt.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Year reset */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">Reset counter each year</p>
            <p className="text-xs text-gray-400 mt-0.5">If on, numbering restarts from 001 when the year changes (recommended)</p>
          </div>
          <button
            onClick={() => setConfig((c) => ({ ...c, year_reset: !c.year_reset }))}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${config.year_reset ? 'bg-teal-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4.5 h-4.5 w-[18px] h-[18px] bg-white rounded-full absolute top-[3px] transition-all ${config.year_reset ? 'left-[22px]' : 'left-[3px]'}`}></div>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <i className="ri-error-warning-line shrink-0"></i> {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving…</> : saved ? <><i className="ri-checkbox-circle-line"></i>Saved!</> : <><i className="ri-save-line"></i>Save Format</>}
          </button>
          {isDirty && !saving && (
            <button
              onClick={() => { setConfig(original); setError(''); }}
              className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Live preview */}
      {config.prefix.trim() && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i className="ri-eye-line text-gray-500"></i>
            Preview — Next Registration Numbers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {previews.map((rn, i) => (
              <div key={i} className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-xl p-3 text-center">
                <div className="text-base font-mono font-bold text-teal-700 tracking-wide">{rn}</div>
                <div className="text-xs text-teal-500 mt-0.5">Student #{config.counter + i + 1}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 flex items-start gap-1.5">
            <i className="ri-information-line mt-0.5 shrink-0"></i>
            The first number after your current counter ({config.counter}). Students without an email will use their registration number to log in.
          </p>
        </div>
      )}

      {/* Counter management */}
      {isConfigured && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i className="ri-counter-line text-gray-500"></i>
            Counter Status
          </h3>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total students registered with this prefix</p>
              <div className="text-3xl font-bold text-gray-900 mt-1">{original.counter}</div>
              <p className="text-xs text-gray-400 mt-0.5">Last assigned: {original.counter === 0 ? 'None yet' : buildPreview(original.prefix, original.padding, original.counter - 1, 1)[0]}</p>
            </div>
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center">
              <i className="ri-graduation-cap-line text-3xl text-teal-600"></i>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Reset Counter to Zero</p>
                <p className="text-xs text-gray-400 mt-0.5">Only use this at the start of a new academic year. Cannot be undone.</p>
              </div>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 cursor-pointer whitespace-nowrap"
                >
                  Reset Counter
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setConfirmReset(false)} className="px-3 py-2 text-xs text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer whitespace-nowrap">Cancel</button>
                  <button
                    onClick={handleResetCounter}
                    disabled={resetting}
                    className="px-3 py-2 text-xs text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {resetting ? 'Resetting…' : 'Confirm Reset'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login instructions */}
      {isConfigured && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
            <i className="ri-login-box-line"></i>
            How Students Log In
          </h3>
          <div className="space-y-2.5">
            {[
              { step: '1', text: 'Go to the school login page and select Student' },
              { step: '2', text: `Enter their registration number as the username — e.g. ${previews[0] || `${original.prefix}001/${new Date().getFullYear()}`}` },
              { step: '3', text: 'Enter the temporary password given by the director (or their chosen password after first login)' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{item.step}</div>
                <p className="text-xs text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
