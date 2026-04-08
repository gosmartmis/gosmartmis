import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useTerms } from '../../../hooks/useTerms';
import { useMarks } from '../../../hooks/useMarks';
import { supabase } from '../../../lib/supabase';
import { notifyMarksSubmitted } from '../../../utils/notificationService';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  marks?: {
    id?: string;
    cat: number;
    exam: number;
    total: number;
  };
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export default function MarksEntry() {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { assignments, loading: classesLoading } = useTeacherAssignments(profile?.school_id, profile?.id);

  // Derive unique classes from assignments
  const classes = assignments.reduce<{ id: string; name: string }[]>((acc, a) => {
    if (!acc.find(c => c.id === a.class_id)) {
      acc.push({ id: a.class_id, name: a.class_name || 'Unknown' });
    }
    return acc;
  }, []);
  const subjects = assignments
    .filter((a) => a.class_id === selectedClass)
    .reduce<{ id: string; name: string }[]>((acc, a) => {
      if (!acc.find((s) => s.id === a.subject_id)) {
        acc.push({ id: a.subject_id, name: a.subject_name || 'Unknown' });
      }
      return acc;
    }, []);
  const { terms, loading: termsLoading } = useTerms(profile?.school_id);
  const { marks, loading: marksLoading, refetch: refetchMarks } = useMarks({
    schoolId: profile?.school_id || null,
    classId: selectedClass || undefined,
    subjectId: selectedSubject || undefined,
    termId: selectedTerm || undefined,
    teacherId: profile?.id || undefined,
  });

  // Load students when class is selected
  useEffect(() => {
    if (!selectedClass || !profile?.school_id) {
      setStudents([]);
      return;
    }

    const loadStudents = async () => {
      setLoading(true);
      try {
        const isAssigned = assignments.some(
          (a) => a.class_id === selectedClass
        );
        if (!isAssigned) {
          throw new Error('Access denied: class is not assigned to you');
        }

        const { data, error } = await supabase
          .from('students')
          .select('id, student_id, full_name')
          .eq('school_id', profile.school_id)
          .eq('class_id', selectedClass)
          .order('full_name');

        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        console.error('Error loading students:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass, profile?.school_id, assignments]);

  // Merge marks data with students when marks are loaded
  useEffect(() => {
    if (!marks.length || !students.length) return;

    const studentsWithMarks = students.map(student => {
      const studentMark = marks.find(m => m.student_id === student.id);
      return {
        ...student,
        marks: studentMark ? {
          id: studentMark.id,
          cat: 0,
          exam: Number((studentMark as any).score) || 0,
          total: Number((studentMark as any).score) || 0,
        } : undefined
      };
    });

    setStudents(studentsWithMarks);
  }, [marks]);

  const handleMarkChange = (studentId: string, field: 'cat' | 'exam', value: string) => {
    const numValue = parseFloat(value) || 0;
    
    setStudents(prev => prev.map(student => {
      if (student.id !== studentId) return student;
      
      const currentMarks = student.marks || { cat: 0, exam: 0, total: 0 };
      const updatedMarks = {
        ...currentMarks,
        [field]: numValue
      };
      updatedMarks.total = updatedMarks.cat + updatedMarks.exam;
      
      return {
        ...student,
        marks: updatedMarks
      };
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm) {
      setErrorMessage('Please select class, subject, and term');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const isAssigned = assignments.some(
        (a) => a.class_id === selectedClass && a.subject_id === selectedSubject
      );
      if (!isAssigned) {
        throw new Error('Access denied: subject is not assigned to you for this class');
      }

      const marksToSave = students
        .filter(s => s.marks && (s.marks.cat > 0 || s.marks.exam > 0))
        .map(student => {
          const totalScore = student.marks!.cat + student.marks!.exam;
          const base: Record<string, unknown> = {
            school_id: profile?.school_id,
            student_id: student.id,
            class_id: selectedClass,
            subject_id: selectedSubject,
            term_id: selectedTerm,
            score: totalScore,
            max_score: 100,
            percentage: totalScore,
            grade: getGrade(totalScore),
            teacher_id: profile?.id,
            status: 'pending',
            submitted_at: new Date().toISOString(),
          };
          if (student.marks?.id) base.id = student.marks.id;
          return base;
        });

      if (marksToSave.length === 0) {
        setErrorMessage('No marks to save');
        return;
      }

      // Split into inserts (no existing id) and updates (have existing id)
      const toInsert = marksToSave.filter(m => !m.id).map(({ id: _id, ...rest }) => rest);
      const toUpdate = marksToSave.filter(m => !!m.id);

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase.from('marks').insert(toInsert);
        if (insertErr) throw insertErr;
      }
      for (const { id, ...data } of toUpdate) {
        const { error: updateErr } = await supabase
          .from('marks')
          .update(data)
          .eq('id', id as string)
          .eq('school_id', profile?.school_id)
          .eq('teacher_id', profile?.id);
        if (updateErr) throw updateErr;
      }

      setSuccessMessage(`Successfully saved marks for ${marksToSave.length} students`);
      refetchMarks();

      // Fire notification to Dean / Director / School Manager
      if (profile?.school_id) {
        const resolvedClass = classes.find((c) => c.id === selectedClass);
        const resolvedSubject = subjects.find((s) => s.id === selectedSubject);
        notifyMarksSubmitted(
          profile.school_id,
          profile.full_name || 'A teacher',
          resolvedClass?.name || 'Unknown class',
          resolvedSubject?.name || 'Unknown subject',
          marksToSave.length,
        );
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving marks:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = selectedClass && selectedSubject && selectedTerm && students.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold text-gray-900">Marks Entry</h2>
          <p className="text-sm text-gray-600 mt-1">Enter CAT and Exam marks for your students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject('');
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

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Term Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={termsLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose a term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
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

      {/* Marks Entry Table */}
      {selectedClass && selectedSubject && selectedTerm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Student Marks</h3>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Loading students...' : `${students.length} students`}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || saving || loading}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-smooth flex items-center gap-2 whitespace-nowrap"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="ri-save-line"></i>
                  Save Marks
                </>
              )}
            </button>
          </div>

          {loading || marksLoading ? (
            <div className="p-12 text-center">
              <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
              <p className="text-gray-600 mt-4">Loading students and marks...</p>
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
                      CAT (30)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Exam (70)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total (100)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => {
                    const total = student.marks?.total || 0;
                    const grade = total >= 90 ? 'A' : total >= 80 ? 'B' : total >= 70 ? 'C' : total >= 60 ? 'D' : total >= 50 ? 'E' : 'F';
                    const gradeColor = total >= 80 ? 'text-emerald-600' : total >= 70 ? 'text-teal-600' : total >= 60 ? 'text-yellow-600' : 'text-red-600';

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-smooth">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={student.marks?.cat || ''}
                            onChange={(e) => handleMarkChange(student.id, 'cat', e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="0"
                            max="70"
                            value={student.marks?.exam || ''}
                            onChange={(e) => handleMarkChange(student.id, 'exam', e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {total.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-sm font-bold ${gradeColor}`}>
                            {total > 0 ? grade : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
              <h4 className="text-sm font-semibold text-teal-900 mb-2">How to enter marks:</h4>
              <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
                <li>Select a class, subject, and term from the dropdowns above</li>
                <li>Enter CAT marks (out of 30) and Exam marks (out of 70) for each student</li>
                <li>Total marks and grades are calculated automatically</li>
                <li>Click "Save Marks" to submit all entries at once</li>
                <li>You can edit and resubmit marks before they are approved</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}