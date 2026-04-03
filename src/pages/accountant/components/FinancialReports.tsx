import { useState } from 'react';
import { useFinancialReports } from '../../../hooks/useFinancialReports';
import { useTenant } from '../../../contexts/TenantContext';

export default function FinancialReports() {
  const { schoolId } = useTenant();
  const { classFeeReport, monthlyRevenue, loading, error } = useFinancialReports(schoolId);
  const [selectedClass, setSelectedClass] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (monthNum: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1] || '';
  };

  const handleExportCSV = () => {
    // Prepare CSV content
    const headers = ['Class', 'Students', 'Total Fees', 'Collected', 'Outstanding', 'Collection Rate'];
    const rows = filteredClassReport.map(item => [
      item.class_name,
      item.student_count.toString(),
      item.total_fees.toString(),
      item.collected.toString(),
      item.outstanding.toString(),
      `${item.collection_rate}%`
    ]);

    // Add summary row
    const totalFees = filteredClassReport.reduce((sum, item) => sum + item.total_fees, 0);
    const totalCollected = filteredClassReport.reduce((sum, item) => sum + item.collected, 0);
    const totalOutstanding = filteredClassReport.reduce((sum, item) => sum + item.outstanding, 0);
    const totalStudents = filteredClassReport.reduce((sum, item) => sum + item.student_count, 0);
    const overallRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

    rows.push([
      'TOTAL',
      totalStudents.toString(),
      totalFees.toString(),
      totalCollected.toString(),
      totalOutstanding.toString(),
      `${overallRate}%`
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportMenu(false);
  };

  // Filter class fee report based on selection
  const filteredClassReport = selectedClass === 'all' 
    ? classFeeReport 
    : classFeeReport.filter(item => {
        if (selectedClass === 'primary') return item.class_name.toLowerCase().includes('primary');
        if (selectedClass === 'secondary') return item.class_name.toLowerCase().includes('secondary') || item.class_name.toLowerCase().startsWith('s');
        return true;
      });

  // Calculate totals for summary cards
  const totalCollected = classFeeReport.reduce((sum, item) => sum + item.collected, 0);
  const totalOutstanding = classFeeReport.reduce((sum, item) => sum + item.outstanding, 0);
  const totalFees = classFeeReport.reduce((sum, item) => sum + item.total_fees, 0);
  const overallCollectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
          <p className="text-sm text-slate-600 mt-1">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-download-line"></i>
              Export Report
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <i className="ri-file-text-line text-teal-600"></i>
                  Export as CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 mt-3">Loading financial reports...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <i className="ri-error-warning-line text-4xl text-red-400 mb-3"></i>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Total Fees</span>
                <i className="ri-money-dollar-circle-line text-2xl text-slate-400"></i>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalFees)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Collected Fees</span>
                <i className="ri-check-double-line text-2xl text-teal-400"></i>
              </div>
              <p className="text-2xl font-bold text-teal-600">{formatCurrency(totalCollected)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Outstanding Balance</span>
                <i className="ri-alert-line text-2xl text-red-400"></i>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Collection Rate</span>
                <i className="ri-percent-line text-2xl text-slate-400"></i>
              </div>
              <p className="text-2xl font-bold text-slate-800">{overallCollectionRate}%</p>
            </div>
          </div>

          {/* Fee Collection Report */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <i className="ri-money-dollar-circle-line text-teal-600"></i>
                Collected Fees by Class
              </h2>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Classes</option>
                <option value="primary">Primary Only</option>
                <option value="secondary">Secondary Only</option>
              </select>
            </div>

            {filteredClassReport.length === 0 ? (
              <div className="p-12 text-center">
                <i className="ri-file-list-3-line text-4xl text-slate-300 mb-3"></i>
                <p className="text-sm text-slate-500">No fee collection data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total Fees</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Collected</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Outstanding</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredClassReport.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.class_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.student_count}</td>
                        <td className="px-6 py-4 text-sm text-slate-800">{formatCurrency(item.total_fees)}</td>
                        <td className="px-6 py-4 text-sm text-teal-600 font-medium">{formatCurrency(item.collected)}</td>
                        <td className="px-6 py-4 text-sm text-red-600 font-medium">{formatCurrency(item.outstanding)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-teal-600 h-2 rounded-full"
                                style={{ width: `${item.collection_rate}%` }}
                              ></div>
                            </div>
                            <span className="font-medium text-slate-800">{item.collection_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Outstanding Balances by Class */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <i className="ri-alert-line text-red-600"></i>
                Outstanding Balances by Class
              </h2>
            </div>

            {filteredClassReport.length === 0 ? (
              <div className="p-12 text-center">
                <i className="ri-file-list-3-line text-4xl text-slate-300 mb-3"></i>
                <p className="text-sm text-slate-500">No outstanding balance data available</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {filteredClassReport
                    .filter(item => item.outstanding > 0)
                    .sort((a, b) => b.outstanding - a.outstanding)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{item.class_name}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.student_count} students</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{formatCurrency(item.outstanding)}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatCurrency(item.collected)} collected of {formatCurrency(item.total_fees)}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {filteredClassReport.filter(item => item.outstanding > 0).length === 0 && (
                    <div className="text-center py-8">
                      <i className="ri-check-double-line text-4xl text-teal-400 mb-3"></i>
                      <p className="text-sm text-slate-500">All fees have been collected!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <i className="ri-line-chart-line text-teal-600"></i>
                Monthly Revenue Trend (Last 6 Months)
              </h2>
            </div>

            {monthlyRevenue.length === 0 ? (
              <div className="p-12 text-center">
                <i className="ri-bar-chart-line text-4xl text-slate-300 mb-3"></i>
                <p className="text-sm text-slate-500">No revenue data available for the last 6 months</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-6 gap-4">
                  {monthlyRevenue.map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-teal-50 rounded-lg p-4 mb-2">
                        <div className="text-xs font-medium text-teal-700 mb-1">
                          {getMonthName(item.month_num)} {item.year}
                        </div>
                        <div className="text-lg font-bold text-teal-600">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Total Revenue (6 months)</span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatCurrency(monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}