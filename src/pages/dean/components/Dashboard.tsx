import { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useMarks } from '../../../hooks/useMarks';
import { useRealRiskAlerts } from '../../../hooks/useRealRiskAlerts';
import { supabase } from '../../../lib/supabase';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  // Active teachers count from Supabase
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    setTeacherLoading(true);
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .then(({ count, error }) => {
        if (!error) setTeacherCount(count ?? 0);
        setTeacherLoading(false);
      });
  }, [schoolId]);
  
  // Fetch real data from Supabase
  const { marks: pendingMarks, loading: pendingLoading } = useMarks({
    school_id: schoolId,
    status: 'pending'
  });
  
  const { marks: verifiedMarks, loading: verifiedLoading } = useMarks({
    school_id: schoolId,
    status: 'verified'
  });
  
  const { alerts: riskAlerts, loading: alertsLoading } = useRealRiskAlerts(schoolId);

  // Count only unreviewed (new) alerts
  const newAlertsCount = riskAlerts.filter(a => a.status === 'new').length;
  const highSeverityCount = riskAlerts.filter(a => a.severity === 'high' && a.status === 'new').length;

  // --- Real trend calculations (computed from already-fetched data, no extra DB calls) ---
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Pending: how many new pending marks arrived in the last 7 days
  const pendingThisWeek = pendingMarks.filter(
    m => new Date(m.created_at) >= sevenDaysAgo
  ).length;
  const pendingChange = pendingLoading
    ? '...'
    : pendingThisWeek > 0
    ? `+${pendingThisWeek} this wk`
    : 'none this wk';

  // Verified: count only marks verified this week, compare to previous week
  const verifiedThisWeekCount = verifiedMarks.filter(
    m => new Date(m.created_at) >= sevenDaysAgo
  ).length;
  const verifiedPrevWeekCount = verifiedMarks.filter(m => {
    const d = new Date(m.created_at);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;
  const verifiedDiff = verifiedThisWeekCount - verifiedPrevWeekCount;
  const verifiedChange = verifiedLoading
    ? '...'
    : verifiedDiff > 0
    ? `+${verifiedDiff} vs last wk`
    : verifiedDiff < 0
    ? `${verifiedDiff} vs last wk`
    : '= last wk';

  // Update stats with real data
  const statsCards = [
    {
      label: 'Pending Approvals',
      value: pendingLoading ? '...' : pendingMarks.length.toString(),
      change: pendingChange,
      icon: 'ri-time-line',
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Verified This Week',
      value: verifiedLoading ? '...' : verifiedThisWeekCount.toString(),
      change: verifiedChange,
      icon: 'ri-check-double-line',
      color: 'from-emerald-500 to-green-600',
    },
    {
      label: 'New Risk Alerts',
      value: alertsLoading ? '...' : newAlertsCount.toString(),
      change: alertsLoading ? '...' : highSeverityCount > 0 ? `${highSeverityCount} high` : '0 high',
      icon: 'ri-alert-line',
      color: 'from-red-500 to-pink-600',
      isAlert: true,
      highCount: highSeverityCount,
    },
    {
      label: 'Active Teachers',
      value: teacherLoading ? '...' : (teacherCount ?? 0).toString(),
      change: teacherLoading ? '...' : teacherCount === 0 ? 'none yet' : `in school`,
      icon: 'ri-user-star-line',
      color: 'from-teal-500 to-cyan-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, Dean</h1>
            <p className="text-emerald-50 text-sm md:text-base">Review and approve academic submissions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-emerald-50 mb-1">Pending</div>
              <div className="text-lg font-bold">{pendingLoading ? '...' : pendingMarks.length} Approvals</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-emerald-50 mb-1">Risk Alerts</div>
              <div className="text-lg font-bold">
                {alertsLoading ? '...' : newAlertsCount} New
                {!alertsLoading && highSeverityCount > 0 && (
                  <span className="ml-2 text-xs bg-red-400/80 px-2 py-0.5 rounded-full font-medium">
                    {highSeverityCount} High
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            onClick={stat.isAlert ? () => setActiveTab('risk-alerts') : undefined}
            className={`bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all ${stat.isAlert ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <i className={`${stat.icon} text-2xl text-white w-6 h-6 flex items-center justify-center`}></i>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                stat.isAlert && highSeverityCount > 0
                  ? 'bg-red-100 text-red-700'
                  : stat.change.startsWith('+')
                  ? 'bg-emerald-100 text-emerald-700'
                  : stat.change.startsWith('-')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              {stat.label}
              {stat.isAlert && !alertsLoading && riskAlerts.length > newAlertsCount && (
                <span className="text-xs text-gray-400">({riskAlerts.length} total)</span>
              )}
            </div>
            {stat.isAlert && !alertsLoading && newAlertsCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5">
                {highSeverityCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    {highSeverityCount} High
                  </span>
                )}
                {riskAlerts.filter(a => a.severity === 'medium' && a.status === 'new').length > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {riskAlerts.filter(a => a.severity === 'medium' && a.status === 'new').length} Med
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pending Marks Approvals</h2>
                <p className="text-sm text-gray-600">Review and verify marks submitted by teachers</p>
              </div>
              <button 
                onClick={() => setActiveTab('marks-approval')}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap"
              >
                View All →
              </button>
            </div>
          </div>

          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : pendingMarks.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <i className="ri-checkbox-circle-line text-5xl mb-3"></i>
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No pending marks to approve</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingMarks.slice(0, 3).map((mark) => (
                <div key={mark.id} className="p-5 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                        {mark.teacher_name ? mark.teacher_name.split(' ').map((n: string) => n[0]).join('') : 'T'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{mark.teacher_name || 'Unknown Teacher'}</h3>
                        <p className="text-sm text-gray-600">
                          {mark.subject_name || 'Subject'} • {mark.class_name || 'Class'} • {mark.exam_type || 'Exam'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Pending
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(mark.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setActiveTab('marks-approval')}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Review Marks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Academic Risk Alerts</h2>
                {!alertsLoading && newAlertsCount > 0 && (
                  <p className="text-xs text-red-600 font-medium mt-0.5">
                    {newAlertsCount} unreviewed alert{newAlertsCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('risk-alerts')}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap"
              >
                View All
              </button>
            </div>
          </div>

          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : riskAlerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <i className="ri-shield-check-line text-4xl mb-2"></i>
              <p className="text-sm">No risk alerts</p>
            </div>
          ) : (
            <div className="p-5 md:p-6 space-y-4">
              {riskAlerts.filter(a => a.status === 'new').slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.severity === 'high' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <i className={`ri-alert-line ${alert.severity === 'high' ? 'text-red-600' : 'text-amber-600'} w-4 h-4 flex items-center justify-center`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {alert.alert_type === 'low-performance' ? 'Low Performance' :
                           alert.alert_type === 'consecutive-absences' ? 'Consecutive Absences' :
                           alert.alert_type === 'fees-delay' ? 'Fees Delay' : 'Multiple Failures'}
                        </h4>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{alert.student_name} • {alert.class_name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))}
              {newAlertsCount > 3 && (
                <button
                  onClick={() => setActiveTab('risk-alerts')}
                  className="w-full text-center text-sm text-teal-600 hover:text-teal-700 font-medium py-2 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  +{newAlertsCount - 3} more alerts →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-5 md:p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('marks-approval')}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
          >
            <i className="ri-check-double-line text-3xl mb-2 w-8 h-8 flex items-center justify-center"></i>
            <div className="font-semibold">Approve Marks</div>
            <div className="text-sm text-white/80">{pendingLoading ? '...' : pendingMarks.length} pending</div>
          </button>
          <button 
            onClick={() => setActiveTab('risk-alerts')}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left relative"
          >
            <i className="ri-alert-line text-3xl mb-2 w-8 h-8 flex items-center justify-center"></i>
            <div className="font-semibold">Review Alerts</div>
            <div className="text-sm text-white/80">
              {alertsLoading ? '...' : newAlertsCount} new
              {!alertsLoading && highSeverityCount > 0 && (
                <span className="ml-1 bg-red-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {highSeverityCount}
                </span>
              )}
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('academic')}
            className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
          >
            <i className="ri-bar-chart-line text-3xl mb-2 w-8 h-8 flex items-center justify-center"></i>
            <div className="font-semibold">View Reports</div>
            <div className="text-sm text-white/80">Performance</div>
          </button>
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left">
            <i className="ri-mail-send-line text-3xl mb-2 w-8 h-8 flex items-center justify-center"></i>
            <div className="font-semibold">Send Notice</div>
            <div className="text-sm text-white/80">To teachers</div>
          </button>
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