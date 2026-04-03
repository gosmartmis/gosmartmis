import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';

const TABLES = [
  'profiles', 'schools', 'students', 'classes', 'subjects',
  'teacher_assignments', 'timetables', 'marks', 'attendance',
  'fee_records', 'fee_payments', 'holiday_packages', 'messages',
  'report_cards', 'terms', 'academic_years', 'notifications',
];

interface RowData {
  [key: string]: unknown;
}

export default function DBInspector() {
  const [selectedTable, setSelectedTable] = useState('profiles');
  const [rows, setRows] = useState<RowData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  async function fetchTable(table: string, p = 0) {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1);
      if (err) throw err;
      setRows((data as RowData[]) ?? []);
      setColumns(data && data.length > 0 ? Object.keys(data[0]) : []);
      setRowCount(count ?? 0);
      setPage(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Query failed');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function handleTableSelect(table: string) {
    setSelectedTable(table);
    setPage(0);
    fetchTable(table, 0);
  }

  function formatCell(val: unknown): string {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'object') return JSON.stringify(val).slice(0, 60) + (JSON.stringify(val).length > 60 ? '…' : '');
    const s = String(val);
    return s.length > 50 ? s.slice(0, 50) + '…' : s;
  }

  const totalPages = rowCount ? Math.ceil(rowCount / PAGE_SIZE) : 0;

  return (
    <div className="flex gap-4 h-[520px]">
      {/* Table list */}
      <div className="w-44 flex-shrink-0 bg-slate-900 rounded-xl overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          Tables ({TABLES.length})
        </div>
        {TABLES.map(t => (
          <button
            key={t}
            onClick={() => handleTableSelect(t)}
            className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors cursor-pointer ${
              selectedTable === t ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <i className="ri-table-line mr-1.5 opacity-60" />{t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 font-mono">{selectedTable}</span>
            {rowCount !== null && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{rowCount} rows</span>
            )}
          </div>
          <button
            onClick={() => fetchTable(selectedTable, page)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>

        {error && (
          <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <i className="ri-error-warning-line" />{error}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white">
          {rows.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <i className="ri-table-line text-4xl" />
              <p className="text-sm">Click "Load" to inspect this table</p>
            </div>
          ) : (
            <table className="w-full text-xs font-mono min-w-max">
              <thead className="bg-slate-900 text-slate-300 sticky top-0">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-slate-800 last:border-r-0">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-gray-50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-gray-100 last:border-r-0 max-w-[180px] truncate" title={String(row[col] ?? '')}>
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => fetchTable(selectedTable, page - 1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => fetchTable(selectedTable, page + 1)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
