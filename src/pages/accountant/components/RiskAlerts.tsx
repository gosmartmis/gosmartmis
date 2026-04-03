import { useState } from 'react';
import { useTenant } from '../../../contexts/TenantContext';
import { useRealRiskAlerts } from '../../../hooks/useRealRiskAlerts';
import type { RiskAlert } from '../../../types/risk-alert';

export default function RiskAlerts() {
  const { schoolId } = useTenant();
  const { alerts: allAlerts, loading, error, updateAlertStatus } = useRealRiskAlerts(schoolId);
  
  // Accountant only sees fees-delay alerts
  const feesAlerts = allAlerts.filter(alert => alert.alert_type === 'fees-delay');
  
  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Filter alerts
  const filteredAlerts = feesAlerts.filter(alert => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.student_name?.toLowerCase().includes(query) ||
        alert.class_name?.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate statistics
  const stats = {
    total: feesAlerts.length,
    new: feesAlerts.filter(a => a.status === 'new').length,
    reviewed: feesAlerts.filter(a => a.status === 'reviewed').length,
    resolved: feesAlerts.filter(a => a.status === 'resolved').length
  };

  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-orange-100 text-orange-700 border-orange-200',
      low: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      new: 'bg-red-100 text-red-700',
      reviewed: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleViewDetails = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setActionNotes('');
    setShowDetailModal(true);
  };

  const handleMarkAsResolved = () => {
    if (!selectedAlert) return;
    
    updateAlertStatus(
      selectedAlert.id,
      'resolved',
      'Accountant',
      actionNotes || undefined
    );
    
    setShowDetailModal(false);
    setSelectedAlert(null);
  };

  const handleExportReport = () => {
    // Generate CSV export
    const headers = ['Student Name', 'Class', 'Days Overdue', 'Severity', 'Status', 'Description'];
    const rows = feesAlerts.map(alert => [
      alert.student_name || '',
      alert.class_name || '',
      alert.metadata?.days_overdue?.toString() || '0',
      alert.severity,
      alert.status,
      alert.description
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fees-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 mt-4">Loading fees alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="ri-error-warning-line text-xl text-red-600 mt-0.5"></i>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Error Loading Alerts</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Fees Alerts</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor overdue school fees payments</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <i className="ri-download-line"></i>
          Export Report
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-gray-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New Alerts</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.new}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-notification-badge-line text-2xl text-red-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.reviewed}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-eye-line text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or class..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Days Overdue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                    {searchQuery ? 'No matching fees alerts found' : 'No fees alerts at this time'}
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{alert.student_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{alert.class_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{alert.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{alert.metadata?.days_overdue || 0} days</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(alert)}
                        className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap"
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
      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Fees Alert Details</h2>
                  <p className="text-sm text-gray-600 mt-1">Review and update payment status</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Alert Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-2xl text-red-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">School Fees Delay</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedAlert.severity)}`}>
                      {selectedAlert.severity.toUpperCase()} SEVERITY
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAlert.status)}`}>
                      {selectedAlert.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{selectedAlert.description}</p>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Student</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAlert.student_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Class</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAlert.class_name}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment Information</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">Days Overdue: <strong>{selectedAlert.metadata?.days_overdue || 0} days</strong></p>
                  <p className="text-sm text-gray-700">Alert Triggered: <strong>{new Date(selectedAlert.triggered_at).toLocaleDateString()}</strong></p>
                </div>
              </div>

              {/* Existing Notes */}
              {selectedAlert.notes && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Notes</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{selectedAlert.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Notes */}
              {selectedAlert.status !== 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add notes about payment received or follow-up actions..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{actionNotes.length}/500 characters</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedAlert.status !== 'resolved' && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsResolved}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Mark as Paid
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}