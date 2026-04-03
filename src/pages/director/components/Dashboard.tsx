import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSchoolStats } from '../../../hooks/useSchoolStats';
import { useTerms } from '../../../hooks/useTerms';
import { useMarks } from '../../../hooks/useMarks';
import { useClassPerformance } from '../../../hooks/useClassPerformance';
import { useRiskAlerts } from '../../../hooks/useRiskAlerts';
import { useDirectorActivities } from '../../../hooks/useDirectorActivities';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [timeRange, setTimeRange] = useState('today');
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const { stats, loading: statsLoading } = useSchoolStats(schoolId);
  const { terms, activeTerm } = useTerms(schoolId);
  const { marks: pendingMarks, loading: marksLoading } = useMarks({
    schoolId: schoolId,
    status: 'pending'
  });
  const { classPerformance, loading: perfLoading } = useClassPerformance(schoolId, activeTerm?.id);
  const { alerts: riskAlerts, loading: alertsLoading } = useRiskAlerts(schoolId);
  const { activities: recentActivities, loading: activitiesLoading } = useDirectorActivities(schoolId);

  const openTermsCount = terms.filter(t => t.status === 'open').length;

  const statsCards = [
    { 
      label: 'Total Classes', 
      value: statsLoading ? '...' : (stats?.totalClasses?.toString() || '0'), 
      change: 'Active', 
      changeType: 'positive' as const,
      icon: 'ri-school-line', 
      color: 'from-teal-500 to-emerald-600' 
    },
    { 
      label: 'Total Students', 
      value: statsLoading ? '...' : stats?.totalStudents?.toString() || '0', 
      change: '+156', 
      changeType: 'positive' as const,
      icon: 'ri-user-line', 
      color: 'from-blue-500 to-cyan-600' 
    },
    { 
      label: 'Pending Approvals', 
      value: marksLoading ? '...' : pendingMarks.length.toString(), 
      change: '-3', 
      changeType: 'positive' as const,
      icon: 'ri-file-list-line', 
      color: 'from-amber-500 to-orange-600' 
    },
    { 
      label: 'Open Terms', 
      value: `${openTermsCount}`, 
      change: 'Active', 
      changeType: 'neutral' as const,
      icon: 'ri-calendar-check-line', 
      color: 'from-purple-500 to-purple-600' 
    },
  ];

  const quickActions = [
    { icon: 'ri-user-add-line', label: 'Add Student', color: 'bg-teal-100 text-teal-600', tab: 'school-management' },
    { icon: 'ri-user-star-line', label: 'Add Teacher', color: 'bg-blue-100 text-blue-600', tab: 'school-management' },
    { icon: 'ri-bar-chart-line', label: 'View Reports', color: 'bg-amber-100 text-amber-600', tab: 'analytics' },
    { icon: 'ri-mail-send-line', label: 'Send Message', color: 'bg-purple-100 text-purple-600', tab: 'messages' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, Director</h1>
            <p className="text-teal-50 text-sm md:text-base">Manage all schools and oversee academic operations</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Today's Date</div>
              <div className="text-lg font-bold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Alerts</div>
              <div className="text-lg font-bold">{alertsLoading ? '...' : riskAlerts.length} New</div>
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
          <div 
            key={index} 
            className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
          >
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
        {/* Class Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Class Performance Overview</h3>
          </div>
          <div className="p-5 md:p-6">
            {perfLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : classPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="ri-bar-chart-line text-4xl mb-2"></i>
                <p>No performance data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classPerformance.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-16 font-semibold text-gray-900">{item.class_name}</div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            item.average_score >= 80 ? 'bg-green-500' : 
                            item.average_score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.average_score}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-16 text-right">
                        <span className={`font-bold ${
                          item.average_score >= 80 ? 'text-green-600' : 
                          item.average_score >= 70 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {item.average_score}%
                        </span>
                      </div>
                      <div className="w-24 text-right text-sm text-gray-600">{item.student_count} students</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-5 md:p-6 grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(action.tab)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50 transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <i className={`${action.icon} text-lg`}></i>
                </div>
                <span className="font-medium text-gray-900 text-xs text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Recent Risk Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Risk Alerts</h3>
            <button onClick={() => setActiveTab('risk-alerts')} className="text-teal-600 text-sm font-medium hover:underline whitespace-nowrap cursor-pointer">
              View All
            </button>
          </div>
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : riskAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="ri-shield-check-line text-4xl mb-2"></i>
              <p>No risk alerts at this time</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {riskAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="p-5 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.severity === 'high' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <i className={`ri-alert-line ${
                        alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{alert.student_name}</span>
                        <span className="text-sm text-gray-500">({alert.class_name})</span>
                      </div>
                      <div className={`text-sm font-medium mb-1 ${
                        alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {alert.type === 'low_performance' ? 'Low Academic Performance' : 
                         alert.type === 'attendance' ? 'Attendance Issue' : 'School Fees Delay'}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{alert.description}</div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-gray-500">{formatTimeAgo(alert.created_at)}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                          alert.status === 'new' ? 'bg-red-100 text-red-700' :
                          alert.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Activities</h3>
            <button onClick={() => setActiveTab('analytics')} className="text-teal-600 text-sm font-medium hover:underline whitespace-nowrap cursor-pointer">
              View All
            </button>
          </div>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="ri-history-line text-4xl mb-2"></i>
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivities.map((activity, index) => (
                <div key={index} className="p-4 md:p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <i className={`${activity.icon} text-lg`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}