import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTeacherTimetable } from '../../../hooks/useTimetable';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const subjectColors: Record<string, string> = {
  Mathematics: 'from-teal-50 to-teal-100 border-teal-200 text-teal-800',
  English: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800',
  Science: 'from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-800',
  'Social Studies': 'from-amber-50 to-amber-100 border-amber-200 text-amber-800',
  Kinyarwanda: 'from-green-50 to-green-100 border-green-200 text-green-800',
  French: 'from-pink-50 to-pink-100 border-pink-200 text-pink-800',
  ICT: 'from-sky-50 to-sky-100 border-sky-200 text-sky-800',
  Music: 'from-orange-50 to-orange-100 border-orange-200 text-orange-800',
  'Physical Education': 'from-lime-50 to-lime-100 border-lime-200 text-lime-800',
  'Arts & Crafts': 'from-rose-50 to-rose-100 border-rose-200 text-rose-800',
};

function getSubjectColor(subject: string | null): string {
  if (!subject) return 'from-gray-50 to-gray-100 border-gray-200 text-gray-700';
  return subjectColors[subject] ?? 'from-teal-50 to-teal-100 border-teal-200 text-teal-800';
}

export default function Timetable() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const teacherId = profile?.id ?? null;

  const { timetable, loading, error, refetch } = useTeacherTimetable(schoolId, teacherId);

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Derive stats
  const allPeriods = timetable?.schedule.flatMap(d => d.periods) ?? [];
  const nonBreak = allPeriods.filter(p => !p.is_break);
  const uniqueClasses = new Set(nonBreak.map(p => p.class_id)).size;
  const uniqueSubjects = new Set(nonBreak.map(p => p.subject_name).filter(Boolean)).size;
  const totalStudents = 0; // not available without extra query
  const hoursPerWeek = parseFloat((nonBreak.length * (40 / 60)).toFixed(1));

  // All unique period slots (for week view rows)
  const allPeriodNumbers = Array.from(
    new Set(allPeriods.map(p => p.period_number))
  ).sort((a, b) => a - b);

  const todaySchedule = timetable?.schedule.find(s => s.day === selectedDay);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-error-warning-line text-red-500 text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load timetable</h3>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-calendar-line text-gray-400 text-2xl"></i>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Timetable Published</h3>
        <p className="text-gray-500 text-sm">Your schedule has not been published yet. Please contact the Dean or Director.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Timetable</h2>
          <p className="text-gray-500 text-sm mt-1">Your weekly teaching schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Day View
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Classes This Week', value: nonBreak.length, icon: 'ri-calendar-event-line', color: 'teal' },
          { label: 'Unique Classes', value: uniqueClasses, icon: 'ri-building-line', color: 'emerald' },
          { label: 'Subjects Taught', value: uniqueSubjects, icon: 'ri-book-open-line', color: 'cyan' },
          { label: 'Hours / Week', value: hoursPerWeek, icon: 'ri-time-line', color: 'green' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} text-${stat.color}-600 w-5 h-5 flex items-center justify-center`}></i>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'week' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-4 text-sm font-semibold text-gray-700 w-36">Period / Time</th>
                  {WEEK_DAYS.map(day => (
                    <th key={day} className="text-center px-3 py-4 text-sm font-semibold text-gray-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allPeriodNumbers.map(periodNum => {
                  // Get a reference period for time display (from any day)
                  const refPeriod = allPeriods.find(p => p.period_number === periodNum);
                  const isBreakRow = refPeriod?.is_break ?? false;

                  return (
                    <tr key={periodNum} className={isBreakRow ? 'bg-amber-50/40' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {periodNum}
                          </span>
                          <div>
                            <div className="text-xs font-medium text-gray-700">{refPeriod?.start_time}</div>
                            <div className="text-xs text-gray-400">{refPeriod?.end_time}</div>
                          </div>
                        </div>
                      </td>
                      {WEEK_DAYS.map(day => {
                        const dayData = timetable.schedule.find(s => s.day === day);
                        const period = dayData?.periods.find(p => p.period_number === periodNum);

                        if (!period) {
                          return (
                            <td key={day} className="px-2 py-2 border-r border-gray-100">
                              <div className="h-14 flex items-center justify-center text-gray-300 text-xs">—</div>
                            </td>
                          );
                        }

                        if (period.is_break) {
                          return (
                            <td key={day} className="px-2 py-2 border-r border-gray-100">
                              <div className="flex flex-col items-center justify-center h-14 text-amber-600">
                                <i className="ri-cup-line text-lg"></i>
                                <span className="text-xs font-medium mt-0.5">Break</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="px-2 py-2 border-r border-gray-100">
                            <div className={`bg-gradient-to-br ${getSubjectColor(period.subject_name)} border rounded-xl p-2.5 h-14 flex flex-col justify-between`}>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs truncate">{period.class_name}</span>
                              </div>
                              <p className="text-xs truncate opacity-80">{period.subject_name}</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            {/* Day selector */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {WEEK_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedDay === day
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {(todaySchedule?.periods ?? []).length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <i className="ri-calendar-check-line text-4xl mb-2"></i>
                  <p className="text-sm">No classes scheduled for {selectedDay}</p>
                </div>
              )}
              {(todaySchedule?.periods ?? []).map((period, index) => (
                period.is_break ? (
                  <div key={index} className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 border-dashed rounded-xl">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-cup-line text-amber-600 text-sm"></i>
                    </div>
                    <div className="w-28 text-xs font-semibold text-gray-500">
                      {period.start_time} – {period.end_time}
                    </div>
                    <div className="flex-1 text-sm font-medium text-amber-700">Break</div>
                  </div>
                ) : (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 bg-gradient-to-r ${getSubjectColor(period.subject_name)} border rounded-xl`}
                  >
                    <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {period.period_number}
                    </div>
                    <div className="w-28 text-xs font-semibold text-gray-600">
                      {period.start_time} – {period.end_time}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{period.subject_name ?? 'Unknown Subject'}</p>
                      <p className="text-xs opacity-75 mt-0.5">{period.class_name}</p>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Subject Legend</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(nonBreak.map(p => p.subject_name).filter(Boolean))).map(subject => (
            <span
              key={subject}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r ${getSubjectColor(subject)}`}
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
