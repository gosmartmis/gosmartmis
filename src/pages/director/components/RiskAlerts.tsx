import { useState } from 'react';
import type { RiskAlert, AlertStatus, AlertSeverity, AlertType } from '../../../types/risk-alert';
import { useRealRiskAlerts } from '../../../hooks/useRealRiskAlerts';
import { useAuth } from '../../../hooks/useAuth';

export default function RiskAlerts() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const { alerts: rawAlerts, loading, error, refetch, updateAlertStatus } = useRealRiskAlerts(schoolId);

  const [localAlerts, setLocalAlerts] = useState<RiskAlert[]>([]);
  const [synced, setSynced] = useState(false);

  if (!synced && rawAlerts.length > 0) {
    setLocalAlerts(rawAlerts);
    setSynced(true);
  }

  const displayAlerts = synced ? localAlerts : rawAlerts;

  const [selectedAlert, setSelectedAlert] = useState<RiskAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const filteredAlerts = displayAlerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'all' && alert.alert_type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.student_name?.toLowerCase().includes(query) ||
        alert.class_name?.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.subject?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: displayAlerts.length,
    new: displayAlerts.filter(a => a.status === 'new').length,
    reviewed: displayAlerts.filter(a => a.status === 'reviewed').length,
    resolved: displayAlerts.filter(a => a.status === 'resolved').length,
    high: displayAlerts.filter(a => a.severity === 'high').length,
    medium: displayAlerts.filter(a => a.severity === 'medium').length,
    low: displayAlerts.filter(a => a.severity === 'low').length,
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    const labels: Record<AlertType, string> = {
      'low-performance': 'Low Academic Performance',
      'consecutive-absences': 'Consecutive Absences',
      'fees-delay': 'School Fees Delay',
      'high-failure-rate': 'High Failure Rate',
      'invalid-marks': 'Invalid Marks Entry',
    };
    return labels[type];
  };

  const getAlertTypeIcon = (type: AlertType): string => {
    const icons: Record<AlertType, string> = {
      'low-performance': 'ri-line-chart-line',
      'consecutive-absences': 'ri-calendar-close-line',
      'fees-delay': 'ri-money-dollar-circle-line',
      'high-failure-rate': 'ri-error-warning-line',
      'invalid-marks': 'ri-alert-line',
    };
    return icons[type];
  };

  const getSeverityColor = (severity: AlertSeverity): string => {
    const colors: Record<AlertSeverity, string> = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-orange-100 text-orange-700 border-orange-200',
      low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return colors[severity];
  };

  const getStatusColor = (status: AlertStatus): string => {
    const colors: Record<AlertStatus, string> = {
      new: 'bg-red-100 text-red-700',
      reviewed: 'bg-teal-100 text-teal-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return colors[status];
  };

  const handleViewDetails = (alert: RiskAlert) => {
    setSelectedAlert(alert);
    setActionNotes('');
    setShowDetailModal(true);
  };

  const handleMarkAsReviewed = () => {
    if (!selectedAlert) return;
    const reviewerName = profile?.full_name || 'Director';
    updateAlertStatus(selectedAlert.id, 'reviewed', reviewerName, actionNotes || undefined);
    setLocalAlerts(prev =>
      prev.map(a =>
        a.id === selectedAlert.id
          ? { ...a, status: 'reviewed' as AlertStatus, reviewed_by: reviewerName, reviewed_at: new Date().toISOString(), notes: actionNotes || a.notes }
          : a
      )
    );
    setShowDetailModal(false);
    setSelectedAlert(null);
  };

  const handleMarkAsResolved = () => {
    if (!selectedAlert) return;
    const reviewerName = profile?.full_name || 'Director';
    updateAlertStatus(selectedAlert.id, 'resolved', reviewerName, actionNotes || undefined);
    setLocalAlerts(prev =>
      prev.map(a =>
        a.id === selectedAlert.id
          ? { ...a, status: 'resolved' as AlertStatus, resolved_by: reviewerName, resolved_at: new Date().toISOString(), notes: actionNotes || a.notes }
          : a
      )
    );
    setShowDetailModal(false);
    setSelectedAlert(null);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Analysing student data for risks...</p>
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
            <p className="text-sm font-medium text-red-700">Failed to load risk alerts</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Academic Risk Alerts</h1>
          <p className="text-sm text-gray-600 mt-1">
            Live alerts computed from real attendance &amp; marks data
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-alert-line text-2xl text-gray-600"></i>
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
              <p className="text-2xl font-bold text-teal-600 mt-1">{stats.reviewed}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-eye-line text-2xl text-teal-600"></i>
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

      {/* Severity Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Severity Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">High Severity:</span>
            <span className="text-sm font-semibold text-gray-900">{stats.high}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Medium Severity:</span>
            <span className="text-sm font-semibold text-gray-900">{stats.medium}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Low Severity:</span>
            <span className="text-sm font-semibold text-gray-900">{stats.low}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as AlertStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value as AlertSeverity | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as AlertType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="low-performance">Low Performance</option>
              <option value="consecutive-absences">Consecutive Absences</option>
              <option value="fees-delay">Fees Delay</option>
              <option value="high-failure-rate">High Failure Rate</option>
              <option value="invalid-marks">Invalid Marks</option>
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
                placeholder="Search alerts..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Alert Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student / Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <i className="ri-shield-check-line text-4xl text-gray-300 mb-2 block"></i>
                    <p className="text-sm text-gray-500">No alerts found — all students are on track!</p>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <i className={`${getAlertTypeIcon(alert.alert_type)} text-gray-600`}></i>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{getAlertTypeLabel(alert.alert_type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {alert.student_name && (
                          <p className="text-sm font-medium text-gray-900">{alert.student_name}</p>
                        )}
                        <p className="text-xs text-gray-500">{alert.class_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-700 line-clamp-2">{alert.description}</p>
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
      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Alert Details</h2>
                <p className="text-sm text-gray-600 mt-1">Review and take action on this alert</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <i className={`${getAlertTypeIcon(selectedAlert.alert_type)} text-2xl text-gray-600`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{getAlertTypeLabel(selectedAlert.alert_type)}</h3>
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

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {selectedAlert.student_name && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Student</p>
                    <p className="text-sm font-medium text-gray-900">{selectedAlert.student_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Class</p>
                  <p className="text-sm font-medium text-gray-900">{selectedAlert.class_name}</p>
                </div>
              </div>

              {selectedAlert.metadata && (
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Data Details</h4>
                  <div className="space-y-1">
                    {selectedAlert.metadata.average_score !== undefined && (
                      <p className="text-sm text-gray-700">Average Score: <strong>{selectedAlert.metadata.average_score}%</strong></p>
                    )}
                    {selectedAlert.metadata.absent_days !== undefined && (
                      <p className="text-sm text-gray-700">Consecutive Absent Days: <strong>{selectedAlert.metadata.absent_days}</strong></p>
                    )}
                    {selectedAlert.metadata.days_overdue !== undefined && (
                      <p className="text-sm text-gray-700">Days Overdue: <strong>{selectedAlert.metadata.days_overdue}</strong></p>
                    )}
                    {selectedAlert.metadata.failure_rate !== undefined && (
                      <p className="text-sm text-gray-700">Failure Rate: <strong>{selectedAlert.metadata.failure_rate}%</strong></p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Triggered By</p>
                  <p className="font-medium text-gray-900">{selectedAlert.triggered_by}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Detected At</p>
                  <p className="font-medium text-gray-900">{new Date(selectedAlert.triggered_at).toLocaleString()}</p>
                </div>
              </div>

              {(selectedAlert.reviewed_by || selectedAlert.resolved_by) && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  {selectedAlert.reviewed_by && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reviewed By</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAlert.reviewed_by}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Reviewed At</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAlert.reviewed_at && new Date(selectedAlert.reviewed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedAlert.resolved_by && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Resolved By</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAlert.resolved_by}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Resolved At</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAlert.resolved_at && new Date(selectedAlert.resolved_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedAlert.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Notes</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{selectedAlert.notes}</p>
                  </div>
                </div>
              )}

              {selectedAlert.status !== 'resolved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Notes (Optional)</label>
                  <textarea
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    placeholder="Add notes about actions taken..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{actionNotes.length}/500</p>
                </div>
              )}
            </div>

            {selectedAlert.status !== 'resolved' && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cancel
                </button>
                {selectedAlert.status === 'new' && (
                  <button
                    onClick={handleMarkAsReviewed}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Mark as Reviewed
                  </button>
                )}
                <button
                  onClick={handleMarkAsResolved}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Mark as Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
