import { useAccountantStats } from '../../../hooks/useAccountantStats';
import { useFeePayments } from '../../../hooks/useFeePayments';
import { useTenant } from '../../../contexts/TenantContext';

export default function Dashboard() {
  const { schoolId } = useTenant();
  const { 
    totalFeesCollected, 
    outstandingFees, 
    monthlyRevenue, 
    lockedReportCards,
    loading: statsLoading 
  } = useAccountantStats(schoolId);

  const { payments, loading: paymentsLoading } = useFeePayments(schoolId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const kpiCards = [
    {
      label: 'Total Fees Collected',
      value: statsLoading ? 'Loading...' : formatCurrency(totalFeesCollected),
      change: '+12.5%',
      trend: 'up',
      icon: 'ri-money-dollar-circle-line',
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Outstanding Fees',
      value: statsLoading ? 'Loading...' : formatCurrency(outstandingFees),
      change: '-5.2%',
      trend: 'down',
      icon: 'ri-error-warning-line',
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
    },
    {
      label: 'Monthly Revenue',
      value: statsLoading ? 'Loading...' : formatCurrency(monthlyRevenue),
      change: '+8.3%',
      trend: 'up',
      icon: 'ri-line-chart-line',
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Locked Report Cards',
      value: statsLoading ? '...' : lockedReportCards.toString(),
      change: `${lockedReportCards} students`,
      trend: 'neutral',
      icon: 'ri-lock-line',
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50',
    },
  ];

  const recentTransactions = payments.slice(0, 5);

  const quickActions = [
    { label: 'Record Payment', icon: 'ri-add-circle-line', color: 'from-emerald-500 to-teal-600' },
    { label: 'Generate Report', icon: 'ri-file-chart-line', color: 'from-amber-500 to-orange-600' },
    { label: 'Process Payroll', icon: 'ri-wallet-3-line', color: 'from-violet-500 to-purple-600' },
    { label: 'Manage Stock', icon: 'ri-archive-line', color: 'from-sky-500 to-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, Accountant</h1>
            <p className="text-emerald-50 text-sm md:text-base">Manage finances and track school revenue</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-emerald-50 mb-1">Collected</div>
              <div className="text-lg font-bold">
                {statsLoading ? '...' : `${(totalFeesCollected / 1000000).toFixed(1)}M RWF`}
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-emerald-50 mb-1">Outstanding</div>
              <div className="text-lg font-bold">
                {statsLoading ? '...' : `${(outstandingFees / 1000000).toFixed(1)}M RWF`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpiCards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                <i className={`${card.icon} text-white text-lg`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                  card.trend === 'up'
                    ? 'bg-emerald-50 text-emerald-600'
                    : card.trend === 'down'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {card.trend === 'up' && <i className="ri-arrow-up-line" />}
                {card.trend === 'down' && <i className="ri-arrow-down-line" />}
                {card.change}
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
            <div className="text-xs text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                <i className={`${action.icon} text-white text-xl`} />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          <button className="text-sm text-emerald-600 hover:underline font-medium cursor-pointer whitespace-nowrap">
            View all
          </button>
        </div>
        
        {paymentsLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-3">Loading transactions...</p>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <i className="ri-file-list-3-line text-4xl text-gray-300 mb-3"></i>
            <p className="text-sm text-gray-500">No transactions recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-xs font-medium text-gray-900">{txn.reference_number}</td>
                    <td className="px-5 py-4 text-xs text-gray-700">{txn.student_name}</td>
                    <td className="px-5 py-4 text-xs text-gray-600">{txn.class_name}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-900">{formatCurrency(txn.amount)}</td>
                    <td className="px-5 py-4 text-xs text-gray-600 capitalize">{txn.payment_method}</td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      {new Date(txn.payment_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          txn.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : txn.status === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        <i
                          className={
                            txn.status === 'completed' 
                              ? 'ri-checkbox-circle-fill' 
                              : txn.status === 'pending'
                              ? 'ri-time-line'
                              : 'ri-close-circle-fill'
                          }
                        />
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <i className="ri-more-2-fill text-gray-400 text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}