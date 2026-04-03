import { useState, useMemo } from 'react';
import { usePayroll, PayrollRecord, StaffSalary } from '../../../hooks/usePayroll';
import { useAuth } from '../../../hooks/useAuth';

const MONTHS = [
  { label: 'March 2026', value: '2026-03' },
  { label: 'February 2026', value: '2026-02' },
  { label: 'January 2026', value: '2026-01' },
  { label: 'December 2025', value: '2025-12' },
  { label: 'November 2025', value: '2025-11' },
  { label: 'October 2025', value: '2025-10' },
  { label: 'September 2025', value: '2025-09' },
  { label: 'August 2025', value: '2025-08' },
  { label: 'July 2025', value: '2025-07' },
  { label: 'June 2025', value: '2025-06' },
  { label: 'May 2025', value: '2025-05' },
  { label: 'April 2025', value: '2025-04' },
  { label: 'March 2025', value: '2025-03' },
  { label: 'February 2025', value: '2025-02' },
  { label: 'January 2025', value: '2025-01' },
  { label: 'December 2024', value: '2024-12' },
];

function monthLabel(val: string) {
  return MONTHS.find(m => m.value === val)?.label ?? val;
}

interface AddStaffForm {
  staff_name: string;
  role: string;
  base_salary: string;
  allowances: string;
  deductions: string;
}

interface EditSalaryForm {
  base_salary: string;
  allowances: string;
  deductions: string;
}

const DEFAULT_FORM: AddStaffForm = { staff_name: '', role: '', base_salary: '', allowances: '', deductions: '' };
const DEFAULT_EDIT_FORM: EditSalaryForm = { base_salary: '', allowances: '', deductions: '' };

export default function Payroll() {
  const { profile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('2025-01');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [addForm, setAddForm] = useState<AddStaffForm>(DEFAULT_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [editSalaryRecord, setEditSalaryRecord] = useState<PayrollRecord | null>(null);
  const [editSalaryForm, setEditSalaryForm] = useState<EditSalaryForm>(DEFAULT_EDIT_FORM);
  const [editSalaryLoading, setEditSalaryLoading] = useState(false);

  const {
    payrollRecords,
    staffSalaries,
    loading,
    processing,
    toast,
    summary,
    generatePayroll,
    markAsPaid,
    markAllPending,
    addStaffMember,
    updateStaffSalary,
  } = usePayroll(selectedPeriod);

  const filtered = useMemo(() => payrollRecords.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = searchTerm.toLowerCase();
    const matchSearch = r.staff_name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  }), [payrollRecords, filterStatus, searchTerm]);

  const hasRecords = payrollRecords.length > 0;
  const allPaid = summary.paidCount === summary.totalStaff && summary.totalStaff > 0;

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setShowPayslipModal(true);
  };

  const handleConfirmProcess = async () => {
    await markAllPending();
    setShowProcessModal(false);
  };

  const handleEditSalaryOpen = (record: PayrollRecord) => {
    const staffSalary: StaffSalary | undefined = staffSalaries.find(
      (s: StaffSalary) => s.id === record.staff_salary_id
    );
    const source = staffSalary ?? record;
    setEditSalaryForm({
      base_salary: String(source.base_salary),
      allowances: String(source.allowances),
      deductions: String(source.deductions),
    });
    setEditSalaryRecord(record);
  };

  const handleEditSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSalaryRecord?.staff_salary_id) return;
    setEditSalaryLoading(true);
    const ok = await updateStaffSalary(editSalaryRecord.staff_salary_id, {
      base_salary: Number(editSalaryForm.base_salary),
      allowances: Number(editSalaryForm.allowances),
      deductions: Number(editSalaryForm.deductions),
    });
    setEditSalaryLoading(false);
    if (ok) {
      setEditSalaryRecord(null);
      setEditSalaryForm(DEFAULT_EDIT_FORM);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    const ok = await addStaffMember({
      staff_name: addForm.staff_name,
      role: addForm.role,
      base_salary: Number(addForm.base_salary),
      allowances: Number(addForm.allowances),
      deductions: Number(addForm.deductions),
    });
    setAddLoading(false);
    if (ok) { setAddForm(DEFAULT_FORM); setShowAddModal(false); }
  };

  const schoolName = (profile as { school_name?: string })?.school_name ?? 'GoSmart Academy';

  return (
    <div className="p-6 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
        }`}>
          <i className={`${toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} mr-2`}></i>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Payroll Management</h1>
          <p className="text-slate-500 text-sm">Process monthly payroll and generate payslips</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-user-add-line mr-2"></i>Add Staff
          </button>
          {!hasRecords ? (
            <button
              onClick={generatePayroll}
              disabled={processing}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <i className="ri-file-list-3-line mr-2"></i>
              {processing ? 'Generating…' : 'Generate Payroll'}
            </button>
          ) : !allPaid && (
            <button
              onClick={() => setShowProcessModal(true)}
              disabled={processing}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <i className="ri-play-circle-line mr-2"></i>Process Payroll
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Total Staff</span>
            <div className="w-8 h-8 flex items-center justify-center">
              <i className="ri-team-line text-xl text-teal-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.totalStaff}</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Total Payroll</span>
            <div className="w-8 h-8 flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-xl text-emerald-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.totalNetPay.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">RWF</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Paid</span>
            <div className="w-8 h-8 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-xl text-teal-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.paidCount}</p>
        </div>
        <div className="bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm">Pending</span>
            <div className="w-8 h-8 flex items-center justify-center">
              <i className="ri-time-line text-xl text-amber-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800">{summary.pendingCount + summary.processingCount}</p>
        </div>
      </div>

      {/* Payroll Summary Banner */}
      {hasRecords && (
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg p-6 mb-6 text-white">
          <h3 className="text-base font-semibold mb-4">Payroll Summary — {monthLabel(selectedPeriod)}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-teal-100 text-xs mb-1">Base Salary</p>
              <p className="text-xl font-bold">{summary.totalBaseSalary.toLocaleString()} <span className="text-sm font-normal">RWF</span></p>
            </div>
            <div>
              <p className="text-teal-100 text-xs mb-1">Allowances</p>
              <p className="text-xl font-bold">+{summary.totalAllowances.toLocaleString()} <span className="text-sm font-normal">RWF</span></p>
            </div>
            <div>
              <p className="text-teal-100 text-xs mb-1">Deductions</p>
              <p className="text-xl font-bold">−{summary.totalDeductions.toLocaleString()} <span className="text-sm font-normal">RWF</span></p>
            </div>
            <div>
              <p className="text-teal-100 text-xs mb-1">Net Payroll</p>
              <p className="text-xl font-bold">{summary.totalNetPay.toLocaleString()} <span className="text-sm font-normal">RWF</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              placeholder="Search staff…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Processing">Processing</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <i className="ri-loader-4-line text-3xl animate-spin mb-3 block"></i>
            <p className="text-sm">Loading payroll records…</p>
          </div>
        ) : !hasRecords ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-slate-50 rounded-full">
              <i className="ri-file-list-3-line text-3xl text-slate-300"></i>
            </div>
            <p className="text-slate-600 font-medium mb-1">No payroll records for {monthLabel(selectedPeriod)}</p>
            <p className="text-slate-400 text-sm mb-4">Click &quot;Generate Payroll&quot; to create records from the staff salary roster.</p>
            <button
              onClick={generatePayroll}
              disabled={processing}
              className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              <i className="ri-file-list-3-line mr-2"></i>
              {processing ? 'Generating…' : 'Generate Payroll'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Staff Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Role</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Base Salary</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Allowances</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Deductions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Net Pay</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{r.staff_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{r.role}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 text-right">{r.base_salary.toLocaleString()} RWF</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 text-right">+{r.allowances.toLocaleString()} RWF</td>
                    <td className="px-4 py-3 text-sm text-red-500 text-right">−{r.deductions.toLocaleString()} RWF</td>
                    <td className="px-4 py-3 text-sm text-slate-800 text-right font-semibold">{r.net_pay.toLocaleString()} RWF</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        r.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'Processing' ? 'bg-sky-100 text-sky-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status === 'Paid' && r.payment_date ? `Paid ${r.payment_date}` : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewPayslip(r)}
                          className="px-2.5 py-1 text-teal-600 hover:bg-teal-50 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <i className="ri-file-text-line mr-1"></i>Payslip
                        </button>
                        {r.staff_salary_id && (
                          <button
                            onClick={() => handleEditSalaryOpen(r)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-pencil-line mr-1"></i>Edit Salary
                          </button>
                        )}
                        {r.status !== 'Paid' && (
                          <button
                            onClick={() => markAsPaid(r.id)}
                            className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-checkbox-circle-line mr-1"></i>Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No records match your filters.</div>
            )}
          </div>
        )}
      </div>

      {/* Payslip Modal */}
      {showPayslipModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Payslip — {monthLabel(selectedPeriod)}</h3>
              <button onClick={() => setShowPayslipModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6 pb-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-1">{schoolName}</h2>
                <p className="text-sm text-slate-500">KG 123 St, Kigali, Rwanda</p>
                <p className="text-sm text-slate-500">Tel: +250 788 123 456</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  ['Employee Name', selectedRecord.staff_name],
                  ['Position', selectedRecord.role],
                  ['Employee ID', `EMP-${selectedRecord.id.slice(-6).toUpperCase()}`],
                  ['Pay Period', monthLabel(selectedPeriod)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-800">{val}</p>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">Earnings</h4>
                <div className="space-y-2">
                  {[
                    ['Base Salary', selectedRecord.base_salary],
                    ['Transport Allowance', Math.round(selectedRecord.allowances * 0.6)],
                    ['Housing Allowance', Math.round(selectedRecord.allowances * 0.4)],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-800">{Number(val).toLocaleString()} RWF</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">Total Earnings</span>
                    <span className="font-semibold text-slate-800">{(selectedRecord.base_salary + selectedRecord.allowances).toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h4 className="font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">Deductions</h4>
                <div className="space-y-2">
                  {[
                    ['PAYE (Income Tax)', Math.round(selectedRecord.deductions * 0.65)],
                    ['RSSB (Employee 3%)', Math.round(selectedRecord.deductions * 0.25)],
                    ['CBHI (Health Insurance)', Math.round(selectedRecord.deductions * 0.10)],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="flex justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-red-500">−{Number(val).toLocaleString()} RWF</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">Total Deductions</span>
                    <span className="font-semibold text-red-500">−{selectedRecord.deductions.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200 flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-800">Net Pay</span>
                <span className="text-2xl font-bold text-teal-700">{selectedRecord.net_pay.toLocaleString()} RWF</span>
              </div>
              <p className="text-xs text-slate-400 text-center mt-6">
                Computer-generated payslip. For queries contact the Accounts Department.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setShowPayslipModal(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer">Close</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-printer-line mr-2"></i>Print Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Payroll Confirmation Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Process Payroll</h3>
              <button onClick={() => setShowProcessModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
                <div className="flex gap-3">
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-alert-line text-xl text-amber-600"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 text-sm mb-1">Confirm Payroll Processing</p>
                    <p className="text-sm text-amber-800">All Pending and Processing records for {monthLabel(selectedPeriod)} will be marked as Paid with today&apos;s date.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  ['Total Staff', summary.totalStaff],
                  ['Pending Payments', summary.pendingCount + summary.processingCount],
                ].map(([l, v]) => (
                  <div key={String(l)} className="flex justify-between">
                    <span className="text-slate-500">{l}</span>
                    <span className="font-semibold text-slate-800">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">Total Net Payroll</span>
                  <span className="font-semibold text-teal-700">{summary.totalNetPay.toLocaleString()} RWF</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setShowProcessModal(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm transition-colors whitespace-nowrap cursor-pointer">Cancel</button>
              <button
                onClick={handleConfirmProcess}
                disabled={processing}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <i className="ri-checkbox-circle-line mr-2"></i>
                {processing ? 'Processing…' : 'Confirm & Process'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {[
                { label: 'Full Name', key: 'staff_name', placeholder: 'e.g. Jean Claude Mugabo', type: 'text' },
                { label: 'Role / Position', key: 'role', placeholder: 'e.g. Senior Teacher', type: 'text' },
                { label: 'Base Salary (RWF)', key: 'base_salary', placeholder: '0', type: 'number' },
                { label: 'Allowances (RWF)', key: 'allowances', placeholder: '0', type: 'number' },
                { label: 'Deductions (RWF)', key: 'deductions', placeholder: '0', type: 'number' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type={type}
                    required
                    min={type === 'number' ? 0 : undefined}
                    placeholder={placeholder}
                    value={addForm[key as keyof AddStaffForm]}
                    onChange={e => setAddForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
              {addForm.base_salary && addForm.allowances && addForm.deductions && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex justify-between text-sm">
                  <span className="text-slate-600">Estimated Net Pay</span>
                  <span className="font-bold text-teal-700">
                    {(Number(addForm.base_salary) + Number(addForm.allowances) - Number(addForm.deductions)).toLocaleString()} RWF
                  </span>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm whitespace-nowrap cursor-pointer">Cancel</button>
                <button type="submit" disabled={addLoading} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60 whitespace-nowrap cursor-pointer">
                  {addLoading ? 'Saving…' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Salary Modal */}
      {editSalaryRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Edit Salary</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editSalaryRecord.staff_name} &mdash; {editSalaryRecord.role}</p>
              </div>
              <button
                onClick={() => { setEditSalaryRecord(null); setEditSalaryForm(DEFAULT_EDIT_FORM); }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleEditSalarySubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5 text-sm">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-information-line text-amber-600 text-base"></i>
                </div>
                <p className="text-amber-800">Changes update the salary roster. This period&apos;s records are <strong>not</strong> affected — the new figures apply from the next payroll generation.</p>
              </div>
              {[
                { label: 'Base Salary (RWF)', key: 'base_salary' },
                { label: 'Allowances (RWF)', key: 'allowances' },
                { label: 'Deductions (RWF)', key: 'deductions' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editSalaryForm[key as keyof EditSalaryForm]}
                    onChange={e => setEditSalaryForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
              {editSalaryForm.base_salary && editSalaryForm.allowances && editSalaryForm.deductions && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Previous net pay</span>
                    <span>{editSalaryRecord.net_pay.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-teal-700 pt-1 border-t border-teal-200">
                    <span>New net pay</span>
                    <span>
                      {(Number(editSalaryForm.base_salary) + Number(editSalaryForm.allowances) - Number(editSalaryForm.deductions)).toLocaleString()} RWF
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditSalaryRecord(null); setEditSalaryForm(DEFAULT_EDIT_FORM); }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSalaryLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                >
                  {editSalaryLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
