import { useState } from 'react';

export default function ReEnrollment() {
  const [selectedTerm, setSelectedTerm] = useState('2024-2025');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = {
    totalStudents: 1248,
    reEnrolled: 1061,
    pending: 156,
    notReturning: 31,
    percentage: 85,
  };

  const reEnrollmentData = [
    {
      id: 'STU-2024-001',
      name: 'Sarah Mugisha',
      currentGrade: 'P4A',
      nextGrade: 'P5A',
      parent: 'Jean Mugisha',
      phone: '+250 78 123 4567',
      feesStatus: 'Paid',
      documents: 'Complete',
      status: 'Confirmed',
      statusColor: 'bg-green-100 text-green-700',
      date: 'Oct 20, 2024',
    },
    {
      id: 'STU-2024-002',
      name: 'David Ndayisaba',
      currentGrade: 'P3B',
      nextGrade: 'P4B',
      parent: 'Marie Ndayisaba',
      phone: '+250 78 987 6543',
      feesStatus: 'Partial',
      documents: 'Complete',
      status: 'Pending Payment',
      statusColor: 'bg-amber-100 text-amber-700',
      date: 'Oct 21, 2024',
    },
    {
      id: 'STU-2024-003',
      name: 'Marie Uwase',
      currentGrade: 'P5A',
      nextGrade: 'P6A',
      parent: 'Peter Uwase',
      phone: '+250 72 456 7890',
      feesStatus: 'Unpaid',
      documents: 'Missing',
      status: 'Action Required',
      statusColor: 'bg-red-100 text-red-700',
      date: 'Oct 22, 2024',
    },
    {
      id: 'STU-2024-004',
      name: 'Jean Pierre Habimana',
      currentGrade: 'P2C',
      nextGrade: 'P3C',
      parent: 'Grace Habimana',
      phone: '+250 73 789 0123',
      feesStatus: 'Paid',
      documents: 'Complete',
      status: 'Confirmed',
      statusColor: 'bg-green-100 text-green-700',
      date: 'Oct 23, 2024',
    },
    {
      id: 'STU-2024-005',
      name: 'Claudine Mutoni',
      currentGrade: 'P6A',
      nextGrade: 'Graduating',
      parent: 'James Mutoni',
      phone: '+250 78 234 5678',
      feesStatus: 'Paid',
      documents: 'Complete',
      status: 'Graduating',
      statusColor: 'bg-blue-100 text-blue-700',
      date: 'Oct 23, 2024',
    },
    {
      id: 'STU-2024-006',
      name: 'Patrick Manirafasha',
      currentGrade: 'P1B',
      nextGrade: 'P2B',
      parent: 'Diane Manirafasha',
      phone: '+250 79 345 6789',
      feesStatus: 'Paid',
      documents: 'Pending',
      status: 'Pending Documents',
      statusColor: 'bg-amber-100 text-amber-700',
      date: 'Oct 24, 2024',
    },
  ];

  const notReturningStudents = [
    {
      id: 'STU-2024-089',
      name: 'John Bosco',
      currentGrade: 'P4A',
      parent: 'Mary Bosco',
      reason: 'Transfer to another school',
      date: 'Oct 15, 2024',
    },
    {
      id: 'STU-2024-090',
      name: 'Ange Kagoyire',
      currentGrade: 'P2B',
      parent: 'Paul Kagoyire',
      reason: 'Family relocation',
      date: 'Oct 18, 2024',
    },
  ];

  const gradeProgression = [
    { from: 'P1', to: 'P2', total: 120, reEnrolled: 115, percentage: 96 },
    { from: 'P2', to: 'P3', total: 115, reEnrolled: 110, percentage: 96 },
    { from: 'P3', to: 'P4', total: 110, reEnrolled: 105, percentage: 95 },
    { from: 'P4', to: 'P5', total: 108, reEnrolled: 98, percentage: 91 },
    { from: 'P5', to: 'P6', total: 105, reEnrolled: 95, percentage: 90 },
    { from: 'P6', to: 'Graduate', total: 95, reEnrolled: 95, percentage: 100 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Re-enrollment Management</h2>
          <p className="text-sm text-gray-600">Manage student re-enrollment for the next academic year</p>
        </div>
        <select 
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="2024-2025">Academic Year 2024-2025</option>
          <option value="2023-2024">Academic Year 2023-2024</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-user-follow-line text-2xl text-white"></i>
            </div>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              {stats.percentage}%
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{stats.reEnrolled}</div>
          <div className="text-sm text-gray-600">Re-enrolled Students</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <i className="ri-time-line text-2xl text-white"></i>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Action Needed
            </span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Confirmation</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <i className="ri-user-unfollow-line text-2xl text-white"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{stats.notReturning}</div>
          <div className="text-sm text-gray-600">Not Returning</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <i className="ri-team-line text-2xl text-white"></i>
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{stats.totalStudents}</div>
          <div className="text-sm text-gray-600">Total Current Students</div>
        </div>
      </div>

      {/* Grade Progression Overview */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Grade Progression Overview</h3>
          <p className="text-sm text-gray-600 mt-1">Re-enrollment rates by grade progression</p>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            {gradeProgression.map((grade, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 w-16">{grade.from}</span>
                    <i className="ri-arrow-right-line text-gray-400"></i>
                    <span className="font-semibold text-gray-900">{grade.to}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {grade.reEnrolled} / {grade.total} students
                    </span>
                    <span className={`text-sm font-bold ${
                      grade.percentage >= 95 ? 'text-green-600' :
                      grade.percentage >= 85 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {grade.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      grade.percentage >= 95 ? 'bg-green-500' :
                      grade.percentage >= 85 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${grade.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Re-enrollment List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-900">Re-enrollment Status</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="pl-11 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="action">Action Required</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Current → Next</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Parent Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fees</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Documents</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reEnrollmentData.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{student.currentGrade}</span>
                      <i className="ri-arrow-right-line text-gray-400"></i>
                      <span className="text-teal-600 font-medium">{student.nextGrade}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900">{student.parent}</div>
                      <div className="text-xs text-gray-500">{student.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      student.feesStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                      student.feesStatus === 'Partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {student.feesStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      student.documents === 'Complete' ? 'bg-green-100 text-green-700' :
                      student.documents === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {student.documents}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${student.statusColor}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                        <i className="ri-eye-line"></i>
                      </button>
                      <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Send Reminder">
                        <i className="ri-mail-send-line"></i>
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Confirm">
                        <i className="ri-check-double-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Not Returning Students */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Not Returning Students</h3>
          <p className="text-sm text-gray-600 mt-1">Students who will not be re-enrolling</p>
        </div>
        <div className="divide-y divide-gray-100">
          {notReturningStudents.map((student) => (
            <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-600">
                      {student.currentGrade} • Parent: {student.parent}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-600 font-medium">{student.reason}</div>
                  <div className="text-xs text-gray-500 mt-1">Reported on {student.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}