import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAcademicYears } from '../../../hooks/useAcademicYears';
import { useStudentPromotion } from '../../../hooks/useStudentPromotion';
import { generatePromotionPreview, distributeStudentsToClasses, getNextClass } from '../../../utils/promotionEngine';
import type { StudentPromotionData, ClassDistribution } from '../../../types/promotion';

export default function StudentPromotion() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { academicYears, activeYear } = useAcademicYears(schoolId);
  const { students, classes, promotionHistory, loading, saving, error, executePromotion } =
    useStudentPromotion(schoolId);

  const [activeTab, setActiveTab] = useState<'preview' | 'history'>('preview');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDistribution | null>(null);
  const [executionNotes, setExecutionNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [execError, setExecError] = useState('');

  // Use active year as default
  const resolvedYearId = selectedAcademicYearId || activeYear?.id || '';
  const resolvedYearName =
    academicYears.find((y) => y.id === resolvedYearId)?.name ||
    activeYear?.name ||
    'Current Year';

  // Generate promotion preview from real student data
  const promotionData = useMemo(() => generatePromotionPreview(students), [students]);

  // Group promoted students by current class
  const promotedByClass = useMemo(() => {
    const grouped: Record<string, StudentPromotionData[]> = {};
    promotionData.promoted.forEach((student) => {
      if (!grouped[student.current_class]) grouped[student.current_class] = [];
      grouped[student.current_class].push(student);
    });
    return grouped;
  }, [promotionData]);

  // Generate class distributions using real class names
  const classDistributions = useMemo(() => {
    const distributions: Record<string, ClassDistribution[]> = {};
    Object.entries(promotedByClass).forEach(([currentClass, studs]) => {
      const nextClasses = getNextClass(currentClass);
      if (nextClasses && Array.isArray(nextClasses)) {
        // Try to match next class names against real DB classes
        const realNextClasses = nextClasses.filter((nc) =>
          classes.some((c) => c.name === nc)
        );
        const targets = realNextClasses.length > 0 ? realNextClasses : nextClasses;
        distributions[currentClass] = distributeStudentsToClasses(studs, targets);
      }
    });
    return distributions;
  }, [promotedByClass, classes]);

  // Build classAssignments map: studentId -> toClassId
  const buildClassAssignments = useCallback((): Record<string, string> => {
    const map: Record<string, string> = {};
    Object.values(classDistributions).forEach((dists) => {
      dists.forEach((dist) => {
        const realClass = classes.find((c) => c.name === dist.class_name);
        dist.students.forEach((s) => {
          if (realClass) map[s.id] = realClass.id;
        });
      });
    });
    // Repeat students stay in same class
    promotionData.repeat.forEach((s) => {
      const realClass = classes.find((c) => c.name === s.current_class);
      if (realClass) map[s.id] = realClass.id;
    });
    // Conditional students stay in same class
    promotionData.conditional.forEach((s) => {
      const realClass = classes.find((c) => c.name === s.current_class);
      if (realClass) map[s.id] = realClass.id;
    });
    return map;
  }, [classDistributions, classes, promotionData]);

  const handleExecutePromotion = async () => {
    if (!resolvedYearId) {
      setExecError('Please select an academic year.');
      return;
    }
    setExecError('');
    const classAssignments = buildClassAssignments();
    const result = await executePromotion({
      promotedStudents: promotionData.promoted,
      repeatStudents: promotionData.repeat,
      conditionalStudents: promotionData.conditional,
      classAssignments,
      academicYearId: resolvedYearId,
      processedBy: profile?.id || '',
      notes: executionNotes,
    });

    if (result.success) {
      setSuccessMsg('Promotion executed successfully! Students have been moved to their new classes.');
      setShowExecuteModal(false);
      setExecutionNotes('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setExecError(result.error || 'Promotion failed. Please try again.');
    }
  };

  const filteredHistory = promotionHistory.filter(
    (r) =>
      r.academic_year.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.executed_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Promotion System</h1>
        <p className="text-gray-600">
          Automatic promotion with intelligent class distribution — powered by real student data
        </p>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-5 py-4">
          <i className="ri-checkbox-circle-line text-xl text-emerald-600"></i>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-5 py-4">
          <i className="ri-error-warning-line text-xl text-red-600"></i>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm">Loading student data from database...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-100 text-sm">Promoted</span>
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-arrow-up-circle-line text-2xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{promotionData.promoted.length}</div>
              <div className="text-emerald-100 text-xs">Average ≥ 60%</div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-100 text-sm">Conditional</span>
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-alert-line text-2xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{promotionData.conditional.length}</div>
              <div className="text-amber-100 text-xs">Score 50–59%</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-100 text-sm">Repeat Class</span>
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-refresh-line text-2xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{promotionData.repeat.length}</div>
              <div className="text-red-100 text-xs">Score &lt; 50%</div>
            </div>

            <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Total Students</span>
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-group-line text-2xl"></i>
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{students.length}</div>
              <div className="text-slate-300 text-xs">{resolvedYearName}</div>
            </div>
          </div>

          {/* No students state */}
          {students.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                <i className="ri-group-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                No active students with approved marks were found. Make sure marks have been approved
                before running promotion.
              </p>
            </div>
          )}

          {students.length > 0 && (
            <>
              {/* Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 px-6 py-4 font-medium transition-colors text-sm whitespace-nowrap ${
                      activeTab === 'preview'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <i className="ri-eye-line mr-2"></i>
                    Promotion Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 px-6 py-4 font-medium transition-colors text-sm whitespace-nowrap ${
                      activeTab === 'history'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <i className="ri-history-line mr-2"></i>
                    Promotion History
                    {promotionHistory.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                        {promotionHistory.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* ── PREVIEW TAB ── */}
              {activeTab === 'preview' && (
                <div className="space-y-6">
                  {/* Execute Promotion Bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Execute Promotion
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Promote all eligible students and update their class assignments in the
                          database
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={resolvedYearId}
                          onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                        >
                          {academicYears.map((y) => (
                            <option key={y.id} value={y.id}>
                              {y.name} {y.is_active ? '(Active)' : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowExecuteModal(true)}
                          disabled={saving}
                          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <i className="ri-play-circle-line mr-2"></i>
                          Execute Promotion
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Class Distribution Preview */}
                  {Object.keys(classDistributions).length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-5">
                        Class Distribution Preview
                      </h3>
                      <div className="space-y-6">
                        {Object.entries(classDistributions).map(([currentClass, dists]) => (
                          <div key={currentClass} className="border border-gray-200 rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                                {currentClass}
                              </span>
                              <i className="ri-arrow-right-line text-gray-400"></i>
                              <span className="text-sm text-gray-600">
                                {dists.map((d) => d.class_name).join(' & ')}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {dists.map((dist) => (
                                <div
                                  key={dist.class_name}
                                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer"
                                  onClick={() => {
                                    setSelectedClass(dist);
                                    setShowPreviewModal(true);
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="font-semibold text-gray-900">{dist.class_name}</h5>
                                    <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
                                      {dist.total_students} students
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                                      <div className="text-xs text-gray-500 mb-1">Boys</div>
                                      <div className="text-lg font-bold text-slate-700">
                                        {dist.boys}
                                      </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                                      <div className="text-xs text-gray-500 mb-1">Girls</div>
                                      <div className="text-lg font-bold text-slate-700">
                                        {dist.girls}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Avg Performance</span>
                                      <span className="font-semibold text-emerald-600">
                                        {dist.avg_performance}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">High Performers</span>
                                      <span className="font-semibold text-emerald-700">
                                        {dist.high_performers}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Medium Performers</span>
                                      <span className="font-semibold text-amber-600">
                                        {dist.medium_performers}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Low Performers</span>
                                      <span className="font-semibold text-red-500">
                                        {dist.low_performers}
                                      </span>
                                    </div>
                                  </div>

                                  <button className="w-full mt-3 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium whitespace-nowrap">
                                    <i className="ri-list-check mr-1"></i>
                                    View Student List
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Students Requiring Attention */}
                  {(promotionData.conditional.length > 0 || promotionData.repeat.length > 0) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-5">
                        Students Requiring Attention
                      </h3>

                      {/* Conditional */}
                      {promotionData.conditional.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-amber-600 mb-3 flex items-center text-sm">
                            <i className="ri-alert-line mr-2"></i>
                            Conditional Promotion ({promotionData.conditional.length})
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-amber-100">
                            <table className="w-full text-sm">
                              <thead className="bg-amber-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Student Code
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Class
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Average
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Reason
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {promotionData.conditional.map((s) => (
                                  <tr key={s.id} className="hover:bg-amber-50/40">
                                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                                      {s.student_code}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                      {s.student_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{s.current_class}</td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                        {s.average_score}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{s.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Repeat */}
                      {promotionData.repeat.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 mb-3 flex items-center text-sm">
                            <i className="ri-refresh-line mr-2"></i>
                            Must Repeat Class ({promotionData.repeat.length})
                          </h4>
                          <div className="overflow-x-auto rounded-lg border border-red-100">
                            <table className="w-full text-sm">
                              <thead className="bg-red-50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Student Code
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Class
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Average
                                  </th>
                                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                    Reason
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {promotionData.repeat.map((s) => (
                                  <tr key={s.id} className="hover:bg-red-50/40">
                                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                                      {s.student_code}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 font-medium">
                                      {s.student_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{s.current_class}</td>
                                    <td className="px-4 py-3">
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                        {s.average_score}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{s.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── HISTORY TAB ── */}
              {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Promotion History</h3>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search history..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm w-56"
                      />
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    </div>
                  </div>

                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 bg-gray-100 rounded-full">
                        <i className="ri-history-line text-2xl text-gray-400"></i>
                      </div>
                      <h4 className="font-semibold text-gray-700 mb-1">No History Yet</h4>
                      <p className="text-gray-400 text-sm">
                        Promotion records will appear here after execution.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredHistory.map((record) => (
                        <div
                          key={record.id}
                          className="border border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                Academic Year {record.academic_year}
                              </h4>
                              <p className="text-xs text-gray-500">
                                Executed by{' '}
                                <span className="font-medium text-gray-700">
                                  {record.executed_by}
                                </span>{' '}
                                on{' '}
                                {new Date(record.executed_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold whitespace-nowrap">
                              Completed
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-emerald-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-500 mb-1">Promoted</div>
                              <div className="text-2xl font-bold text-emerald-600">
                                {record.total_promoted}
                              </div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-500 mb-1">Conditional</div>
                              <div className="text-2xl font-bold text-amber-600">
                                {record.total_conditional}
                              </div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-500 mb-1">Repeat</div>
                              <div className="text-2xl font-bold text-red-600">
                                {record.total_repeat}
                              </div>
                            </div>
                          </div>

                          {record.notes && (
                            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 border border-gray-100">
                              <i className="ri-sticky-note-line mr-2 text-gray-400"></i>
                              {record.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── EXECUTE MODAL ── */}
      {showExecuteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Execute Student Promotion</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will update student class assignments in the database.
              </p>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 flex items-center justify-center mt-0.5">
                    <i className="ri-alert-line text-amber-600 text-lg"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2 text-sm">
                      Promotion Summary
                    </h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>
                        • <strong>{promotionData.promoted.length}</strong> students will be promoted
                        to next classes
                      </li>
                      <li>
                        • <strong>{promotionData.conditional.length}</strong> students marked as
                        conditional
                      </li>
                      <li>
                        • <strong>{promotionData.repeat.length}</strong> students will repeat current
                        class
                      </li>
                      <li>• Parallel classes will be balanced by gender &amp; performance</li>
                      <li>• Student class assignments will be updated immediately</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  value={resolvedYearId}
                  onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                >
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Execution Notes{' '}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={executionNotes}
                  onChange={(e) => setExecutionNotes(e.target.value)}
                  placeholder="Add any notes about this promotion cycle..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {executionNotes.length}/500
                </p>
              </div>

              {execError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <i className="ri-error-warning-line"></i>
                  {execError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExecuteModal(false);
                  setExecutionNotes('');
                  setExecError('');
                }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePromotion}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Confirm &amp; Execute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLASS PREVIEW MODAL ── */}
      {showPreviewModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedClass.class_name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedClass.total_students} students assigned to this class
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedClass(null);
                }}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Boys', value: selectedClass.boys, color: 'slate' },
                  { label: 'Girls', value: selectedClass.girls, color: 'pink' },
                  { label: 'Avg Score', value: `${selectedClass.avg_performance}%`, color: 'emerald' },
                  { label: 'Total', value: selectedClass.total_students, color: 'amber' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-${stat.color}-50 rounded-xl p-4 text-center`}>
                    <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                    <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Student Code
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Gender</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Average</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedClass.students.map((s, idx) => {
                      const level =
                        s.average_score >= 75
                          ? { label: 'High', cls: 'bg-emerald-100 text-emerald-700' }
                          : s.average_score >= 60
                          ? { label: 'Medium', cls: 'bg-amber-100 text-amber-700' }
                          : { label: 'Low', cls: 'bg-red-100 text-red-700' };
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                            {s.student_code}
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{s.student_name}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                s.gender === 'male'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {s.gender === 'male' ? 'Male' : 'Female'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {s.average_score}%
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.cls}`}>
                              {level.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
