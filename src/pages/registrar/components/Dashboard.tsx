import { useState } from 'react';
import { useTenant } from '../../../contexts/TenantContext';
import { useRegistrarStats, RegistrarTask } from '../../../hooks/useRegistrarStats';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [timeRange, setTimeRange] = useState('today');
  const { schoolId } = useTenant();
  const { stats, loading, error } = useRegistrarStats(schoolId);

  // Local dismissal state — lets registrar tick off tasks during their session
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dismiss = (id: string) => setDismissedIds(prev => new Set([...prev, id]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  const statsCards = [
    { 
      label: 'Total Students', 
      value: stats?.totalStudents.toString() || '0', 
      change: `+${stats?.newEnrollments || 0}`, 
      changeType: 'positive',
      icon: 'ri-user-line', 
      color: 'from-teal-500 to-emerald-600' 
    },
    { 
      label: 'New Enrollments', 
      value: stats?.newEnrollments.toString() || '0', 
      change: 'This week', 
      changeType: 'neutral',
      icon: 'ri-user-add-line', 
      color: 'from-amber-500 to-orange-600' 
    },
    { 
      label: 'Active Teachers', 
      value: stats?.activeTeachers.toString() || '0', 
      change: 'Active', 
      changeType: 'positive',
      icon: 'ri-user-star-line', 
      color: 'from-blue-500 to-cyan-600' 
    },
    { 
      label: 'Documents Pending', 
      value: stats?.pendingDocuments.toString() || '0', 
      change: 'To review', 
      changeType: 'neutral',
      icon: 'ri-file-warning-line', 
      color: 'from-purple-500 to-pink-600' 
    },
  ];

  const quickActions = [
    { icon: 'ri-user-add-line', label: 'New Registration', color: 'bg-teal-100 text-teal-600', tab: 'registration' },
    { icon: 'ri-group-line', label: 'Bulk Enrollment', color: 'bg-blue-100 text-blue-600', tab: 'enrollment' },
    { icon: 'ri-file-upload-line', label: 'Upload Documents', color: 'bg-amber-100 text-amber-600', tab: 'documents' },
    { icon: 'ri-printer-line', label: 'Print Reports', color: 'bg-purple-100 text-purple-600', tab: 'documents' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, Registrar</h1>
            <p className="text-teal-50 text-sm md:text-base">Manage student registrations and enrollments</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">New This Week</div>
              <div className="text-lg font-bold">{stats?.newEnrollments || 0} Students</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Total</div>
              <div className="text-lg font-bold">{stats?.totalStudents || 0} Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Overview</h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg overflow-x-auto">
          {['today', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <i className={`${stat.icon} text-2xl text-white`}></i>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 
                stat.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Registrations */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Registrations</h3>
            <button className="text-teal-600 text-sm font-medium hover:underline whitespace-nowrap">
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.recentRegistrations && stats.recentRegistrations.length > 0 ? (
              stats.recentRegistrations.map((item, index) => (
                <div key={index} className="p-5 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {item.student.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.student}</div>
                        <div className="text-sm text-gray-600">Grade {item.grade} • {item.parent}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${item.statusColor}`}>
                        {item.status}
                      </span>
                      <div className="text-xs text-gray-500">{item.date}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <i className="ri-user-add-line text-4xl mb-2"></i>
                <p>No recent registrations</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-5 md:p-6 space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(action.tab)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all text-left cursor-pointer"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <i className={`${action.icon} text-lg`}></i>
                </div>
                <span className="font-medium text-gray-900">{action.label}</span>
                <i className="ri-arrow-right-line ml-auto text-gray-400"></i>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Enrollment by Grade */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Enrollment Progress by Grade</h3>
          </div>
          <div className="p-5 md:p-6 space-y-5">
            {stats?.enrollmentByGrade && stats.enrollmentByGrade.length > 0 ? (
              stats.enrollmentByGrade.map((item, index) => {
                const percentage = Math.round((item.enrolled / item.target) * 100);
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 w-10">{item.grade}</span>
                        <span className="text-sm text-gray-600">{item.enrolled} / {item.target} students</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        percentage >= 90 ? 'text-green-600' : 
                        percentage >= 70 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          percentage >= 90 ? 'bg-green-500' : 
                          percentage >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {item.pending > 0 && (
                      <div className="text-xs text-amber-600 mt-1">{item.pending} pending approval</div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                <i className="ri-bar-chart-line text-4xl mb-2"></i>
                <p>No enrollment data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks → now "Action Required" from real DB */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">Action Required</h3>
              {stats?.pendingTasks && stats.pendingTasks.filter(t => !dismissedIds.has(t.id)).length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {stats.pendingTasks.filter(t => !dismissedIds.has(t.id)).length}
                </span>
              )}
            </div>
            <button
              onClick={() => setDismissedIds(new Set())}
              className="text-teal-600 text-sm font-medium hover:underline whitespace-nowrap cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {/* All-clear state */}
          {(!stats?.pendingTasks || stats.pendingTasks.filter(t => !dismissedIds.has(t.id)).length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-50 mb-4">
                <i className="ri-checkbox-circle-line text-3xl text-green-500" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No pending actions at the moment</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats!.pendingTasks
                .filter(t => !dismissedIds.has(t.id))
                .map((task: RegistrarTask) => (
                  <div key={task.id} className="p-4 md:p-5 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start gap-3">
                      {/* Dismiss checkbox */}
                      <button
                        onClick={() => dismiss(task.id)}
                        className="w-5 h-5 rounded border-2 border-gray-300 mt-0.5 cursor-pointer hover:border-teal-500 hover:bg-teal-50 flex-shrink-0 transition-colors"
                        title="Mark as done"
                      />

                      {/* Icon */}
                      <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${
                        task.priority === 'High' ? 'bg-red-50 text-red-500' :
                        task.priority === 'Medium' ? 'bg-amber-50 text-amber-500' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        <i className={`${task.icon} text-base`} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{task.task}</p>
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap flex-shrink-0 ${task.priorityColor}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}