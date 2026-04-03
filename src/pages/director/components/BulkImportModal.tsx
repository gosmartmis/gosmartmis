import { useState, useRef, useCallback, DragEvent } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';

interface ImportRow {
  row: number;
  full_name: string;
  email: string;
  phone: string;
  _valid: boolean;
  _errors: string[];
}

interface ImportResult {
  row: number;
  full_name: string;
  email: string;
  status: 'created' | 'exists' | 'error';
  error?: string;
  temp_password?: string;
}

interface Props {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'setup' | 'upload' | 'preview' | 'results';
type ImportRole = 'teacher' | 'student' | 'dean' | 'registrar' | 'accountant';

const ROLE_OPTS: { value: ImportRole; label: string; icon: string; desc: string; color: string }[] = [
  { value: 'student',    label: 'Students',    icon: 'ri-graduation-cap-line',         desc: 'Bulk enroll students',               color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'teacher',    label: 'Teachers',    icon: 'ri-booklet-line',                desc: 'Add teaching staff',                 color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { value: 'dean',       label: 'Deans',       icon: 'ri-user-star-line',              desc: 'Add academic heads',                 color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'registrar',  label: 'Registrars',  icon: 'ri-file-list-line',              desc: 'Add registry staff',                 color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { value: 'accountant', label: 'Accountants', icon: 'ri-money-dollar-circle-line',    desc: 'Add finance staff',                  color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

function parseCSV(raw: string): { headers: string[]; rows: string[][] } {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseRow);
  return { headers, rows };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function BulkImportModal({ schoolId, schoolName, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('setup');
  const [role, setRole] = useState<ImportRole>('student');
  const [dragActive, setDragActive] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [previewRows, setPreviewRows] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [copiedPw, setCopiedPw] = useState<string | null>(null);
  const [showResultDetail, setShowResultDetail] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRole = ROLE_OPTS.find((r) => r.value === role)!;

  const downloadTemplate = () => {
    const csv = 'full_name,email,phone\nJohn Doe,john.doe@school.com,+250788000001\nJane Smith,jane.smith@school.com,+250788000002\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${role}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processCSV = useCallback((raw: string) => {
    setParseError('');
    const { headers, rows } = parseCSV(raw);

    if (!headers.includes('full_name') || !headers.includes('email')) {
      setParseError('CSV must have at least "full_name" and "email" columns.');
      setPreviewRows([]);
      return;
    }

    if (rows.length === 0) {
      setParseError('No data rows found in the CSV.');
      setPreviewRows([]);
      return;
    }

    if (rows.length > 300) {
      setParseError('Maximum 300 rows per import. Please split into smaller files.');
      setPreviewRows([]);
      return;
    }

    const nameIdx = headers.indexOf('full_name');
    const emailIdx = headers.indexOf('email');
    const phoneIdx = headers.indexOf('phone');

    const parsed: ImportRow[] = rows.map((cols, i) => {
      const full_name = cols[nameIdx] || '';
      const email = cols[emailIdx] || '';
      const phone = phoneIdx >= 0 ? (cols[phoneIdx] || '') : '';
      const errors: string[] = [];
      if (!full_name.trim()) errors.push('Name required');
      if (!email.trim()) errors.push('Email required');
      else if (!validateEmail(email.trim())) errors.push('Invalid email');
      return { row: i + 1, full_name, email, phone, _valid: errors.length === 0, _errors: errors };
    });

    setPreviewRows(parsed);
    setStep('preview');
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'text/plain') {
      setParseError('Please upload a .csv file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      processCSV(text);
    };
    reader.readAsText(file);
  }, [processCSV]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handlePasteProcess = () => {
    if (csvText.trim()) processCSV(csvText);
  };

  const validRows = previewRows.filter((r) => r._valid);
  const invalidRows = previewRows.filter((r) => !r._valid);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setImportProgress(0);

    const CHUNK = 50;
    const allResults: ImportResult[] = [];

    let token: string;
    try {
      token = await getAuthToken();
    } catch {
      setImporting(false);
      return;
    }

    const totalChunks = Math.ceil(validRows.length / CHUNK);

    for (let ci = 0; ci < totalChunks; ci++) {
      const chunk = validRows.slice(ci * CHUNK, (ci + 1) * CHUNK);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/bulk-import-teachers`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              school_id: schoolId,
              role,
              users: chunk.map((r) => ({ full_name: r.full_name, email: r.email, phone: r.phone })),
            }),
          }
        );
        const json = await res.json();
        if (json.results) allResults.push(...json.results);
      } catch (_) {
        chunk.forEach((r, i) => allResults.push({ row: ci * CHUNK + i + 1, full_name: r.full_name, email: r.email, status: 'error', error: 'Network error' }));
      }
      setImportProgress(Math.round(((ci + 1) / totalChunks) * 100));
    }

    setResults(allResults);
    setImporting(false);
    setStep('results');
    onImported();
  };

  const downloadResults = () => {
    const lines = ['row,full_name,email,status,temp_password,error'];
    results.forEach((r) => {
      lines.push(`${r.row},"${r.full_name}","${r.email}",${r.status},"${r.temp_password || ''}","${r.error || ''}"`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_results_${role}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPw = (pw: string, key: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedPw(key);
    setTimeout(() => setCopiedPw(null), 2000);
  };

  const createdCount = results.filter((r) => r.status === 'created').length;
  const existedCount = results.filter((r) => r.status === 'exists').length;
  const failedCount = results.filter((r) => r.status === 'error').length;

  const STEP_LABELS: Record<Step, string> = { setup: 'Choose Role', upload: 'Upload CSV', preview: 'Preview & Validate', results: 'Import Results' };
  const STEP_ORDER: Step[] = ['setup', 'upload', 'preview', 'results'];
  const currentStepIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <i className="ri-file-upload-line text-teal-600 text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Bulk Import Accounts</h2>
              <p className="text-xs text-gray-400">{schoolName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-1">
            {STEP_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 ${i <= currentStepIdx ? 'text-teal-600' : 'text-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${i < currentStepIdx ? 'bg-teal-600 text-white' : i === currentStepIdx ? 'bg-teal-100 text-teal-700 border-2 border-teal-500' : 'bg-gray-100 text-gray-400'}`}>
                    {i < currentStepIdx ? <i className="ri-check-line text-xs"></i> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{STEP_LABELS[s]}</span>
                </div>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${i < currentStepIdx ? 'bg-teal-400' : 'bg-gray-100'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── STEP 1: SETUP ── */}
          {step === 'setup' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">What type of accounts are you importing?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLE_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer
                        ${role === opt.value ? `border-current ${opt.color}` : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${role === opt.value ? opt.color : 'bg-gray-100 text-gray-500'}`}>
                        <i className={`${opt.icon} text-base`}></i>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                        <div className="text-xs text-gray-400">{opt.desc}</div>
                      </div>
                      {role === opt.value && <i className="ri-checkbox-circle-fill ml-auto text-base text-current"></i>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="ri-file-text-line text-gray-500"></i>
                  CSV Format
                </h4>
                <p className="text-xs text-gray-500">Your CSV file must have these columns (in any order):</p>
                <div className="flex flex-wrap gap-2">
                  {['full_name *', 'email *', 'phone'].map((col) => (
                    <code key={col} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-700">{col}</code>
                  ))}
                </div>
                <p className="text-xs text-gray-400">* Required &nbsp;·&nbsp; Max 300 rows per import</p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:underline cursor-pointer"
                >
                  <i className="ri-download-line"></i>
                  Download {selectedRole.label} template CSV
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <i className="ri-shield-check-line text-amber-600 shrink-0 mt-0.5"></i>
                <p className="text-xs text-amber-700">Every bulk import is logged in the Activity Log for full accountability and fraud prevention.</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: UPLOAD ── */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all
                  ${dragActive ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'}`}
              >
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center">
                  <i className="ri-upload-cloud-line text-3xl text-teal-500"></i>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">Drop your CSV file here</p>
                  <p className="text-xs text-gray-400 mt-0.5">or click to browse</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <i className="ri-file-text-2-line"></i>
                  .csv files · max 300 rows
                </div>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400 font-medium">OR PASTE CSV TEXT</span></div>
              </div>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={'full_name,email,phone\nJohn Doe,john@school.com,+250788000001\n...'}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none placeholder:font-sans placeholder:text-gray-400"
              />
              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <i className="ri-error-warning-line shrink-0 mt-0.5"></i>
                  {parseError}
                </div>
              )}
              {csvText.trim() && (
                <button
                  onClick={handlePasteProcess}
                  className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Parse & Preview CSV
                </button>
              )}
            </div>
          )}

          {/* ── STEP 3: PREVIEW ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    <i className="ri-checkbox-circle-fill"></i> {validRows.length} valid
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold">
                      <i className="ri-error-warning-fill"></i> {invalidRows.length} invalid (will be skipped)
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setStep('upload'); setParseError(''); }}
                  className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1 cursor-pointer"
                >
                  <i className="ri-upload-line"></i> Re-upload
                </button>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <i className="ri-error-warning-line shrink-0 mt-0.5"></i> {parseError}
                </div>
              )}

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100">
                  <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Full Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Phone</div>
                    <div className="col-span-1 text-right">OK</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {previewRows.map((r) => (
                    <div key={r.row} className={`grid grid-cols-12 px-4 py-2.5 text-xs gap-1 ${r._valid ? '' : 'bg-red-50/50'}`}>
                      <div className="col-span-1 text-gray-400">{r.row}</div>
                      <div className="col-span-4 font-medium text-gray-800 truncate">{r.full_name || <span className="text-red-400 italic">missing</span>}</div>
                      <div className="col-span-4 text-gray-600 truncate">{r.email || <span className="text-red-400 italic">missing</span>}</div>
                      <div className="col-span-2 text-gray-400 truncate">{r.phone || '—'}</div>
                      <div className="col-span-1 flex justify-end items-center">
                        {r._valid
                          ? <i className="ri-checkbox-circle-fill text-emerald-500"></i>
                          : <span title={r._errors.join(', ')} className="cursor-help"><i className="ri-error-warning-fill text-red-400"></i></span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {validRows.length === 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                  <i className="ri-error-warning-line shrink-0 mt-0.5"></i>
                  No valid rows to import. Please fix your CSV and re-upload.
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: RESULTS ── */}
          {step === 'results' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-700">{createdCount}</div>
                  <div className="text-xs text-emerald-600 font-medium mt-0.5">Created</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{existedCount}</div>
                  <div className="text-xs text-amber-600 font-medium mt-0.5">Already Existed</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-xs text-red-500 font-medium mt-0.5">Failed</div>
                </div>
              </div>

              {createdCount > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2">
                  <i className="ri-information-line text-teal-600 shrink-0"></i>
                  <p className="text-xs text-teal-700">
                    <strong>{createdCount} accounts created</strong> with temporary passwords.
                    Download the results CSV to get all credentials in one file.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Import Details</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResultDetail((v) => !v)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
                  >
                    <i className={`ri-${showResultDetail ? 'eye-off' : 'eye'}-line`}></i>
                    {showResultDetail ? 'Hide' : 'Show'} details
                  </button>
                  <button
                    onClick={downloadResults}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-download-line"></i> Download CSV
                  </button>
                </div>
              </div>

              {showResultDetail && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-100 grid grid-cols-12 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Password</div>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                    {results.map((r, i) => (
                      <div key={i} className={`grid grid-cols-12 px-4 py-2.5 text-xs gap-1 items-center ${r.status === 'error' ? 'bg-red-50/30' : r.status === 'exists' ? 'bg-amber-50/30' : ''}`}>
                        <div className="col-span-4 font-medium text-gray-800 truncate">{r.full_name}</div>
                        <div className="col-span-4 text-gray-500 truncate">{r.email}</div>
                        <div className="col-span-2">
                          {r.status === 'created' && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Created</span>}
                          {r.status === 'exists' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Existed</span>}
                          {r.status === 'error' && <span title={r.error} className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold cursor-help">Error</span>}
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {r.temp_password && (
                            <button
                              onClick={() => copyPw(r.temp_password!, `pw_${i}`)}
                              className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs cursor-pointer hover:bg-amber-100 whitespace-nowrap"
                            >
                              <i className="ri-clipboard-line text-xs"></i>
                              {copiedPw === `pw_${i}` ? 'Copied!' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          {step === 'setup' && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors whitespace-nowrap">Cancel</button>
              <button
                onClick={() => setStep('upload')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                Continue <i className="ri-arrow-right-line"></i>
              </button>
            </>
          )}

          {step === 'upload' && (
            <button onClick={() => setStep('setup')} className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors whitespace-nowrap">
              <i className="ri-arrow-left-line mr-1"></i>Back
            </button>
          )}

          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')} className="py-2.5 px-5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors whitespace-nowrap">
                <i className="ri-arrow-left-line mr-1"></i>Back
              </button>
              <button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Importing… {importProgress}%
                  </>
                ) : (
                  <><i className="ri-upload-cloud-line"></i>Import {validRows.length} {selectedRole.label}</>
                )}
              </button>
            </>
          )}

          {step === 'results' && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors whitespace-nowrap">Close</button>
              <button
                onClick={() => { setStep('setup'); setPreviewRows([]); setResults([]); setCsvText(''); setParseError(''); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-semibold cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line"></i>Import More
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
