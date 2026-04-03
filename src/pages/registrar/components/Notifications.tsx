import { useState } from 'react';

export default function Notifications() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showReminderModal, setShowReminderModal] = useState(false);

  const notificationStats = {
    total: 156,
    pending: 89,
    sent: 67,
    scheduled: 23,
  };

  const notifications = [
    {
      id: 'NOT-2024-001',
      type: 'Document Reminder',
      student: 'Marie Uwase',
      studentId: 'STU-2024-003',
      parent: 'Peter Uwase',
      phone: '+250 72 456 7890',
      email: 'peter.uwase@email.com',
      missingDocs: ['Birth Certificate', 'Medical Records'],
      dueDate: 'Oct 28, 2024',
      priority: 'High',
      status: 'Pending',
      lastSent: 'Oct 20, 2024',
      attempts: 2,
    },
    {
      id: 'NOT-2024-002',
      type: 'Document Reminder',
      student: 'Patrick Manirafasha',
      studentId: 'STU-2024-006',
      parent: 'Diane Manirafasha',
      phone: '+250 79 345 6789',
      email: 'diane.manirafasha@email.com',
      missingDocs: ['Previous School Report'],
      dueDate: 'Oct 30, 2024',
      priority: 'Medium',
      status: 'Scheduled',
      scheduledFor: 'Oct 26, 2024 09:00 AM',
      attempts: 1,
    },
    {
      id: 'NOT-2024-003',
      type: 'Fee Payment Reminder',
      student: 'David Ndayisaba',
      studentId: 'STU-2024-002',
      parent: 'Marie Ndayisaba',
      phone: '+250 78 987 6543',
      email: 'marie.ndayisaba@email.com',
      missingDocs: [],
      dueDate: 'Oct 27, 2024',
      priority: 'High',
      status: 'Sent',
      lastSent: 'Oct 25, 2024',
      attempts: 3,
    },
    {
      id: 'NOT-2024-004',
      type: 'Document Reminder',
      student: 'Kevin Habimana',
      studentId: 'STU-2024-158',
      parent: 'Grace Habimana',
      phone: '+250 73 789 0123',
      email: 'grace.habimana@email.com',
      missingDocs: ['Parent ID Copy'],
      dueDate: 'Nov 02, 2024',
      priority: 'Low',
      status: 'Pending',
      lastSent: 'Never',
      attempts: 0,
    },
  ];

  const reminderTemplates = [
    {
      id: 'TEMP-001',
      name: 'Missing Documents - First Reminder',
      subject: 'Action Required: Missing Documents for {student_name}',
      message: 'Dear {parent_name}, We noticed that the following documents are still missing for {student_name}: {missing_docs}. Please submit them by {due_date}.',
      channel: 'Email & SMS',
    },
    {
      id: 'TEMP-002',
      name: 'Missing Documents - Final Notice',
      subject: 'Urgent: Final Notice for Missing Documents',
      message: 'Dear {parent_name}, This is a final reminder. Please submit the missing documents for {student_name} immediately to avoid enrollment delays.',
      channel: 'Email & SMS',
    },
    {
      id: 'TEMP-003',
      name: 'Fee Payment Reminder',
      subject: 'Fee Payment Reminder for {student_name}',
      message: 'Dear {parent_name}, This is a friendly reminder about the pending fee payment for {student_name}. Due date: {due_date}.',
      channel: 'Email',
    },
  ];

  const automationRules = [
    {
      id: 'RULE-001',
      name: 'Missing Documents - 3 Day Reminder',
      trigger: 'Documents missing for 3 days',
      action: 'Send first reminder email',
      status: 'Active',
      lastRun: '2 hours ago',
      nextRun: 'Tomorrow 09:00 AM',
    },
    {
      id: 'RULE-002',
      name: 'Missing Documents - 7 Day Final Notice',
      trigger: 'Documents missing for 7 days',
      action: 'Send final notice via email & SMS',
      status: 'Active',
      lastRun: '1 day ago',
      nextRun: 'Oct 27, 2024 09:00 AM',
    },
    {
      id: 'RULE-003',
      name: 'Fee Payment - Due Date Reminder',
      trigger: '2 days before fee due date',
      action: 'Send payment reminder',
      status: 'Active',
      lastRun: '5 hours ago',
      nextRun: 'Tomorrow 08:00 AM',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-amber-100 text-amber-700';
      case 'Low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent':
        return 'bg-green-100 text-green-700';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification System</h2>
          <p className="text-sm text-gray-600">Automated document reminders and parent notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
            <i className="ri-settings-3-line"></i>
            Automation Rules
          </button>
          <button 
            onClick={() => setShowReminderModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
          >
            <i className="ri-send-plane-line"></i>
            Send Reminder
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-notification-3-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{notificationStats.total}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <i className="ri-time-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{notificationStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <i className="ri-check-double-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{notificationStats.sent}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <i className="ri-calendar-schedule-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{notificationStats.scheduled}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Automation Rules</h3>
              <p className="text-sm text-gray-600 mt-1">Configure automatic reminder schedules</p>
            </div>
            <button className="px-4 py-2 text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-2">
              <i className="ri-add-line"></i>
              Add Rule
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {automationRules.map((rule) => (
            <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <i className="ri-flashlight-line text-teal-600 text-xl"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{rule.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        rule.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rule.status}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-flashlight-fill text-amber-500"></i>
                        <span>Trigger: {rule.trigger}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-send-plane-fill text-teal-500"></i>
                        <span>Action: {rule.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    <div>Last run: {rule.lastRun}</div>
                    <div className="text-teal-600 font-medium mt-1">Next: {rule.nextRun}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                      <i className="ri-edit-line"></i>
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-900">Notification Queue</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className="pl-11 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student & Parent</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Missing Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Priority</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <tr key={notification.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{notification.student}</div>
                      <div className="text-sm text-gray-600">{notification.parent}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <i className="ri-phone-line mr-1"></i>
                        {notification.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{notification.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    {notification.missingDocs.length > 0 ? (
                      <div className="space-y-1">
                        {notification.missingDocs.map((doc, index) => (
                          <div key={index} className="text-sm text-red-600 flex items-center gap-1">
                            <i className="ri-file-warning-line"></i>
                            {doc}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{notification.dueDate}</div>
                    {notification.status === 'Scheduled' && (
                      <div className="text-xs text-blue-600 mt-1">
                        <i className="ri-calendar-line mr-1"></i>
                        {notification.scheduledFor}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Attempts: {notification.attempts}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Send Now">
                        <i className="ri-send-plane-line"></i>
                      </button>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Schedule">
                        <i className="ri-calendar-schedule-line"></i>
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                        <i className="ri-eye-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Message Templates</h3>
              <p className="text-sm text-gray-600 mt-1">Pre-configured reminder templates</p>
            </div>
            <button className="px-4 py-2 text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-2">
              <i className="ri-add-line"></i>
              New Template
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {reminderTemplates.map((template) => (
            <div key={template.id} className="p-4 border border-gray-200 rounded-xl hover:border-teal-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{template.name}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {template.channel}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Subject:</strong> {template.subject}
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {template.message}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                    <i className="ri-edit-line"></i>
                  </button>
                  <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Use Template">
                    <i className="ri-file-copy-line"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Send Reminder</h3>
              <button 
                onClick={() => setShowReminderModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Choose a template...</option>
                  {reminderTemplates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select recipients...</option>
                  <option value="all-pending">All Pending Documents</option>
                  <option value="high-priority">High Priority Only</option>
                  <option value="custom">Custom Selection</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send Via</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-teal-600 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">SMS</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" className="w-4 h-4 text-teal-600" defaultChecked />
                    <span className="text-sm text-gray-700">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-700">Schedule for Later</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowReminderModal(false)}
                className="px-6 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all">
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}