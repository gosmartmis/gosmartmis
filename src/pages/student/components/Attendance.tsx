import { useState, useMemo } from 'react';
import { useStudentAttendance } from '../../../hooks/useStudentAttendance';
import { useAuth } from '../../../hooks/useAuth';
import { useStudents } from '../../../hooks/useStudents';

export default function Attendance() {
  const { user } = useAuth();
  const { students } = useStudents();

  // Get current student ID
  const currentStudent = students.find(s => s.user_id === user?.id);
  const studentId = currentStudent?.id || '';

  // Fetch real attendance data
  const { summary, monthlyStats, recentRecords, loading, error } = useStudentAttendance(studentId);

  // Generate month options from recentRecords
  const monthOptions = useMemo(() => {
    if (!recentRecords.length) {
      const now = new Date();
      return [{
        value: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }];
    }

    const uniqueMonths = new Set<string>();
    recentRecords.forEach(record => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      uniqueMonths.add(key);
    });

    return Array.from(uniqueMonths)
      .sort((a, b) => b.localeCompare(a))
      .map(key => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          value: key,
          label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
      });
  }, [recentRecords]);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '');

  // Update selectedMonth when monthOptions change
  useMemo(() => {
    if (monthOptions.length > 0 && !selectedMonth) {
      setSelectedMonth(monthOptions[0].value);
    }
  }, [monthOptions, selectedMonth]);

  // Filter records by selected month
  const filteredRecords = useMemo(() => {
    if (!selectedMonth) return [];
    return recentRecords.filter(record => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return key === selectedMonth;
    });
  }, [recentRecords, selectedMonth]);

  // Build calendar data from filtered records
  const calendarData = useMemo(() => {
    if (!selectedMonth) return { year: 0, month: 0, firstDay: 0, daysInMonth: 0, recordsMap: new Map() };

    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const recordsMap = new Map<number, 'present' | 'absent' | 'late'>();
    filteredRecords.forEach(record => {
      const date = new Date(record.date);
      recordsMap.set(date.getDate(), record.status);
    });

    return { year, month, firstDay, daysInMonth, recordsMap };
  }, [selectedMonth, filteredRecords]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 text-emerald-600';
      case 'absent': return 'bg-red-500 text-red-600';
      case 'late': return 'bg-amber-500 text-amber-600';
      default: return 'bg-gray-200 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return 'ri-check-line';
      case 'absent': return 'ri-close-line';
      case 'late': return 'ri-time-line';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-600 mt-4">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
          <div>
            <h3 className="font-bold text-red-900">Error Loading Attendance</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'Select Month';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-600 mt-1">Track your attendance record</p>
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 flex items-center justify-center"></i>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Present</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.present}</p>
              <p className="text-sm text-emerald-600 mt-1">Days attended</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <i className="ri-check-line text-2xl text-white w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Absent</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.absent}</p>
              <p className="text-sm text-red-600 mt-1">Days missed</p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <i className="ri-close-line text-2xl text-white w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Late</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.late}</p>
              <p className="text-sm text-amber-600 mt-1">Days late</p>
            </div>
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <i className="ri-time-line text-2xl text-white w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>

        <div className="bg-teal-50 rounded-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.percentage}%</p>
              <p className="text-sm text-teal-600 mt-1">Overall average</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <i className="ri-percent-line text-2xl text-white w-6 h-6 flex items-center justify-center"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Attendance Calendar */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">{selectedMonthLabel}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                <span className="text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-gray-600">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500"></div>
                <span className="text-gray-600">Late</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells before first day */}
            {Array.from({ length: calendarData.firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* Calendar days */}
            {Array.from({ length: calendarData.daysInMonth }, (_, i) => {
              const date = i + 1;
              const status = calendarData.recordsMap.get(date);
              const dayOfWeek = (calendarData.firstDay + i) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              
              return (
                <div
                  key={date}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium ${
                    status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                    status === 'absent' ? 'bg-red-100 text-red-700' :
                    status === 'late' ? 'bg-amber-100 text-amber-700' :
                    isWeekend ? 'bg-gray-50 text-gray-400' :
                    'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {date}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Records</h3>
          {recentRecords.length > 0 ? (
            <div className="space-y-3">
              {recentRecords.slice(0, 8).map((record, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    record.status === 'present' ? 'bg-emerald-100' :
                    record.status === 'absent' ? 'bg-red-100' :
                    'bg-amber-100'
                  }`}>
                    <i className={`${getStatusIcon(record.status)} w-5 h-5 flex items-center justify-center ${
                      record.status === 'present' ? 'text-emerald-600' :
                      record.status === 'absent' ? 'text-red-600' :
                      'text-amber-600'
                    }`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.day}</p>
                    <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full capitalize ${
                      record.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                      record.status === 'absent' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {record.status}
                    </span>
                    {record.reason && (
                      <p className="text-xs text-gray-500 mt-1">{record.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-calendar-line text-4xl mb-2"></i>
              <p>No attendance records yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Statistics</h3>
        {monthlyStats.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {monthlyStats.map((month, index) => (
              <div key={index} className="p-4 border border-gray-100 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">{month.month}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Present</span>
                    <span className="text-sm font-semibold text-emerald-600">{month.present}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="text-sm font-semibold text-red-600">{month.absent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Late</span>
                    <span className="text-sm font-semibold text-amber-600">{month.late}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Total</span>
                      <span className="text-sm font-bold text-gray-900">{month.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-bar-chart-line text-4xl mb-2"></i>
            <p>No monthly statistics available</p>
          </div>
        )}
      </div>
    </div>
  );
}