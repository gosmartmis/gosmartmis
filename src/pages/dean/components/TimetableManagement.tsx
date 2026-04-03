import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useClasses } from '../../../hooks/useClasses';
import { useSubjects } from '../../../hooks/useSubjects';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useAdminTimetable, WEEK_DAYS } from '../../../hooks/useAdminTimetable';
import type { TimetableRow, UpsertPeriodPayload } from '../../../hooks/useAdminTimetable';

interface TimetableManagementProps {
  setActiveTab: (tab: string) => void;
}

interface PeriodConfig {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

const DEFAULT_PERIODS: PeriodConfig[] = [
  { periodNumber: 1, startTime: '08:00', endTime: '08:40', isBreak: false },
  { periodNumber: 2, startTime: '08:40', endTime: '09:20', isBreak: false },
  { periodNumber: 3, startTime: '09:20', endTime: '10:00', isBreak: false },
  { periodNumber: 4, startTime: '10:00', endTime: '10:20', isBreak: true },
  { periodNumber: 5, startTime: '10:20', endTime: '11:00', isBreak: false },
  { periodNumber: 6, startTime: '11:00', endTime: '11:40', isBreak: false },
  { periodNumber: 7, startTime: '11:40', endTime: '12:00', isBreak: true },
  { periodNumber: 8, startTime: '12:00', endTime: '12:40', isBreak: false },
];

interface EditModalState {
  open: boolean;
  day: string;
  period: PeriodConfig | null;
  existing: TimetableRow | null;
}

export default function TimetableManagement({ setActiveTab }: TimetableManagementProps) {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { classes, loading: classesLoading } = useClasses(schoolId);
  const { subjects } = useSubjects(schoolId);
  const { assignments } = useTeacherAssignments(schoolId);

  const {
    entries,
    loading,
    saving,
    publishing,
    error,
    isPublished,
    fetchTimetable,
    upsertPeriod,
    deletePeriod,
    publishTimetable,
    unpublishTimetable,
    clearTimetable,
  } = useAdminTimetable(schoolId);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, day: '', period: null, existing: null });
  const [editSubjectId, setEditSubjectId] = useState<string>('');
  const [editTeacherId, setEditTeacherId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Auto-select first class
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

  // Fetch timetable when class changes
  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable(selectedClassId);
    }
  }, [selectedClassId]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const getEntry = (day: string, periodNumber: number): TimetableRow | undefined =>
    entries.find(e => e.day_of_week === day && e.period_number === periodNumber);

  const openEditModal = (day: string, period: PeriodConfig) => {
    const existing = getEntry(day, period.periodNumber);
    setEditSubjectId(existing?.subject_id ?? '');
    setEditTeacherId(existing?.teacher_id ?? '');
    setEditModal({ open: true, day, period, existing: existing ?? null });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, day: '', period: null, existing: null });
    setEditSubjectId('');
    setEditTeacherId('');
  };

  // Get teachers who teach the selected subject in the selected class
  const getTeachersForSubject = (subjectId: string) => {
    if (!subjectId) return [];
    const seen = new Set<string>();
    return assignments
      .filter(a => a.subject_id === subjectId && a.class_id === selectedClassId)
      .filter(a => {
        if (seen.has(a.teacher_id)) return false;
        seen.add(a.teacher_id);
        return true;
      });
  };

  const handleSavePeriod = async () => {
    if (!editModal.period || !schoolId || !selectedClassId) return;
    const period = editModal.period;

    const payload: UpsertPeriodPayload = {
      school_id: schoolId,
      class_id: selectedClassId,
      day_of_week: editModal.day,
      period_number: period.periodNumber,
      start_time: period.startTime,
      end_time: period.endTime,
      is_break: period.isBreak,
      subject_id: period.isBreak ? null : (editSubjectId || null),
      teacher_id: period.isBreak ? null : (editTeacherId || null),
      term_id: null,
      is_published: isPublished,
    };

    const ok = await upsertPeriod(payload);
    if (ok) {
      showSuccess('Period saved successfully.');
      closeEditModal();
    }
  };

  const handleDeletePeriod = async () => {
    if (!editModal.period || !selectedClassId) return;
    const ok = await deletePeriod(selectedClassId, editModal.day, editModal.period.periodNumber);
    if (ok) {
      showSuccess('Period cleared.');
      closeEditModal();
    }
  };

  const handlePublish = async () => {
    if (!schoolId || !selectedClassId) return;
    const ok = await publishTimetable(selectedClassId, schoolId);
    if (ok) showSuccess('Timetable published! Students and teachers can now see it.');
  };

  const handleUnpublish = async () => {
    if (!schoolId || !selectedClassId) return;
    const ok = await unpublishTimetable(selectedClassId, schoolId);
    if (ok) showSuccess('Timetable unpublished.');
  };

  const handleClearAll = async () => {
    if (!schoolId || !selectedClassId) return;
    const ok = await clearTimetable(selectedClassId, schoolId);
    if (ok) {
      showSuccess('Timetable cleared.');
      setConfirmClear(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const totalFilled = entries.filter(e => !e.is_break && e.subject_id).length;
  const totalSlots = DEFAULT_PERIODS.filter(p => !p.isBreak).length * WEEK_DAYS.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timetable Management</h2>
          <p className="text-sm text-gray-500 mt-1">Create, edit, and publish class timetables</p>
        </div>
        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <>
              <button
                onClick={() => setConfirmClear(true)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <i className="ri-delete-bin-line mr-1.5"></i>
                Clear All
              </button>
              {isPublished ? (
                <button
                  onClick={handleUnpublish}
                  disabled={publishing}
                  className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium whitespace-nowrap disabled:opacity-60"
                >
                  {publishing ? <i className="ri-loader-4-line animate-spin mr-1.5"></i> : <i className="ri-eye-off-line mr-1.5"></i>}
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={handlePublish}
                  disabled={publishing || totalFilled === 0}
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap disabled:opacity-60"
                >
                  {publishing ? <i className="ri-loader-4-line animate-spin mr-1.5"></i> : <i className="ri-send-plane-line mr-1.5"></i>}
                  Publish Timetable
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <i className="ri-checkbox-circle-line text-teal-600 text-lg"></i>
          <span className="text-teal-800 text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <i className="ri-error-warning-line text-red-600 text-lg"></i>
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      )}

      {/* Class Selector + Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Class:</span>
            {classesLoading ? (
              <div className="h-9 w-48 bg-gray-100 rounded-lg animate-pulse"></div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedClassId === cls.id
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-gray-900 text-lg">{totalFilled}</div>
                <div className="text-gray-500 text-xs">Periods filled</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-lg">{totalSlots - totalFilled}</div>
                <div className="text-gray-500 text-xs">Empty slots</div>
              </div>
              <div className="text-center">
                <div className={`font-bold text-lg ${isPublished ? 'text-teal-600' : 'text-amber-500'}`}>
                  {isPublished ? 'Published' : 'Draft'}
                </div>
                <div className="text-gray-500 text-xs">Status</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-teal-500 mb-3"></i>
          <p className="text-gray-500">Loading timetable...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Grid Header */}
          <div className={`px-6 py-4 flex items-center justify-between ${isPublished ? 'bg-gradient-to-r from-teal-600 to-teal-700' : 'bg-gradient-to-r from-gray-700 to-gray-800'}`}>
            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedClass?.name ?? 'Select a class'} — Weekly Timetable
              </h3>
              <p className="text-sm mt-0.5 text-white/70">
                {isPublished ? 'Published — visible to students & teachers' : 'Draft — click a cell to assign a subject'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isPublished ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'}`}>
              {isPublished ? <><i className="ri-eye-line mr-1"></i>Live</> : <><i className="ri-edit-line mr-1"></i>Editing</>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-28">Period</th>
                  {WEEK_DAYS.map(day => (
                    <th key={day} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEFAULT_PERIODS.map((period) => (
                  <tr key={period.periodNumber} className={`border-b border-gray-100 ${period.isBreak ? 'bg-amber-50/60' : 'hover:bg-gray-50/50'}`}>
                    {/* Period label */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${period.isBreak ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                          {period.periodNumber}
                        </span>
                        <div>
                          <div className="text-xs font-medium text-gray-700">{period.startTime}</div>
                          <div className="text-xs text-gray-400">{period.endTime}</div>
                        </div>
                      </div>
                    </td>

                    {/* Day cells */}
                    {WEEK_DAYS.map(day => {
                      const entry = getEntry(day, period.periodNumber);

                      if (period.isBreak) {
                        return (
                          <td key={day} className="px-3 py-3">
                            <div className="flex flex-col items-center justify-center py-1">
                              <i className="ri-cup-line text-amber-500 text-base"></i>
                              <span className="text-xs text-amber-600 font-medium mt-0.5">Break</span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={day} className="px-3 py-2">
                          <button
                            onClick={() => openEditModal(day, period)}
                            className={`w-full rounded-lg p-2.5 text-left transition-all group ${
                              entry?.subject_id
                                ? 'bg-teal-50 border border-teal-200 hover:border-teal-400 hover:shadow-sm'
                                : 'bg-gray-50 border border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50/50'
                            }`}
                          >
                            {entry?.subject_id ? (
                              <>
                                <div className="text-xs font-semibold text-gray-900 truncate">{entry.subject_name}</div>
                                <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                  <i className="ri-user-line text-gray-400"></i>
                                  {entry.teacher_name ?? 'No teacher'}
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center py-1 text-gray-400 group-hover:text-teal-500 transition-colors">
                                <i className="ri-add-line text-sm mr-1"></i>
                                <span className="text-xs">Assign</span>
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && selectedClassId && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <i className="ri-calendar-line text-5xl text-gray-300 mb-3"></i>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No timetable yet</h3>
          <p className="text-gray-500 text-sm">Click any cell in the grid above to start assigning subjects to periods.</p>
        </div>
      )}

      {/* Edit Period Modal */}
      {editModal.open && editModal.period && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editModal.period.isBreak ? 'Break Period' : `Edit Period ${editModal.period.periodNumber}`}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editModal.day} · {editModal.period.startTime} – {editModal.period.endTime}
                </p>
              </div>
              <button onClick={closeEditModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-xl text-gray-500"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editModal.period.isBreak ? (
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <i className="ri-cup-line text-3xl text-amber-500 mb-2"></i>
                  <p className="text-amber-700 font-medium">This is a break period</p>
                  <p className="text-amber-600 text-sm mt-1">Break periods cannot be assigned subjects.</p>
                </div>
              ) : (
                <>
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                    <select
                      value={editSubjectId}
                      onChange={e => { setEditSubjectId(e.target.value); setEditTeacherId(''); }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">— Select subject —</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teacher</label>
                    <select
                      value={editTeacherId}
                      onChange={e => setEditTeacherId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={!editSubjectId}
                    >
                      <option value="">— Select teacher —</option>
                      {getTeachersForSubject(editSubjectId).map(a => (
                        <option key={a.teacher_id} value={a.teacher_id}>{a.teacher_name}</option>
                      ))}
                    </select>
                    {editSubjectId && getTeachersForSubject(editSubjectId).length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        <i className="ri-information-line mr-1"></i>
                        No teacher assigned to this subject for this class yet.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center gap-3">
              {!editModal.period.isBreak && (
                <>
                  <button
                    onClick={handleSavePeriod}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm disabled:opacity-60 whitespace-nowrap"
                  >
                    {saving ? <><i className="ri-loader-4-line animate-spin mr-1.5"></i>Saving...</> : <><i className="ri-save-line mr-1.5"></i>Save Period</>}
                  </button>
                  {editModal.existing && (
                    <button
                      onClick={handleDeletePeriod}
                      disabled={saving}
                      className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-60 whitespace-nowrap"
                    >
                      <i className="ri-delete-bin-line mr-1.5"></i>Clear
                    </button>
                  )}
                </>
              )}
              <button
                onClick={closeEditModal}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-delete-bin-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Clear Timetable?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will delete all periods for <strong>{selectedClass?.name}</strong>. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClearAll}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm whitespace-nowrap"
              >
                {saving ? 'Clearing...' : 'Yes, Clear All'}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
