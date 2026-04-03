import { useState } from 'react';
import { useReportCardControl } from '../../../hooks/useReportCardControl';
import { useReportCard } from '../../../hooks/useReportCard';
import ReportCardPreview from '../../../components/ReportCardPreview';
import { downloadReportCard } from '../../../utils/reportCardGenerator';
import { fetchReportCardData } from '../../../utils/reportCardFetcher';

export default function ReportCardControl() {
  const [selectedTermId, setSelectedTermId] = useState<string | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'audit'>('overview');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [downloadingStudentId, setDownloadingStudentId] = useState<string | null>(null);

  // Preview state
  const [previewStudentId, setPreviewStudentId] = useState('');
  const [previewTermId, setPreviewTermId] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const {
    students,
    classSummaries,
    stats,
    terms,
    classes,
    loading,
    error,
    refetch,
    finalizeReportCard,
    unfinalizeReportCard,
  } = useReportCardControl(selectedTermId);

  // Fetch real report card data for preview
  const {
    reportCardData,
    loading: rcLoading,
    error: rcError,
  } = useReportCard(
    showPreview ? previewStudentId : '',
    showPreview ? previewTermId : ''
  );

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const activeTerm = selectedTermId || terms[0]?.id || '';

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
    const matchSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleFinalize = async (studentId: string, termId: string, studentName: string) => {
    setActionLoading(studentId);
    try {
      await finalizeReportCard(studentId, termId);
      showToast('success', `Report card finalized for ${studentName}`);
    } catch {
      showToast('error', 'Failed to finalize report card');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnfinalize = async (studentId: string, termId: string, studentName: string) => {
    setActionLoading(studentId);
    try {
      await unfinalizeReportCard(studentId, termId);
      showToast('success', `Report card unlocked for ${studentName}`);
    } catch {
      showToast('error', 'Failed to unlock report card');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkFinalize = async () => {
    if (selectedStudents.length === 0) return;
    setActionLoading('bulk');
    try {
      for (const sid of selectedStudents) {
        const s = students.find(st => st.studentId === sid);
        if (s) await finalizeReportCard(s.studentId, s.termId);
      }
      showToast('success', `Finalized ${selectedStudents.length} report cards`);
      setSelectedStudents([]);
      setShowBulkActions(false);
    } catch {
      showToast('error', 'Bulk finalize failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = (studentId: string, termId: string) => {
    setPreviewStudentId(studentId);
    setPreviewTermId(termId);
    setShowPreview(true);
  };

  const handleDownload = async (studentId: string, termId: string, studentName: string) => {
    setDownloadingStudentId(studentId);
    try {
      const { data, error: fetchError } = await fetchReportCardData(studentId, termId);

      if (fetchError) {
        showToast('error', fetchError);
        return;
      }

      if (!data) {
        showToast('error', `No report card data found for ${studentName}`);
        return;
      }

      await downloadReportCard(data);
      showToast('success', `Report card downloaded for ${studentName}`);
    } catch (err) {
      showToast('error', 'Failed to download report card');
      console.error('Download error:', err);
    } finally {
      setDownloadingStudentId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-600 mt-4">Loading report card data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
          <div>
            <h3 className="font-bold text-red-900">Error Loading Data</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={refetch} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg text-sm whitespace-nowrap">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-teal-600' : 'bg-red-600'
        }`}>
          <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Card Control Panel</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all report card activities</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Term Selector */}
          <select
            value={selectedTermId || activeTerm}
            onChange={e => setSelectedTermId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <i className="ri-refresh-line"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Generated', value: stats.totalGenerated, icon: 'ri-file-text-line', color: 'teal' },
          { label: 'Pending Approvals', value: stats.pendingApprovals, icon: 'ri-time-line', color: 'orange' },
          { label: 'Locked (Fees)', value: stats.lockedDueToFees, icon: 'ri-lock-line', color: 'red' },
          { label: 'Fees Cleared', value: stats.fullyPaid, icon: 'ri-checkbox-circle-line', color: 'green' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className={`text-3xl font-bold mt-2 text-${card.color}-600`}>{card.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                <i className={`${card.icon} text-2xl text-${card.color}-600`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 flex">
          {(['overview', 'students', 'audit'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && <i className="ri-dashboard-line mr-2"></i>}
              {tab === 'students' && <i className="ri-group-line mr-2"></i>}
              {tab === 'audit' && <i className="ri-history-line mr-2"></i>}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Report Card Status</h3>
            {classSummaries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <i className="ri-file-list-line text-4xl mb-3"></i>
                <p>No class data available for this term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {['Class', 'Total Students', 'Generated', 'Finalized', 'Fee Issues'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classSummaries.map(c => (
                      <tr key={c.classId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{c.className}</td>
                        <td className="py-3 px-4 text-gray-700">{c.totalStudents}</td>
                        <td className="py-3 px-4">
                          <span className="text-teal-600 font-medium">{c.generated}</span>
                          <span className="text-gray-400 text-xs ml-1">/ {c.totalStudents}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-green-600 font-medium">{c.approved}</span>
                        </td>
                        <td className="py-3 px-4">
                          {c.locked > 0 ? (
                            <span className="text-red-600 font-medium">{c.locked}</span>
                          ) : (
                            <span className="text-green-600 text-sm">All clear</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="p-6 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by name or student code..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {selectedStudents.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <i className="ri-checkbox-multiple-line"></i>
                  Bulk ({selectedStudents.length})
                </button>
              )}
            </div>

            {/* Bulk Actions */}
            {showBulkActions && selectedStudents.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium">{selectedStudents.length} selected</span>
                <button
                  onClick={handleBulkFinalize}
                  disabled={actionLoading === 'bulk'}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {actionLoading === 'bulk' ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-double-line"></i>}
                  Finalize All
                </button>
                <button
                  onClick={() => { setSelectedStudents([]); setShowBulkActions(false); }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={e => setSelectedStudents(e.target.checked ? filteredStudents.map(s => s.studentId) : [])}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </th>
                    {['Student', 'Class', 'Average', 'Rank', 'Marks', 'Status', 'Fees', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        <i className="ri-file-list-line text-4xl mb-3 block"></i>
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => (
                      <tr key={s.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(s.studentId)}
                            onChange={() => toggleSelect(s.studentId)}
                            className="w-4 h-4 text-teal-600 rounded"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900 text-sm">{s.studentName}</p>
                          <p className="text-xs text-gray-500">{s.studentCode}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{s.className}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 text-sm">
                            {s.averageScore > 0 ? `${s.averageScore.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-teal-600 font-medium">
                          {s.classRank > 0 ? `${s.classRank} / ${s.totalStudents}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            s.marksApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {s.marksApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            s.isFinalized ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {s.isFinalized ? 'Finalized' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            s.feesBalance === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {s.feesBalance === 0 ? 'Paid' : `${s.feesBalance.toLocaleString()} Frw`}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handlePreview(s.studentId, s.termId)}
                              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                              title="Preview Report Card"
                            >
                              <i className="ri-eye-line text-base"></i>
                            </button>
                            <button
                              onClick={() => handleDownload(s.studentId, s.termId, s.studentName)}
                              disabled={downloadingStudentId === s.studentId}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              title="Download Report Card"
                            >
                              {downloadingStudentId === s.studentId
                                ? <i className="ri-loader-4-line animate-spin text-base"></i>
                                : <i className="ri-download-line text-base"></i>}
                            </button>
                            {s.isFinalized ? (
                              <button
                                onClick={() => handleUnfinalize(s.studentId, s.termId, s.studentName)}
                                disabled={actionLoading === s.studentId}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                                title="Unfinalize"
                              >
                                {actionLoading === s.studentId
                                  ? <i className="ri-loader-4-line animate-spin text-base"></i>
                                  : <i className="ri-lock-unlock-line text-base"></i>}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleFinalize(s.studentId, s.termId, s.studentName)}
                                disabled={actionLoading === s.studentId || !s.marksApproved}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={s.marksApproved ? 'Finalize Report Card' : 'Marks not approved yet'}
                              >
                                {actionLoading === s.studentId
                                  ? <i className="ri-loader-4-line animate-spin text-base"></i>
                                  : <i className="ri-check-double-line text-base"></i>}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <i className="ri-history-line text-4xl mb-3 block text-gray-300"></i>
              <p className="font-medium">Audit log coming soon</p>
              <p className="text-sm mt-1">All report card actions will be tracked here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Report Card Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {rcLoading ? (
            <div className="bg-white rounded-2xl p-12 flex flex-col items-center gap-4 shadow-xl">
              <i className="ri-loader-4-line text-5xl text-teal-600 animate-spin"></i>
              <p className="text-gray-700 font-medium">Loading report card...</p>
            </div>
          ) : rcError ? (
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl text-center">
              <i className="ri-error-warning-line text-5xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Could Not Load Report Card</h3>
              <p className="text-sm text-gray-600 mb-6">{rcError}</p>
              <button onClick={() => setShowPreview(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium whitespace-nowrap">
                Close
              </button>
            </div>
          ) : reportCardData ? (
            <ReportCardPreview data={reportCardData} onClose={() => setShowPreview(false)} />
          ) : (
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl text-center">
              <i className="ri-file-unknow-line text-5xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Report Card Data</h3>
              <p className="text-sm text-gray-600 mb-6">This student has no marks or report card record for the selected term.</p>
              <button onClick={() => setShowPreview(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium whitespace-nowrap">
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
