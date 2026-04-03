import { useState } from 'react';
import { useRealRiskAlerts } from '../../../hooks/useRealRiskAlerts';
import { useAuth } from '../../../hooks/useAuth';

type RiskCategory = 'all' | 'low-performance' | 'frequent-absences' | 'unpaid-fees' | 'multiple-failures';
type RiskLevel = 'all' | 'high' | 'medium' | 'low';

export default function StudentRiskMonitoring() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const { studentsAtRisk, loading, error, refetch } = useRealRiskAlerts(schoolId);

  const [filterCategory, setFilterCategory] = useState<RiskCategory>('all');
  const [filterLevel, setFilterLevel] = useState<RiskLevel>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<(typeof studentsAtRisk)[0] | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const classes = Array.from(new Set(studentsAtRisk.map(s => s.class_name))).sort();

  const filteredStudents = studentsAtRisk.filter(student => {
    if (filterCategory !== 'all' && !student.risk_categories.includes(filterCategory)) return false;
    if (filterLevel !== 'all' && student.risk_level !== filterLevel) return false;
    if (filterClass !== 'all' && student.class_name !== filterClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        student.student_name.toLowerCase().includes(q) ||
        student.student_code.toLowerCase().includes(q) ||
        student.class_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: studentsAtRisk.length,
    high: studentsAtRisk.filter(s => s.risk_level === 'high').length,
    medium: studentsAtRisk.filter(s => s.risk_level === 'medium').length,
    low: studentsAtRisk.filter(s => s.risk_level === 'low').length,
    lowPerformance: studentsAtRisk.filter(s => s.risk_categories.includes('low-performance')).length,
    frequentAbsences: studentsAtRisk.filter(s => s.risk_categories.includes('frequent-absences')).length,
    unpaidFees: studentsAtRisk.filter(s => s.risk_categories.includes('unpaid-fees')).length,
    multipleFailures: studentsAtRisk.filter(s => s.risk_categories.includes('multiple-failures')).length,
  };

  const getRiskLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-orange-100 text-orange-700 border-orange-200',
      low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[level] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getRiskLevelIcon = (level: string) => {
    const icons: Record<string, string> = {
      high: 'ri-error-warning-fill',
      medium: 'ri-alert-fill',
      low: 'ri-information-fill',
    };
    return icons[level] ?? 'ri-information-line';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'low-performance': 'Low Performance',
      'frequent-absences': 'Frequent Absences',
      'unpaid-fees': 'Unpaid Fees',
      'multiple-failures': 'Multiple Failures',
    };
    return labels[category] ?? category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'low-performance': 'ri-line-chart-line',
      'frequent-absences': 'ri-calendar-close-line',
      'unpaid-fees': 'ri-money-dollar-circle-line',
      'multiple-failures': 'ri-file-list-3-line',
    };
    return icons[category] ?? 'ri-alert-line';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'low-performance': 'bg-red-50 text-red-700 border-red-200',
      'frequent-absences': 'bg-orange-50 text-orange-700 border-orange-200',
      'unpaid-fees': 'bg-purple-50 text-purple-700 border-purple-200',
      'multiple-failures': 'bg-pink-50 text-pink-700 border-pink-200',
    };
    return colors[category] ?? 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Scanning student records for risk factors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <i className="ri-error-warning-line text-red-500 text-xl"></i>
          <div>
            <p className="text-sm font-medium text-red-700">Failed to load student risk data</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <button onClick={refetch} className="ml-auto px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 whitespace-nowrap cursor-pointer">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Risk Monitoring</h1>
          <p className="text-sm text-gray-600 mt-1">
            Live data — {studentsAtRisk.length} at-risk student{studentsAtRisk.length !== 1 ? 's' : ''} identified
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-refresh-line"></i>
          Refresh
        </button>
      </div>

      {/* Risk Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total At Risk</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-follow-line text-2xl text-gray-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.high}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-error-warning-fill text-2xl text-red-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-orange-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Medium Risk</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.medium}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-alert-fill text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Risk</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.low}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="ri-information-fill text-2xl text-yellow-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Risk Categories Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-line-chart-line text-xl text-red-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-600">Below 60% Average</p>
              <p className="text-lg font-bold text-gray-900">{stats.lowPerformance}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-close-line text-xl text-orange-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-600">Frequent Absences</p>
              <p className="text-lg font-bold text-gray-900">{stats.frequentAbsences}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-xl text-purple-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-600">Unpaid Fees</p>
              <p className="text-lg font-bold text-gray-900">{stats.unpaidFees}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-list-3-line text-xl text-pink-600"></i>
            </div>
            <div>
              <p className="text-xs text-gray-600">Multiple Failures</p>
              <p className="text-lg font-bold text-gray-900">{stats.multipleFailures}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Category</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as RiskCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="low-performance">Low Performance</option>
              <option value="frequent-absences">Frequent Absences</option>
              <option value="unpaid-fees">Unpaid Fees</option>
              <option value="multiple-failures">Multiple Failures</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value as RiskLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Categories</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Risk Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Average</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Attendance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fee Balance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <i className="ri-shield-check-line text-4xl text-gray-300 mb-2 block"></i>
                    <p className="text-sm text-gray-500">No at-risk students found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.student_name}</p>
                        <p className="text-xs text-gray-500">{student.student_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{student.class_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.risk_categories.map(cat => (
                          <span
                            key={cat}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(cat)}`}
                          >
                            <i className={`${getCategoryIcon(cat)} text-xs`}></i>
                            {getCategoryLabel(cat)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(student.risk_level)}`}>
                        <i className={`${getRiskLevelIcon(student.risk_level)} text-xs`}></i>
                        {student.risk_level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${student.average_score !== undefined && student.average_score < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                        {student.average_score !== undefined ? `${student.average_score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${student.attendance_rate !== undefined && student.attendance_rate < 75 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {student.attendance_rate !== undefined ? `${student.attendance_rate}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${student.fee_balance && student.fee_balance > 0 ? 'text-purple-600' : 'text-green-600'}`}>
                        {student.fee_balance !== undefined
                          ? student.fee_balance > 0
                            ? `${student.fee_balance.toLocaleString()} Frw`
                            : 'Paid'
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelectedStudent(student); setShowDetailModal(true); }}
                        className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Student Risk Profile</h2>
                <p className="text-sm text-gray-600 mt-1">Comprehensive risk assessment &amp; intervention planning</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.student_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{selectedStudent.student_name}</h3>
                  <p className="text-sm text-gray-600">{selectedStudent.student_code} &bull; {selectedStudent.class_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(selectedStudent.risk_level)}`}>
                      <i className={getRiskLevelIcon(selectedStudent.risk_level)}></i>
                      {selectedStudent.risk_level.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Categories */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Risk Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.risk_categories.map(cat => (
                    <span key={cat} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${getCategoryColor(cat)}`}>
                      <i className={getCategoryIcon(cat)}></i>
                      {getCategoryLabel(cat)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-bar-chart-line text-gray-600"></i>
                    <p className="text-xs text-gray-600">Average Score</p>
                  </div>
                  <p className={`text-2xl font-bold ${selectedStudent.average_score !== undefined && selectedStudent.average_score < 60 ? 'text-red-600' : 'text-gray-900'}`}>
                    {selectedStudent.average_score !== undefined ? `${selectedStudent.average_score}%` : 'N/A'}
                  </p>
                  {selectedStudent.average_score !== undefined && selectedStudent.average_score < 60 && (
                    <p className="text-xs text-red-600 mt-1">Below pass mark</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-calendar-check-line text-gray-600"></i>
                    <p className="text-xs text-gray-600">Attendance Rate</p>
                  </div>
                  <p className={`text-2xl font-bold ${selectedStudent.attendance_rate !== undefined && selectedStudent.attendance_rate < 75 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {selectedStudent.attendance_rate !== undefined ? `${selectedStudent.attendance_rate}%` : 'N/A'}
                  </p>
                  {selectedStudent.consecutive_absences !== undefined && selectedStudent.consecutive_absences >= 3 && (
                    <p className="text-xs text-orange-600 mt-1">{selectedStudent.consecutive_absences} consecutive absences</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-money-dollar-circle-line text-gray-600"></i>
                    <p className="text-xs text-gray-600">Fee Balance</p>
                  </div>
                  <p className={`text-xl font-bold ${selectedStudent.fee_balance && selectedStudent.fee_balance > 0 ? 'text-purple-600' : 'text-green-600'}`}>
                    {selectedStudent.fee_balance !== undefined
                      ? selectedStudent.fee_balance > 0
                        ? `${selectedStudent.fee_balance.toLocaleString()} Frw`
                        : 'Paid'
                      : 'N/A'}
                  </p>
                  {selectedStudent.fee_balance !== undefined && selectedStudent.fee_balance > 0 && (
                    <p className="text-xs text-purple-600 mt-1">Outstanding balance</p>
                  )}
                </div>
              </div>

              {/* Failing Subjects */}
              {selectedStudent.failing_subjects && selectedStudent.failing_subjects.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Failing Subjects ({selectedStudent.failing_subjects.length})</h4>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.failing_subjects.map(subject => (
                        <span key={subject} className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-lg text-sm font-medium text-red-700 border border-red-200">
                          <i className="ri-close-circle-line"></i>
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommended Interventions</h4>
                <div className="space-y-2">
                  {selectedStudent.risk_categories.includes('low-performance') && (
                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <i className="ri-lightbulb-line text-teal-600 mt-0.5"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Academic Support</p>
                        <p className="text-xs text-gray-600 mt-1">Arrange extra tutoring sessions and a personalised learning plan.</p>
                      </div>
                    </div>
                  )}
                  {selectedStudent.risk_categories.includes('frequent-absences') && (
                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <i className="ri-parent-line text-teal-600 mt-0.5"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Parent Meeting</p>
                        <p className="text-xs text-gray-600 mt-1">Schedule an urgent meeting to discuss attendance issues.</p>
                      </div>
                    </div>
                  )}
                  {selectedStudent.risk_categories.includes('unpaid-fees') && (
                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <i className="ri-hand-coin-line text-teal-600 mt-0.5"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Financial Counselling</p>
                        <p className="text-xs text-gray-600 mt-1">Discuss payment plan options with the accountant and parents.</p>
                      </div>
                    </div>
                  )}
                  {selectedStudent.risk_categories.includes('multiple-failures') && (
                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <i className="ri-team-line text-teal-600 mt-0.5"></i>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Multi-Subject Support</p>
                        <p className="text-xs text-gray-600 mt-1">Coordinate with subject teachers for a comprehensive support plan.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-400 pt-4 border-t border-gray-200">
                Data last computed: {new Date(selectedStudent.last_updated).toLocaleString()}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
