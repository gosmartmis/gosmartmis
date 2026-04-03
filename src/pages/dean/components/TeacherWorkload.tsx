import { useState } from 'react';
import { useTeacherWorkload } from '../../../hooks/useTeacherWorkload';

interface TeacherWorkloadProps {
  schoolId: string;
}

export default function TeacherWorkload({ schoolId }: TeacherWorkloadProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const { workloads, summary, loading, error } = useTeacherWorkload(schoolId);

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'overloaded':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getWorkloadBarWidth = (hours: number) => {
    const maxHours = 35;
    return Math.min((hours / maxHours) * 100, 100);
  };

  const getWorkloadBarColor = (level: string) => {
    switch (level) {
      case 'overloaded':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-green-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['Teacher Name', 'Classes', 'Subjects', 'Periods/Week', 'Hours/Week', 'Workload Level'],
      ...workloads.map(w => [
        w.teacherName,
        w.classesAssigned.join('; '),
        w.subjectsTaught.join('; '),
        w.totalPeriodsPerWeek.toString(),
        w.totalHoursPerWeek.toString(),
        w.workloadLevel
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher-workload-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedWorkload = selectedTeacher 
    ? workloads.find(w => w.teacherId === selectedTeacher) 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Workload Monitoring</h2>
          <p className="text-sm text-gray-600 mt-1">Track and balance teacher assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                viewMode === 'summary'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                viewMode === 'detailed'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Detailed View
            </button>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-download-line"></i>
            Export Report
          </button>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-teal-500 mb-3"></i>
          <p className="text-gray-500">Loading workload data...</p>
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <i className="ri-error-warning-line text-red-600 text-lg"></i>
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalTeachers}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <i className="ri-user-line text-2xl text-teal-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Hours/Week</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{summary.averageHours}h</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-time-line text-2xl text-blue-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overloaded Teachers</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{summary.overloadedCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="ri-alert-line text-2xl text-red-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Workload</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{summary.highWorkloadCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="ri-error-warning-line text-2xl text-orange-600"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Workload Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workload Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{summary.lowWorkloadCount}</div>
                <div className="text-sm text-gray-600 mt-1">Low (&lt;20h)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{summary.normalWorkloadCount}</div>
                <div className="text-sm text-gray-600 mt-1">Normal (20-25h)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{summary.highWorkloadCount}</div>
                <div className="text-sm text-gray-600 mt-1">High (25-30h)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{summary.overloadedCount}</div>
                <div className="text-sm text-gray-600 mt-1">Overloaded (≥30h)</div>
              </div>
            </div>
          </div>

          {/* Alert for Overloaded Teachers */}
          {summary.overloadedCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <i className="ri-alert-line text-xl text-red-600 mt-0.5"></i>
              <div>
                <h4 className="font-semibold text-red-900">Workload Alert</h4>
                <p className="text-sm text-red-700 mt-1">
                  {summary.overloadedCount} teacher{summary.overloadedCount > 1 ? 's are' : ' is'} overloaded (≥30 hours/week). 
                  Consider redistributing classes to maintain teaching quality.
                </p>
              </div>
            </div>
          )}

          {/* Teacher List */}
          {viewMode === 'summary' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Classes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Subjects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Periods/Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Hours/Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Workload
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workloads.map((workload) => (
                      <tr key={workload.teacherId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{workload.teacherName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {workload.classesAssigned.length > 0 
                              ? workload.classesAssigned.join(', ')
                              : 'No classes'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {workload.subjectsTaught.length > 0
                              ? workload.subjectsTaught.join(', ')
                              : 'No subjects'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {workload.totalPeriodsPerWeek}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {workload.totalHoursPerWeek}h
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getWorkloadBarColor(workload.workloadLevel)}`}
                                style={{ width: `${getWorkloadBarWidth(workload.totalHoursPerWeek)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(workload.workloadLevel)}`}>
                            {workload.workloadLevel.charAt(0).toUpperCase() + workload.workloadLevel.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedTeacher(workload.teacherId);
                              setViewMode('detailed');
                            }}
                            className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed View */}
          {viewMode === 'detailed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode('summary')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line"></i>
                  Back to Summary
                </button>
                {selectedWorkload && (
                  <div className="text-sm text-gray-600">
                    Viewing: <span className="font-semibold text-gray-900">{selectedWorkload.teacherName}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Teacher Selection */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Select Teacher</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {workloads.map((workload) => (
                      <button
                        key={workload.teacherId}
                        onClick={() => setSelectedTeacher(workload.teacherId)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedTeacher === workload.teacherId
                            ? 'bg-teal-50 border border-teal-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">{workload.teacherName}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{workload.totalHoursPerWeek}h/week</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teacher Details */}
                {selectedWorkload && (
                  <div className="lg:col-span-2 space-y-4">
                    {/* Overview Card */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedWorkload.teacherName}</h3>
                          <p className="text-sm text-gray-600 mt-1">Workload Overview</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getWorkloadColor(selectedWorkload.workloadLevel)}`}>
                          {selectedWorkload.workloadLevel.charAt(0).toUpperCase() + selectedWorkload.workloadLevel.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Hours/Week</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{selectedWorkload.totalHoursPerWeek}h</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Periods/Week</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{selectedWorkload.totalPeriodsPerWeek}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Classes Assigned</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{selectedWorkload.classesAssigned.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Subjects Taught</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{selectedWorkload.subjectsTaught.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Class & Subject Breakdown */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Class & Subject Breakdown</h4>
                      <div className="space-y-3">
                        {selectedWorkload.details.map((detail, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{detail.className}</div>
                              <div className="text-sm text-gray-600">{detail.subject}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{detail.periodsPerWeek} periods</div>
                              <div className="text-sm text-gray-600">
                                {((detail.periodsPerWeek * 40) / 60).toFixed(1)}h/week
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Classes List */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Classes Assigned</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkload.classesAssigned.map((className) => (
                          <span
                            key={className}
                            className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium"
                          >
                            {className}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Subjects List */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Subjects Taught</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkload.subjectsTaught.map((subject) => (
                          <span
                            key={subject}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}