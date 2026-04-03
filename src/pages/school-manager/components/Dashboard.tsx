import { useTenant } from '../../../contexts/TenantContext';
import { useAuth } from '../../../hooks/useAuth';
import { useRealRiskAlerts } from '../../../hooks/useRealRiskAlerts';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  'low-performance': 'Low Performance',
  'consecutive-absences': 'Consecutive Absences',
  'fees-delay': 'Fees Delay',
  'high-failure-rate': 'High Failure Rate',
  'invalid-marks': 'Invalid Marks',
};

const ALERT_TYPE_ICONS: Record<string, string> = {
  'low-performance': 'ri-line-chart-line',
  'consecutive-absences': 'ri-calendar-close-line',
  'fees-delay': 'ri-money-dollar-circle-line',
  'high-failure-rate': 'ri-error-warning-line',
  'invalid-marks': 'ri-alert-line',
};

export default function Dashboard({ onTabChange }: DashboardProps) {
  const { schoolInfo } = useTenant();
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const { alerts, loading: alertsLoading } = useRealRiskAlerts(schoolId);

  // Top 3 most critical alerts for dashboard preview
  const recentAlerts = alerts.slice(0, 3);

  const stats = [
    {
      label: 'Total Students',
      value: '1,247',
      icon: 'ri-user-line',
      color: 'from-blue-500 to-cyan-600',
      change: '+12%',
    },
    {
      label: 'Total Teachers',
      value: '87',
      icon: 'ri-user-star-line',
      color: 'from-purple-500 to-pink-600',
      change: '+5%',
    },
    {
      label: 'Active Classes',
      value: '42',
      icon: 'ri-door-open-line',
      color: 'from-teal-500 to-emerald-600',
      change: '+3',
    },
    {
      label: 'Pending Approvals',
      value: '8',
      icon: 'ri-time-line',
      color: 'from-orange-500 to-amber-600',
      change: '-2',
      clickable: true,
      onClick: () => onTabChange('final-approval'),
    },
  ];

  const quickActions = [
    {
      label: 'Create Academic Year',
      icon: 'ri-calendar-event-line',
      color: 'bg-blue-500',
      onClick: () => onTabChange('academic-management'),
    },
    {
      label: 'Manage Terms',
      icon: 'ri-calendar-check-line',
      color: 'bg-purple-500',
      onClick: () => onTabChange('term-management'),
    },
    {
      label: 'Approve Marks',
      icon: 'ri-checkbox-circle-line',
      color: 'bg-teal-500',
      onClick: () => onTabChange('final-approval'),
    },
    {
      label: 'Generate Report Cards',
      icon: 'ri-file-text-line',
      color: 'bg-orange-500',
      onClick: () => onTabChange('report-cards'),
    },
    {
      label: 'Monitor Messages',
      icon: 'ri-message-3-line',
      color: 'bg-pink-500',
      onClick: () => onTabChange('messages-monitoring'),
    },
    {
      label: 'Student Promotion',
      icon: 'ri-arrow-up-circle-line',
      color: 'bg-green-500',
      onClick: () => onTabChange('student-promotion'),
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, School Manager</h1>
            <p className="text-teal-50 text-sm md:text-base">Manage all school operations and academic activities</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Students</div>
              <div className="text-lg font-bold">1,247</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Pending</div>
              <div className="text-lg font-bold">8 Tasks</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.clickable ? stat.onClick : undefined}
            className={`bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all ${
              stat.clickable ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <i className={`${stat.icon} text-2xl text-white`}></i>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  stat.change.startsWith('+')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center gap-3 p-5 md:p-6 rounded-xl border-2 border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-all group"
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}
              >
                <i className={`${action.icon} text-xl md:text-2xl text-white`}></i>
              </div>
              <span className="text-xs md:text-sm font-semibold text-gray-900 text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent Risk Alerts</h3>
          <button
            onClick={() => onTabChange('risk-alerts')}
            className="text-sm text-teal-600 hover:text-teal-700 font-semibold whitespace-nowrap cursor-pointer"
          >
            View All →
          </button>
        </div>

        {alertsLoading ? (
          <div className="flex items-center justify-center py-10 gap-3">
            <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Analysing student data…</p>
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-shield-check-line text-2xl text-green-600"></i>
            </div>
            <p className="text-sm font-semibold text-gray-900">All clear!</p>
            <p className="text-xs text-gray-500">No risk alerts detected right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer"
                onClick={() => onTabChange('risk-alerts')}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.severity === 'high'
                      ? 'bg-red-100'
                      : alert.severity === 'medium'
                      ? 'bg-orange-100'
                      : 'bg-yellow-100'
                  }`}
                >
                  <i
                    className={`${ALERT_TYPE_ICONS[alert.alert_type] ?? 'ri-alert-line'} text-xl ${
                      alert.severity === 'high'
                        ? 'text-red-600'
                        : alert.severity === 'medium'
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                    }`}
                  ></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
                    </h4>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap self-start ${
                        alert.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : alert.severity === 'medium'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1 line-clamp-2">{alert.description}</p>
                  <p className="text-xs text-gray-400">
                    {alert.class_name} · {new Date(alert.triggered_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}