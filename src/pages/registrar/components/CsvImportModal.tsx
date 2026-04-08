import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, getAuthToken } from '../../../lib/supabase';

type ImportTab = 'students' | 'teachers';

interface ParsedRow { [key: string]: string }

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; name: string; reason: string }[];
}

interface StudentCredential {
  row: number;
  full_name: string;
  class_name: string;
  login_credential: string;
  temp_password: string;
}

interface Props {
  schoolId: string;
  schoolName?: string;
  schoolSlug?: string;
  onClose: () => void;
  onImported?: () => void;
  defaultTab?: ImportTab;
}

// ── CSV parser (handles quoted fields) ────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ''; });
    rows.push(row);
  }
  return { headers, rows };
}

// ── Template definitions ───────────────────────────────────────────────────────
const STUDENT_TEMPLATE_HEADERS = 'firstname,lastname,sex,class,parent_name,parent_phone,parent_email,date_of_birth,address';
const STUDENT_TEMPLATE_EXAMPLE = 'Alice,Nkusi,Female,S1A,Grace Nkusi,+250788123456,grace@mail.com,2010-03-15,Kigali Rwanda\nBob,Mugisha,Male,S2B,Paul Mugisha,+250788654321,,2009-11-22,Kigali Rwanda';

const TEACHER_TEMPLATE_HEADERS = 'full_name,email,phone';
const TEACHER_TEMPLATE_EXAMPLE = 'Dr. Marie Uwimana,marie@school.rw,+250788111222\nMr. Jean Habimana,jean@school.rw,+250788333444';

function downloadTemplate(type: ImportTab) {
  const [headers, example] = type === 'students'
    ? [STUDENT_TEMPLATE_HEADERS, STUDENT_TEMPLATE_EXAMPLE]
    : [TEACHER_TEMPLATE_HEADERS, TEACHER_TEMPLATE_EXAMPLE];
  const blob = new Blob([`${headers}\n${example}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${type}_import_template.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function CsvImportModal({ schoolId, schoolName = 'School', schoolSlug = '', onClose, onImported, defaultTab = 'students' }: Props) {
  const [tab, setTab] = useState<ImportTab>(defaultTab);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [credentialRows, setCredentialRows] = useState<StudentCredential[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch classes for student import class_name → id mapping
    supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')
      .then(({ data }) => setClasses(data || []));
  }, [schoolId]);

  // Reset when tab changes
  useEffect(() => {
    setFile(null); setRows([]); setHeaders([]); setParseError(''); setResult(null); setProgress(0); setCredentialRows([]);
  }, [tab]);

  const normalizeGender = (value?: string) => {
    const v = (value || '').trim().toLowerCase();
    if (['m', 'male', 'boy'].includes(v)) return 'Male';
    if (['f', 'female', 'girl'].includes(v)) return 'Female';
    return '';
  };

  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return { firstName: parts[0] || 'Student', lastName: '' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  };

  const downloadCredentials = () => {
    if (!credentialRows.length) return;
    const header = 'row,full_name,class_name,login_credential,temp_password';
    const lines = credentialRows.map((c) =>
      [c.row, c.full_name, c.class_name, c.login_credential, c.temp_password]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([`${header}\n${lines.join('\n')}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_credentials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) { setParseError('Please upload a .csv file.'); return; }
    setParseError(''); setResult(null); setProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      if (h.length === 0) { setParseError('Could not parse CSV — check the file format.'); return; }
      setFile(f); setHeaders(h); setRows(r);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  // ── Import students ────────────────────────────────────────────────────────
  const importStudents = async () => {
    const errors: ImportResult['errors'] = [];
    let success = 0;
    const classMap = new Map(classes.map((c) => [c.name.toLowerCase(), c.id]));
    const classNameById = new Map(classes.map((c) => [c.id, c.name]));
    const token = await getAuthToken();
    const generatedCredentials: StudentCredential[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstNameRaw = row['firstname'] || row['first_name'] || '';
      const lastNameRaw = row['lastname'] || row['last_name'] || '';
      const rawFullName = row['full_name'] || row['name'] || '';
      const fallbackSplit = splitFullName(rawFullName);
      const firstName = (firstNameRaw || fallbackSplit.firstName).trim();
      const lastName = (lastNameRaw || fallbackSplit.lastName).trim();
      const fullName = `${firstName} ${lastName}`.trim();
      if (!firstName || !fullName) {
        errors.push({ row: i + 2, name: '—', reason: 'firstname/lastname (or full_name) is required' });
        continue;
      }

      const gender = normalizeGender(row['sex'] || row['gender']);
      if (!gender) {
        errors.push({ row: i + 2, name: fullName, reason: 'sex/gender is required (Male/Female)' });
        continue;
      }

      const className = (row['class_name'] || row['class'] || '').toLowerCase();
      const classId = classMap.get(className) || null;
      const classDisplayName = classId ? (classNameById.get(classId) || row['class'] || row['class_name'] || 'Unassigned') : (row['class'] || row['class_name'] || 'Unassigned');

      const { data: insertedStudent, error } = await supabase.from('students').insert({
        school_id: schoolId,
        full_name: fullName,
        date_of_birth: row['date_of_birth'] || null,
        gender,
        class_id: classId,
        parent_name: row['parent_name'] || row['guardian_name'] || null,
        parent_phone: row['parent_phone'] || row['guardian_phone'] || null,
        parent_email: row['parent_email'] || row['guardian_email'] || null,
        address: row['address'] || null,
        enrollment_date: row['enrollment_date'] || new Date().toISOString().split('T')[0],
        status: 'active',
      }).select('id').maybeSingle();

      if (error || !insertedStudent?.id) {
        errors.push({ row: i + 2, name: fullName, reason: error?.message || 'Failed to create student record' });
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }

      const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-school-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'create',
          school_id: schoolId,
          school_name: schoolName,
          school_slug: schoolSlug,
          director_name: fullName,
          target_role: 'student',
        }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        errors.push({ row: i + 2, name: fullName, reason: `Student created, but account creation failed: ${json.error || 'Unknown error'}` });
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        continue;
      }

      if (json.user_id) {
        await supabase
          .from('students')
          .update({ profile_id: json.user_id })
          .eq('id', insertedStudent.id)
          .eq('school_id', schoolId);
      }

      generatedCredentials.push({
        row: i + 2,
        full_name: fullName,
        class_name: classDisplayName,
        login_credential: json.login_credential || json.registration_number || '',
        temp_password: json.temp_password || '',
      });
      success++;
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    setCredentialRows(generatedCredentials);
    return { total: rows.length, success, failed: errors.length, errors };
  };

  // ── Import teachers ────────────────────────────────────────────────────────
  const importTeachers = async () => {
    const token = await getAuthToken();
    const teachers = rows
      .filter((r) => r['email'] && r['full_name'])
      .map((r) => ({ full_name: r['full_name']?.trim(), email: r['email']?.trim().toLowerCase(), phone: r['phone']?.trim() || null }));

    const invalidRows = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r['email'] || !r['full_name'])
      .map(({ r, i }) => ({ row: i + 2, name: r['full_name'] || '—', reason: 'full_name and email are required' }));

    setProgress(30);
    const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/bulk-import-teachers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ school_id: schoolId, teachers }),
    });
    setProgress(90);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Import failed');

    const fnErrors: ImportResult['errors'] = (json.results || [])
      .filter((r: any) => r.status === 'error')
      .map((r: any, i: number) => ({ row: i + 2, name: r.email, reason: r.error || 'Unknown error' }));

    return {
      total: rows.length,
      success: json.created + json.existed,
      failed: json.failed + invalidRows.length,
      errors: [...invalidRows, ...fnErrors],
    };
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true); setProgress(0); setResult(null);
    try {
      const res = tab === 'students' ? await importStudents() : await importTeachers();
      setProgress(100);
      setResult(res);
      if (res.success > 0) onImported?.();
    } catch (err: any) {
      setResult({ total: rows.length, success: 0, failed: rows.length, errors: [{ row: 0, name: 'All rows', reason: err.message }] });
    } finally {
      setImporting(false);
    }
  };

  const requiredCols = tab === 'students' ? ['firstname/lastname + sex + class (or full_name + gender + class_name)'] : ['full_name', 'email'];
  const missingCols = requiredCols.filter((c) => !headers.includes(c));
  const studentHeaderValid = headers.includes('full_name') || headers.includes('name') || (headers.includes('firstname') && headers.includes('lastname')) || (headers.includes('first_name') && headers.includes('last_name'));
  const studentGenderValid = headers.includes('gender') || headers.includes('sex');
  const studentClassValid = headers.includes('class') || headers.includes('class_name');
  const studentsCanImport = rows.length > 0 && studentHeaderValid && studentGenderValid && studentClassValid && !importing && !result;
  const teachersCanImport = rows.length > 0 && headers.includes('full_name') && headers.includes('email') && !importing && !result;
  const canImport = tab === 'students' ? studentsCanImport : teachersCanImport;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <i className="ri-file-upload-line text-teal-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bulk CSV Import</h2>
              <p className="text-xs text-gray-500">Import multiple records at once from a spreadsheet</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(['students', 'teachers'] as ImportTab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${tab === t ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className={t === 'students' ? 'ri-graduation-cap-line' : 'ri-user-star-line'}></i>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Template download */}
          <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-100 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-teal-800">Step 1 — Download the template</p>
              <p className="text-xs text-teal-600 mt-0.5">
                {tab === 'students'
                  ? 'Required: firstname, lastname, sex, class (or full_name, gender, class_name) — credentials are auto-generated'
                  : 'Required: full_name, email — Optional: phone'}
              </p>
            </div>
            <button onClick={() => downloadTemplate(tab)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-download-line"></i>
              Download Template
            </button>
          </div>

          {/* File upload */}
          {!result && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Step 2 — Upload your CSV</p>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-teal-400 bg-teal-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'}`}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <i className="ri-file-text-line text-4xl text-emerald-500"></i>
                    <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                    <p className="text-xs text-emerald-600">{rows.length} rows detected — click to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <i className="ri-upload-cloud-2-line text-4xl text-gray-300"></i>
                    <p className="text-sm font-semibold text-gray-600">Drop your CSV here or click to browse</p>
                    <p className="text-xs text-gray-400">.csv files only</p>
                  </div>
                )}
              </div>
              {parseError && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><i className="ri-error-warning-line"></i>{parseError}</p>}
              {!canImport && file && tab === 'students' && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <i className="ri-alert-line"></i>
                  Ensure CSV includes name, sex/gender, and class columns.
                </p>
              )}
              {!canImport && file && tab === 'teachers' && missingCols.length > 0 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <i className="ri-alert-line"></i>
                  Missing required columns: <strong>{missingCols.join(', ')}</strong>
                </p>
              )}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !result && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Step 3 — Preview <span className="text-gray-400 font-normal">({rows.length} rows)</span>
              </p>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500 w-8">#</th>
                        {headers.map((h) => (
                          <th key={h} className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${requiredCols.includes(h) ? 'text-teal-700' : 'text-gray-500'}`}>
                            {h} {requiredCols.includes(h) && <span className="text-red-400">*</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.slice(0, 8).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{i + 2}</td>
                          {headers.map((h) => (
                            <td key={h} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{row[h] || <span className="text-gray-300">—</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 8 && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                    + {rows.length - 8} more rows not shown
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Importing…</span>
                <span className="text-gray-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                  <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Rows</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-700">{result.success}</p>
                  <p className="text-xs text-emerald-600 mt-1">Imported</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${result.failed > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-2xl font-bold ${result.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>{result.failed}</p>
                  <p className={`text-xs mt-1 ${result.failed > 0 ? 'text-red-500' : 'text-gray-400'}`}>Failed</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Failed Rows</p>
                  <div className="border border-red-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5 border-b last:border-0 border-red-50 bg-red-50/50">
                        <span className="text-xs text-red-400 font-mono w-12 shrink-0">Row {e.row}</span>
                        <span className="text-xs font-medium text-red-700 w-28 shrink-0 truncate">{e.name}</span>
                        <span className="text-xs text-red-600 flex-1">{e.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.success > 0 && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <i className="ri-checkbox-circle-fill text-emerald-600 text-base"></i>
                  <p className="text-sm text-emerald-700 font-medium">
                    {result.success} {tab} imported successfully!
                    {tab === 'teachers' && ' Login accounts have been created — temp passwords are auto-generated.'}
                  </p>
                </div>
              )}

              {tab === 'students' && credentialRows.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 bg-teal-50 border border-teal-100 rounded-xl">
                  <p className="text-sm text-teal-700 font-medium">
                    Credentials generated for {credentialRows.length} students.
                  </p>
                  <button
                    onClick={downloadCredentials}
                    className="px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-download-line mr-1"></i>
                    Download Credentials CSV
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            {rows.length > 0 && !result ? `${rows.length} rows ready to import` : result ? 'Import complete' : 'No file selected'}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              {result ? 'Close' : 'Cancel'}
            </button>
            {result ? (
              <button onClick={() => { setResult(null); setFile(null); setRows([]); setHeaders([]); setCredentialRows([]); }}
                className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                <i className="ri-refresh-line"></i>Import More
              </button>
            ) : (
              <button onClick={handleImport} disabled={!canImport}
                className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center gap-2">
                {importing ? <><i className="ri-loader-4-line animate-spin"></i>Importing…</> : <><i className="ri-upload-line"></i>Import {rows.length > 0 ? `${rows.length} Records` : ''}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}