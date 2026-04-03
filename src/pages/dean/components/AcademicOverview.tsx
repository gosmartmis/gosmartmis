import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTerms } from '../../../hooks/useTerms';
import { useClassPerformance } from '../../../hooks/useClassPerformance';
import { useSubjectPerformance } from '../../../hooks/useSubjectPerformance';
import { useMarks } from '../../../hooks/useMarks';
import { useMarksStats } from '../../../hooks/useMarks';

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export default function AcademicOverview() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id || null;

  const { terms, activeTerm, loading: termsLoading } = useTerms(schoolId);
  const [selectedTermId, setSelectedTermId] = useState<string | undefined>(undefined);

  // Set selected term to active term once loaded
  useEffect(() => {
    if (activeTerm && !selectedTermId) {
      setSelectedTermId(activeTerm.id);
    }
  }, [activeTerm, selectedTermId]);

  const { classPerformance, loading: classLoading } = useClassPerformance(schoolId, selectedTermId);
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);

  // Set first class as selected once loaded
  useEffect(() => {
    if (classPerformance.length > 0 && !selectedClassId) {
      setSelectedClassId(classPerformance[0].class_id);
    }
  }, [classPerformance, selectedClassId]);

  const { subjectPerformance, loading: subjectLoading } = useSubjectPerformance(
    schoolId,
    selectedTermId,
    selectedClassId
  );

  const { stats: marksStats, loading: statsLoading } = useMarksStats(schoolId, selectedTermId);

  const { marks: recentMarks, loading: marksLoading } = useMarks({
    schoolId,
    termId: selectedTermId
  });

  const isLoading = termsLoading || classLoading || subjectLoading || statsLoading || marksLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Overview</h2>
          <p className="text-gray-600 mt-1">Monitor academic performance across all subjects and classes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTermId || ''}
            onChange={(e) => setSelectedTermId(e.target.value || undefined)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            disabled={termsLoading}
          >
            {terms.length === 0 && <option value="">No terms available</option>}
            {terms.map(term => (
              <option key={term.id} value={term.id}>{term.name}</option>
            ))}
          </select>
          <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap">
            <i className="ri-download-line mr-2"></i>
            Export Report
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Class Selector */}
          {classPerformance.length > 0 ? (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit overflow-x-auto">
              {classPerformance.map((cls) => (
                <button
                  key={cls.class_id}
                  onClick={() => setSelectedClassId(cls.class_id)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    selectedClassId === cls.class_id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cls.class_name}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-600">
              No classes available for the selected term
            </div>
          )}

          {/* Subject Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Subject Performance - {classPerformance.find(c => c.class_id === selectedClassId)?.class_name || 'All Classes'}
            </h3>
            {subjectPerformance.length > 0 ? (
              <div className="space-y-4">
                {subjectPerformance.map((subject) => {
                  const percentage = subject.average_score;
                  return (
                    <div key={subject.subject_id} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-gray-700">{subject.subject_name}</div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-teal-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-16 text-right">
                        <span className={`font-semibold ${percentage >= 80 ? 'text-emerald-600' : percentage >= 60 ? 'text-teal-600' : percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-8 text-center">
                        <i className={`${percentage >= 60 ? 'ri-arrow-up-line text-emerald-600' : 'ri-arrow-down-line text-red-600'} w-4 h-4 flex items-center justify-center`}></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No subject performance data available for this class
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Top Performing Students */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Students</h3>
              {marksStats && marksStats.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {marksStats.topPerformers.slice(0, 5).map((student, index) => {
                    const rank = index + 1;
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          rank === 2 ? 'bg-gray-200 text-gray-700' :
                          rank === 3 ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{student.student_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">{Math.round(student.average)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No student performance data available
                </div>
              )}
            </div>

            {/* Recent Marks Entry */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Marks Entry</h3>
              {recentMarks.length > 0 ? (
                <div className="space-y-3">
                  {recentMarks.slice(0, 4).map((mark) => (
                    <div key={mark.id} className="p-4 border border-gray-100 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{mark.teacher_name}</div>
                          <div className="text-sm text-gray-600">
                            {mark.subject_name} • {mark.class_name} • {mark.assessment_type}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{formatTimeAgo(mark.created_at)}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          mark.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          mark.status === 'verified' ? 'bg-teal-100 text-teal-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {mark.status.charAt(0).toUpperCase() + mark.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent marks entries
                </div>
              )}
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Class Performance Summary</h3>
            </div>
            {classPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Class</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Students</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Average Score</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Pass Rate</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Attendance</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classPerformance.map((row) => (
                      <tr key={row.class_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{row.class_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{row.student_count}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${row.average_score >= 80 ? 'text-emerald-600' : row.average_score >= 60 ? 'text-teal-600' : 'text-amber-600'}`}>
                            {row.average_score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{row.pass_rate}%</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{row.attendance_rate}%</td>
                        <td className="px-6 py-4">
                          <i className={`${row.average_score >= 60 ? 'ri-arrow-up-line text-emerald-600' : 'ri-arrow-down-line text-red-600'} w-4 h-4 flex items-center justify-center`}></i>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No class performance data available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}