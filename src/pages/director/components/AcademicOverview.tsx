import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTerms } from '../../../hooks/useTerms';
import { useAcademicYears } from '../../../hooks/useAcademicYears';
import { useMarksStats } from '../../../hooks/useMarks';
import { useClassPerformance } from '../../../hooks/useClassPerformance';
import { useSubjectPerformance } from '../../../hooks/useSubjectPerformance';
import { useMarks } from '../../../hooks/useMarks';
import { useSchoolStats } from '../../../hooks/useSchoolStats';

export default function AcademicOverview() {
  const { user } = useAuth();
  const { terms, activeTerm } = useTerms(user?.school_id);
  const { academicYears, activeYear } = useAcademicYears(user?.school_id);
  
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Use active term by default
  const currentTermId = selectedTermId || activeTerm?.id;

  const { stats: schoolStats } = useSchoolStats(user?.school_id);
  const { stats: marksStats, loading: marksStatsLoading } = useMarksStats(user?.school_id, currentTermId);
  const { classPerformance, loading: classLoading } = useClassPerformance(user?.school_id, currentTermId);
  const { subjectPerformance, loading: subjectLoading } = useSubjectPerformance(
    user?.school_id, 
    currentTermId,
    selectedClassId === 'all' ? undefined : selectedClassId
  );
  const { marks: recentMarksData, loading: recentMarksLoading } = useMarks({
    schoolId: user?.school_id,
    termId: currentTermId
  });

  // Get recent marks (last 10)
  const recentMarks = recentMarksData.slice(0, 10);

  const getProgressColor = (value: number) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 70) return 'bg-amber-500';
    if (value >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getGradeColor = (average: number) => {
    if (average >= 90) return 'text-green-600';
    if (average >= 80) return 'text-emerald-600';
    if (average >= 70) return 'text-amber-600';
    if (average >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Overview</h2>
          <p className="text-sm text-gray-600">View academic performance across all classes and subjects</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            <option value="all">All Classes</option>
            {classPerformance.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} {term.id === activeTerm?.id ? '(Active)' : ''}
              </option>
            ))}
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap">
            <i className="ri-download-line"></i>
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-bar-chart-line text-2xl text-white"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {marksStatsLoading ? '...' : `${marksStats?.averageScore || 0}%`}
          </div>
          <div className="text-sm text-gray-600">Overall Average</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-white"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {classLoading ? '...' : `${Math.round(classPerformance.reduce((sum, c) => sum + c.pass_rate, 0) / (classPerformance.length || 1))}%`}
          </div>
          <div className="text-sm text-gray-600">Pass Rate</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <i className="ri-trophy-line text-2xl text-white"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {marksStatsLoading ? '...' : marksStats?.topPerformers?.[0]?.average.toFixed(1) || '0'}
          </div>
          <div className="text-sm text-gray-600">Highest Score</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="ri-user-line text-2xl text-white"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">
            {schoolStats?.totalStudents || 0}
          </div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Subject Performance</h3>
        </div>
        <div className="p-6">
          {subjectLoading ? (
            <div className="text-center py-8 text-gray-500">Loading subject performance...</div>
          ) : subjectPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No subject performance data available</div>
          ) : (
            <div className="space-y-6">
              {subjectPerformance.map((subject) => (
                <div key={subject.subject_id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{subject.subject_name}</span>
                      <span className="text-sm text-gray-500">({subject.student_count} students)</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-600">Avg: <span className={`font-bold ${getGradeColor(subject.average_score)}`}>{subject.average_score}%</span></span>
                      <span className="text-sm text-gray-600">Pass: <span className="font-bold text-green-600">{subject.pass_rate}%</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getProgressColor(subject.average_score)}`}
                        style={{ width: `${subject.average_score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Top: {subject.top_score}%</span>
                    <span>Lowest: {subject.lowest_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Class Performance</h3>
          </div>
          <div className="overflow-x-auto">
            {classLoading ? (
              <div className="text-center py-8 text-gray-500">Loading class performance...</div>
            ) : classPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No class performance data available</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Average</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pass Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classPerformance.map((item) => (
                    <tr key={item.class_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.class_name}</td>
                      <td className="px-6 py-4 text-gray-600">{item.student_count}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${getGradeColor(item.average_score)}`}>{item.average_score}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600">{item.pass_rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Top Performing Students</h3>
          </div>
          <div className="p-6">
            {marksStatsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading top students...</div>
            ) : !marksStats?.topPerformers || marksStats.topPerformers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No student performance data available</div>
            ) : (
              <div className="space-y-4">
                {marksStats.topPerformers.slice(0, 5).map((student, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{student.student_name}</div>
                      <div className="text-sm text-gray-600">All Subjects</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-teal-600">{student.average.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">Average</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Marks Entry */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Recent Marks Entry</h3>
          <button className="text-teal-600 text-sm font-medium hover:underline whitespace-nowrap">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentMarksLoading ? (
            <div className="text-center py-8 text-gray-500">Loading recent marks...</div>
          ) : recentMarks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No marks entries available</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentMarks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{mark.subject_name}</td>
                    <td className="px-6 py-4 text-gray-600">{mark.class_name}</td>
                    <td className="px-6 py-4 text-gray-600">{mark.teacher_name}</td>
                    <td className="px-6 py-4 text-gray-500">{formatTimeAgo(mark.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(mark.status)}`}>
                        {mark.status.charAt(0).toUpperCase() + mark.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View">
                          <i className="ri-eye-line"></i>
                        </button>
                        {mark.status === 'pending' && (
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                            <i className="ri-check-line"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}