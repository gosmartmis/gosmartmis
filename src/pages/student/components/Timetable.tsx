import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useStudentTimetable } from '../../../hooks/useTimetable';
import { supabase } from '../../../lib/supabase';
import { useEffect } from 'react';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const subjectColors: Record<string, string> = {
  Mathematics: 'bg-teal-100 text-teal-700 border-teal-200',
  English: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Science: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Social Studies': 'bg-amber-100 text-amber-700 border-amber-200',
  Kinyarwanda: 'bg-green-100 text-green-700 border-green-200',
  French: 'bg-pink-100 text-pink-700 border-pink-200',
  ICT: 'bg-sky-100 text-sky-700 border-sky-200',
  Music: 'bg-orange-100 text-orange-700 border-orange-200',
  'Physical Education': 'bg-lime-100 text-lime-700 border-lime-200',
  'Arts & Crafts': 'bg-rose-100 text-rose-700 border-rose-200',
};

function getSubjectColor(subject: string | null): string {
  if (!subject) return 'bg-gray-100 text-gray-600 border-gray-200';
  return subjectColors[subject] ?? 'bg-teal-100 text-teal-700 border-teal-200';
}

export default function Timetable() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;
  const [classId, setClassId] = useState<string | null>(null);

  // Fetch the student's class_id from the students table
  useEffect(() => {
    if (!profile?.id || !schoolId) return;
    supabase
      .from('students')
      .select('class_id')
      .eq('school_id', schoolId)
      .eq('profile_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.class_id) setClassId(data.class_id);
      });
  }, [profile?.id, schoolId]);

  const { timetable, loading, error, refetch } = useStudentTimetable(schoolId, classId);

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const allPeriods = timetable?.schedule.flatMap(d => d.periods) ?? [];
  const nonBreak = allPeriods.filter(p => !p.is_break);
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
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Timetable Available</h3>
        <p className="text-gray-500 text-sm">Your class timetable has not been published yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Timetable</h2>
          <p className="text-sm text-gray-500 mt-1">{timetable.className} — Weekly Schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'day' ? (
        <>
          {/* Day Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {WEEK_DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedDay === day
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Day Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">{selectedDay}&apos;s Schedule</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {todaySchedule?.periods.length ?? 0} periods
              </span>
            </div>

            <div className="space-y-3">
              {(todaySchedule?.periods ?? []).length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <i className="ri-calendar-check-line text-4xl mb-2"></i>
                  <p className="text-sm">No classes on {selectedDay}</p>
                </div>
              )}
              {(todaySchedule?.periods ?? []).map((period, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    period.is_break
                      ? 'bg-amber-50 border border-amber-200'
                      : `${getSubjectColor(period.subject_name)} border bg-opacity-50`
                  }`}
                >
                  <div className="w-8 h-8 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-xs font-bold text-gray-700">
                      {period.period_number}
                    </div>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <div className="text-xs font-semibold text-gray-700">{period.start_time}</div>
                    <div className="text-xs text-gray-400">{period.end_time}</div>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/60 rounded-lg flex items-center justify-center flex-shrink-0">
                      {period.is_break
                        ? <i className="ri-cup-line text-amber-600"></i>
                        : <i className="ri-book-line text-current"></i>
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {period.is_break ? 'Break' : (period.subject_name ?? 'Unknown Subject')}
                      </p>
                      {!period.is_break && period.teacher_name && (
                        <p className="text-xs opacity-70 mt-0.5">{period.teacher_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Week View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Period</th>
                  {WEEK_DAYS.map(day => (
                    <th
                      key={day}
                      className={`px-4 py-3 text-center text-sm font-semibold ${
                        day === selectedDay
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPeriodNumbers.map(periodNum => {
                  const refPeriod = allPeriods.find(p => p.period_number === periodNum);
                  const isBreakRow = refPeriod?.is_break ?? false;

                  return (
                    <tr key={periodNum} className={`border-b border-gray-100 ${isBreakRow ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                            {periodNum}
                          </span>
                          <div>
                            <div className="text-xs text-gray-600">{refPeriod?.start_time}</div>
                            <div className="text-xs text-gray-400">{refPeriod?.end_time}</div>
                          </div>
                        </div>
                      </td>
                      {WEEK_DAYS.map(day => {
                        const dayData = timetable.schedule.find(s => s.day === day);
                        const period = dayData?.periods.find(p => p.period_number === periodNum);

                        if (!period) {
                          return (
                            <td key={day} className="px-2 py-2 text-center text-gray-300 text-sm">—</td>
                          );
                        }

                        if (period.is_break) {
                          return (
                            <td key={day} className="px-2 py-2 text-center">
                              <div className="flex flex-col items-center text-amber-600">
                                <i className="ri-cup-line text-lg"></i>
                                <span className="text-xs font-medium">Break</span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="px-2 py-2">
                            <div className={`p-2 rounded-lg text-xs border ${getSubjectColor(period.subject_name)}`}>
                              <p className="font-semibold">{period.subject_name}</p>
                              {period.teacher_name && (
                                <p className="opacity-70 mt-0.5 truncate">{period.teacher_name}</p>
                              )}
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
        </div>
      )}

      {/* Subject Legend */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Subject Legend</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(nonBreak.map(p => p.subject_name).filter(Boolean))).map(subject => (
            <span
              key={subject}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getSubjectColor(subject)}`}
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
