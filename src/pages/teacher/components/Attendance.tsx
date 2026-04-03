import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useAttendance } from '../../../hooks/useAttendance';
import { supabase } from '../../../lib/supabase';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  status?: 'present' | 'absent' | 'late';
  remarks?: string;
}

export default function Attendance() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { assignments, loading: classesLoading } = useTeacherAssignments(user?.school_id, user?.id);

  // Derive a unique list of classes the teacher is assigned to
  const classes = useMemo(() => {
    const seen = new Set<string>();
    return assignments
      .filter(a => {
        if (seen.has(a.class_id)) return false;
        seen.add(a.class_id);
        return true;
      })
      .map(a => ({ id: a.class_id, name: a.class_name || 'Unknown' }));
  }, [assignments]);
  const { attendance, loading: attendanceLoading, refetch: refetchAttendance } = useAttendance({
    schoolId: user?.school_id ?? null,
    classId: selectedClass || undefined,
    date: selectedDate || undefined,
  });

  // Load students when class is selected
  useEffect(() => {
    if (!selectedClass || !user?.school_id) {
      setStudents([]);
      return;
    }

    const loadStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, student_id, full_name')
          .eq('school_id', user.school_id)
          .eq('class_id', selectedClass)
          .order('full_name');

        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        console.error('Error loading students:', error);
        setErrorMessage('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass, user?.school_id]);

  // Merge attendance data with students when attendance is loaded
  useEffect(() => {
    if (!attendance.length || !students.length) return;

    const studentsWithAttendance = students.map(student => {
      const studentAttendance = attendance.find(a => a.student_id === student.id);
      return {
        ...student,
        status: studentAttendance?.status || undefined,
        remarks: studentAttendance?.remarks || undefined
      };
    });

    setStudents(studentsWithAttendance);
  }, [attendance]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, status } : student
    ));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, remarks } : student
    ));
  };

  const handleMarkAll = (status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(student => ({ ...student, status })));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedDate) {
      setErrorMessage('Please select class and date');
      return;
    }

    const unmarkedStudents = students.filter(s => !s.status);
    if (unmarkedStudents.length > 0) {
      setErrorMessage(`Please mark attendance for all students (${unmarkedStudents.length} unmarked)`);
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const attendanceRecords = students.map(student => ({
        school_id: user?.school_id,
        student_id: student.id,
        class_id: selectedClass,
        date: selectedDate,
        status: student.status!,
        remarks: student.remarks || null,
        marked_by: user?.id
      }));

      // Delete existing records for this class and date
      await supabase
        .from('attendance')
        .delete()
        .eq('school_id', user?.school_id)
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;

      setSuccessMessage(`Attendance saved successfully for ${students.length} students`);
      refetchAttendance();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      setErrorMessage('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats
  const stats = {
    total: students.length,
    present: students.filter(s => s.status === 'present').length,
    absent: students.filter(s => s.status === 'absent').length,
    late: students.filter(s => s.status === 'late').length
  };

  const attendanceRate = stats.total > 0 
    ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
    : '0.0';

  const isFormValid = selectedClass && selectedDate && students.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold text-gray-900">Attendance</h2>
          <p className="text-sm text-gray-600 mt-1">Mark daily attendance for your classes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setStudents([]);
              }}
              disabled={classesLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth"
            >
              <option value="">Choose a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth"
            />
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <i className="ri-checkbox-circle-line text-lg"></i>
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <i className="ri-error-warning-line text-lg"></i>
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="ri-group-line text-xl text-gray-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.present}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <i className="ri-checkbox-circle-line text-xl text-emerald-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="ri-close-circle-line text-xl text-red-600"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.late}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="ri-time-line text-xl text-yellow-600"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {selectedClass && selectedDate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Student Attendance</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? 'Loading students...' : `${students.length} students • ${attendanceRate}% attendance rate`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarkAll('present')}
                  disabled={loading || students.length === 0}
                  className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-smooth text-sm font-medium whitespace-nowrap"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll('absent')}
                  disabled={loading || students.length === 0}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-smooth text-sm font-medium whitespace-nowrap"
                >
                  Mark All Absent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || saving || loading}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-smooth flex items-center gap-2 whitespace-nowrap"
                >
                  {saving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line"></i>
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading || attendanceLoading ? (
            <div className="p-12 text-center">
              <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
              <p className="text-gray-600 mt-4">Loading students and attendance...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <i className="ri-user-line text-4xl text-gray-400"></i>
              <p className="text-gray-600 mt-4">No students found in this class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Roll No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-smooth">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap ${
                              student.status === 'present'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <i className="ri-checkbox-circle-line mr-1"></i>
                            Present
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap ${
                              student.status === 'absent'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <i className="ri-close-circle-line mr-1"></i>
                            Absent
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap ${
                              student.status === 'late'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <i className="ri-time-line mr-1"></i>
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={student.remarks || ''}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          placeholder="Optional remarks..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!selectedClass && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-teal-600 text-xl mt-0.5"></i>
            <div>
              <h4 className="text-sm font-semibold text-teal-900 mb-2">How to mark attendance:</h4>
              <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
                <li>Select a class and date from the dropdowns above</li>
                <li>Mark each student as Present, Absent, or Late</li>
                <li>Use "Mark All Present" or "Mark All Absent" for quick marking</li>
                <li>Add optional remarks for any student (e.g., "Sick", "Family emergency")</li>
                <li>Click "Save Attendance" to submit all records at once</li>
                <li>You can edit and resubmit attendance for the same date</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}