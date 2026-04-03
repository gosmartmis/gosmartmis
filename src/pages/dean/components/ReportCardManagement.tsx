import { useState } from 'react';
import { useReportCardControl } from '../../../hooks/useReportCardControl';
import { useReportCard } from '../../../hooks/useReportCard';
import { downloadReportCard } from '../../../utils/reportCardGenerator';
import ReportCardPreview from '../../../components/ReportCardPreview';

export default function ReportCardManagement() {
  const [selectedTermId, setSelectedTermId] = useState<string | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
  } = useReportCardControl(selectedTermId);

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

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
    const matchSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const localStats = {
    totalGenerated: filteredStudents.filter(s => s.generatedAt !== null).length,
    pendingGeneration: filteredStudents.filter(s => s.marksApproved && !s.isFinalized).length,
    downloaded: filteredStudents.filter(s => s.isFinalized).length,
    pendingApproval: filteredStudents.filter(s => !s.marksApproved).length,
  };

  const handleGenerateReportCard = async (studentId: string, termId: string, studentName: string) => {
    setActionLoading(studentId);
    try {
      await finalizeReportCard(studentId, termId);
      showToast('success', `Report card generated for ${studentName}`);
    } catch {
      showToast('error', 'Failed to generate report card');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateAll = async () => {
    const eligible = filteredStudents.filter(s => s.marksApproved && !s.isFinalized);
    if (eligible.length === 0) return;
    setGeneratingAll(true);
    try {
      for (const s of eligible) {
        await finalizeReportCard(s.studentId, s.termId);
      }
      showToast('success', `Generated ${eligible.length} report cards`);
    } catch {
      showToast('error', 'Batch generation failed');
    } finally {
      setGeneratingAll(false);
    }
  };

  const handlePreview = (studentId: string, termId: string) => {
    setPreviewStudentId(studentId);
    setPreviewTermId(termId);
    setShowPreview(true);
  };

  const handleDownload = (studentId: string, termId: string) => {
    // Open preview which has the download button
    handlePreview(studentId, termId);
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
      <div className="p-8">
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
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-teal-600' : 'bg-red-600'
        }`}>
          <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
          {toast.message}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Card Management</h1>
        <p className="text-gray-600">Generate and manage student report cards for approved marks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Generated', value: localStats.totalGenerated, icon: 'ri-file-check-line', color: 'green', sub: 'Report cards ready' },
          { label: 'Pending Generation', value: localStats.pendingGeneration, icon: 'ri-file-add-line', color: 'orange', sub: 'Marks approved' },
          { label: 'Finalized', value: localStats.downloaded, icon: 'ri-download-cloud-line', color: 'teal', sub: 'Ready for students' },
          { label: 'Pending Approval', value: localStats.pendingApproval, icon: 'ri-time-line', color: 'red', sub: 'Awaiting director' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">{card.label}</span>
              <div className={`w-10 h-10 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                <i className={`${card.icon} text-xl text-${card.color}-600`}></i>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            {/* Term Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
              <select
                value={selectedTermId || terms[0]?.id || ''}
                onChange={e => setSelectedTermId(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Generate All */}
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2 opacity-0 pointer-events-none">Action</label>
            <button
              onClick={handleGenerateAll}
              disabled={localStats.pendingGeneration === 0 || generatingAll}
              className="w-full lg:w-auto px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
            >
              {generatingAll ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-lg"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="ri-folder-download-line text-lg"></i>
                  Generate All ({localStats.pendingGeneration})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Student', 'Code', 'Class', 'Average', 'Marks Status', 'Report Card', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-file-list-line text-3xl text-gray-400"></i>
                    </div>
                    <p className="text-gray-500 font-medium">No students found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {s.studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{s.studentName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 font-mono">{s.studentCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{s.className}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {s.averageScore > 0 ? `${s.averageScore.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.marksApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                          <i className="ri-checkbox-circle-fill text-sm"></i>
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium whitespace-nowrap">
                          <i className="ri-time-line text-sm"></i>
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.isFinalized ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium whitespace-nowrap">
                          <i className="ri-file-check-line text-sm"></i>
                          Finalized
                        </span>
                      ) : s.marksApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium whitespace-nowrap">
                          <i className="ri-file-add-line text-sm"></i>
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium whitespace-nowrap">
                          <i className="ri-close-circle-line text-sm"></i>
                          Not Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Preview always available if marks exist */}
                        <button
                          onClick={() => handlePreview(s.studentId, s.termId)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Preview Report Card"
                        >
                          <i className="ri-eye-line text-lg"></i>
                        </button>

                        {s.isFinalized ? (
                          <button
                            onClick={() => handleDownload(s.studentId, s.termId)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <i className="ri-download-line text-lg"></i>
                          </button>
                        ) : s.marksApproved ? (
                          <button
                            onClick={() => handleGenerateReportCard(s.studentId, s.termId, s.studentName)}
                            disabled={actionLoading === s.studentId}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
                          >
                            {actionLoading === s.studentId ? (
                              <span className="flex items-center gap-2">
                                <i className="ri-loader-4-line animate-spin"></i>
                                Generating...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <i className="ri-file-add-line"></i>
                                Generate
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Awaiting approval</span>
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
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium whitespace-nowrap"
              >
                Close
              </button>
            </div>
          ) : reportCardData ? (
            <ReportCardPreview data={reportCardData} onClose={() => setShowPreview(false)} />
          ) : (
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl text-center">
              <i className="ri-file-unknow-line text-5xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Report Card Data</h3>
              <p className="text-sm text-gray-600 mb-6">
                This student has no marks or report card record for the selected term.
              </p>
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium whitespace-nowrap"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
