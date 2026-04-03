import { useSuperAdminAnalytics } from '../../../hooks/useSuperAdminAnalytics';

export default function Analytics() {
  const {
    revenueData,
    subscriptionDistribution,
    studentGrowth,
    activeUsersData,
    schoolMetrics,
    summary,
    loading,
    error,
    refresh,
  } = useSuperAdminAnalytics();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);
  const maxStudents = Math.max(...studentGrowth.map((d) => d.students), 1);
  const maxUsers = Math.max(...activeUsersData.map((d) => d.users), 1);

  const planColors: Record<string, string> = {
    enterprise: 'from-violet-500 to-violet-600',
    professional: 'from-teal-500 to-teal-600',
    premium: 'from-amber-500 to-amber-600',
    basic: 'from-sky-400 to-sky-500',
    free: 'from-gray-400 to-gray-500',
  };

  const planDotColors: Record<string, string> = {
    enterprise: 'bg-violet-500',
    professional: 'bg-teal-500',
    premium: 'bg-amber-500',
    basic: 'bg-sky-400',
    free: 'bg-gray-400',
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'trial': return 'bg-amber-100 text-amber-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <i className="ri-error-warning-line text-2xl text-red-500"></i>
          </div>
          <p className="text-sm text-gray-700 font-medium">Failed to load analytics</p>
          <p className="text-xs text-gray-500 max-w-xs">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time platform-wide metrics</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap shadow-sm"
        >
          <i className="ri-refresh-line"></i>
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-xl text-teal-600"></i>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${summary.revenueGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {summary.revenueGrowth >= 0 ? '+' : ''}{summary.revenueGrowth}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
        </div>

        {/* Total Enrollments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <i className="ri-user-add-line text-xl text-emerald-600"></i>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${summary.enrollmentGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {summary.enrollmentGrowth >= 0 ? '+' : ''}{summary.enrollmentGrowth}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalEnrollments.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Active Students</p>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <i className="ri-group-line text-xl text-amber-600"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.activeUsers.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Active Users</p>
        </div>

        {/* Avg Students / School */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <i className="ri-building-line text-xl text-rose-500"></i>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.avgStudentsPerSchool}</p>
          <p className="text-xs text-gray-500 mt-1">Avg Students / School</p>
        </div>
      </div>

      {/* Revenue + Student Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">School subscription payments — last 6 months</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-teal-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Revenue</span>
            </div>
          </div>
          {revenueData.every((d) => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <i className="ri-bar-chart-line text-4xl text-gray-200 mb-2"></i>
              <p className="text-sm text-gray-400">No payment records found yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueData.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 w-8">{item.month}</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Enrollment Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Student Enrollment</h2>
              <p className="text-xs text-gray-500 mt-0.5">Cumulative active students — last 6 months</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Students</span>
            </div>
          </div>
          {studentGrowth.every((d) => d.students === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <i className="ri-user-line text-4xl text-gray-200 mb-2"></i>
              <p className="text-sm text-gray-400">No enrollment data found yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studentGrowth.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 w-8">{item.month}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.students.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${(item.students / maxStudents) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subscription Distribution + Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Subscription Distribution</h2>
          {subscriptionDistribution.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <i className="ri-pie-chart-line text-4xl text-gray-200 mb-2"></i>
              <p className="text-sm text-gray-400">No subscription data available</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-5">
                {subscriptionDistribution.map((item) => {
                  const total = subscriptionDistribution.reduce((s, d) => s + d.count, 0);
                  const pct = ((item.count / total) * 100).toFixed(1);
                  const key = item.plan.toLowerCase();
                  const color = planColors[key] || 'from-gray-400 to-gray-500';
                  return (
                    <div key={item.plan}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${planDotColors[key] || 'bg-gray-400'}`}></div>
                          <span className="text-xs font-medium text-gray-700 capitalize">{item.plan}</span>
                        </div>
                        <span className="text-xs text-gray-500">{item.count} school{item.count !== 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${color} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend pills */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                {subscriptionDistribution.map((item) => {
                  const key = item.plan.toLowerCase();
                  return (
                    <span key={item.plan} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full text-xs text-gray-600 capitalize">
                      <span className={`w-2 h-2 rounded-full ${planDotColors[key] || 'bg-gray-400'}`}></span>
                      {item.plan}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Active Users Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Active Users</h2>
              <p className="text-xs text-gray-500 mt-0.5">Cumulative active platform users — last 6 months</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Users</span>
            </div>
          </div>
          {activeUsersData.every((d) => d.users === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <i className="ri-group-line text-4xl text-gray-200 mb-2"></i>
              <p className="text-sm text-gray-400">No user data found yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeUsersData.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600 w-8">{item.month}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.users.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${(item.users / maxUsers) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-School Metrics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Per-School Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enrollment, staff, and billing per school</p>
          </div>
          <span className="text-xs text-gray-400">{schoolMetrics.length} school{schoolMetrics.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schoolMetrics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <i className="ri-building-line text-4xl text-gray-200"></i>
                      <p className="text-sm text-gray-400">No schools found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                schoolMetrics.map((school) => {
                  const key = school.plan.toLowerCase();
                  return (
                    <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {school.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{school.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          key === 'enterprise' ? 'bg-violet-100 text-violet-700' :
                          key === 'premium' ? 'bg-amber-100 text-amber-700' :
                          key === 'professional' ? 'bg-teal-100 text-teal-700' :
                          key === 'basic' ? 'bg-sky-100 text-sky-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {school.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(school.status)}`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {school.studentCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                        {school.staffCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-teal-700">
                        {formatCurrency(school.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {school.billingCycle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(school.expiryDate)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
