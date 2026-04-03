import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTeacherStats } from '../../../hooks/useTeacherStats';
import { useTodaySchedule } from '../../../hooks/useTodaySchedule';
import { useTeacherMarksStats } from '../../../hooks/useTeacherMarksStats';
import { useRecentActivity } from '../../../hooks/useRecentActivity';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';

const quickActions = [
  { label: 'Enter Marks', icon: 'ri-edit-line', color: 'bg-teal-500' },
  { label: 'Take Attendance', icon: 'ri-user-check-line', color: 'bg-emerald-500' },
  { label: 'Send Message', icon: 'ri-send-plane-line', color: 'bg-cyan-500' },
  { label: 'View Reports', icon: 'ri-bar-chart-line', color: 'bg-green-500' },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id || null;
  const teacherId = profile?.id || null;

  const [timeRange, setTimeRange] = useState('today');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch real data
  const { stats, loading: statsLoading } = useTeacherStats(schoolId, teacherId);
  const { schedule, loading: scheduleLoading } = useTodaySchedule(schoolId, teacherId);
  const { topStudents, pendingMarks, loading: marksLoading } = useTeacherMarksStats(
    schoolId,
    teacherId,
    selectedClass || undefined
  );
  const { activities, loading: activityLoading } = useRecentActivity(schoolId, teacherId);
  const { assignments } = useTeacherAssignments(schoolId, teacherId);

  // Get unique classes from assignments
  const myClasses = Array.from(new Set(assignments.map(a => a.class_id)));
  const myClassNames = Array.from(new Set(assignments.map(a => a.class_name)));

  // Set default selected class
  if (!selectedClass && myClasses.length > 0) {
    setSelectedClass(myClasses[0]);
  }

  const statsCards = [
    { 
      label: 'My Students', 
      value: statsLoading ? '...' : stats.totalStudents.toString(), 
      icon: 'ri-user-3-line', 
      color: 'from-teal-500 to-emerald-500' 
    },
    { 
      label: 'Classes Today', 
      value: statsLoading ? '...' : stats.todayClasses.toString(), 
      icon: 'ri-calendar-event-line', 
      color: 'from-emerald-500 to-green-500' 
    },
    { 
      label: 'Pending Marks', 
      value: statsLoading ? '...' : stats.pendingMarks.toString(), 
      icon: 'ri-file-edit-line', 
      color: 'from-cyan-500 to-teal-500' 
    },
    { 
      label: 'New Messages', 
      value: statsLoading ? '...' : stats.newMessages.toString(), 
      icon: 'ri-message-3-line', 
      color: 'from-green-500 to-emerald-500' 
    },
  ];

  const getTrophyIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-blue-500 text-white';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-green-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome, {profile?.full_name || 'Teacher'}
            </h1>
            <p className="text-teal-50 text-sm md:text-base">Manage your classes and track student progress</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Today&apos;s Classes</div>
              <div className="text-lg font-bold">
                {statsLoading ? '...' : stats.todayClasses} Classes
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Pending</div>
              <div className="text-lg font-bold">
                {statsLoading ? '...' : stats.pendingMarks} Marks
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 overflow-x-auto">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                timeRange === range
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <i className={`${stat.icon} text-xl text-white w-6 h-6 flex items-center justify-center`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Schedule & Top Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Today&apos;s Schedule</h3>
            <button className="text-teal-600 hover:text-teal-700 text-sm font-medium whitespace-nowrap">View Full Timetable</button>
          </div>
          
          {scheduleLoading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-loader-4-line text-3xl mb-2 animate-spin"></i>
              <p className="text-sm">Loading schedule...</p>
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-calendar-line text-3xl mb-2"></i>
              <p className="text-sm">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((cls) => (
                <div key={cls.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border ${
                  cls.status === 'ongoing' 
                    ? 'border-teal-500 bg-teal-50' 
                    : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className={`w-2 h-12 rounded-full hidden sm:block ${
                    cls.status === 'completed' ? 'bg-emerald-500' :
                    cls.status === 'ongoing' ? 'bg-teal-500 animate-pulse' :
                    'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-sm font-semibold text-gray-900">
                        {cls.start_time} - {cls.end_time}
                      </span>
                      <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                        {cls.class_name}
                      </span>
                      <span className="text-sm text-gray-600">{cls.subject_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-4">
                    {cls.status === 'ongoing' && (
                      <span className="px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                        Now
                      </span>
                    )}
                    {cls.status === 'completed' && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full whitespace-nowrap">
                        Done
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Students in My Classes */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Top Students</h3>
            <i className="ri-trophy-line text-yellow-500 text-xl w-5 h-5 flex items-center justify-center"></i>
          </div>
          
          {/* Class Selector */}
          {myClassNames.length > 0 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.class_id}>
                  {assignment.class_name}
                </option>
              ))}
            </select>
          )}

          {/* Top 5 Students */}
          {marksLoading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-loader-4-line text-3xl mb-2 animate-spin"></i>
              <p className="text-sm">Loading...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topStudents.length > 0 ? (
                topStudents.map((student) => (
                  <div key={student.studentId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getBadgeColor(student.rank || 0)}`}>
                      {getTrophyIcon(student.rank || 0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{student.studentName}</p>
                      <p className="text-xs text-gray-500">{student.studentCode}</p>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(student.averageScore)}`}>
                      {student.averageScore}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="ri-information-line text-3xl mb-2"></i>
                  <p className="text-sm">No data available for this class</p>
                </div>
              )}
            </div>
          )}

          {topStudents.length > 0 && (
            <button className="w-full mt-4 px-4 py-2 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors whitespace-nowrap">
              View Full Leaderboard
            </button>
          )}
        </div>
      </div>

      {/* Pending Marks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Marks */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Pending Marks Entry</h3>
            <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-full whitespace-nowrap">
              {statsLoading ? '...' : stats.pendingMarks} Pending
            </span>
          </div>
          
          {marksLoading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-loader-4-line text-3xl mb-2 animate-spin"></i>
              <p className="text-sm">Loading...</p>
            </div>
          ) : pendingMarks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-checkbox-circle-line text-3xl mb-2"></i>
              <p className="text-sm">No pending marks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMarks.slice(0, 4).map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {item.class_name.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {item.exam_type} - {item.subject_name}
                      </p>
                      <p className="text-xs text-gray-600">Due: {item.due_date}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                    Enter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
          
          {activityLoading ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-loader-4-line text-3xl mb-2 animate-spin"></i>
              <p className="text-sm">Loading...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-history-line text-3xl mb-2"></i>
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`${activity.icon} text-teal-600 w-5 h-5 flex items-center justify-center`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.action}</span>
                      <span className="font-semibold text-teal-600"> {activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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