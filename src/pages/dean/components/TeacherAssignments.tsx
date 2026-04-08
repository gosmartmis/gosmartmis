import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useClasses } from '../../../hooks/useClasses';
import { useSubjects } from '../../../hooks/useSubjects';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useAcademicYears } from '../../../hooks/useAcademicYears';

type Teacher = { id: string; full_name: string };

export default function TeacherAssignments() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { classes } = useClasses(schoolId);
  const { subjects } = useSubjects(schoolId);
  const { assignments, loading, refetch } = useTeacherAssignments(schoolId);
  const { activeYear } = useAcademicYears(schoolId);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .order('full_name')
      .then(({ data }) => setTeachers((data || []) as Teacher[]));
  }, [schoolId]);

  const byId = useMemo(() => {
    const classesMap = new Map(classes.map((c) => [c.id, c.name]));
    const subjectsMap = new Map(subjects.map((s) => [s.id, s.name]));
    const teachersMap = new Map(teachers.map((t) => [t.id, t.full_name]));
    return { classesMap, subjectsMap, teachersMap };
  }, [classes, subjects, teachers]);

  const createAssignment = async () => {
    if (!schoolId) return;
    if (!classId || !subjectId || !teacherId) {
      setError('Class, subject and teacher are required.');
      return;
    }
    if (!activeYear?.id) {
      setError('No active academic year found.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const duplicate = assignments.find(
        (a) => a.class_id === classId && a.subject_id === subjectId && a.teacher_id === teacherId
      );
      if (duplicate) {
        setError('This assignment already exists.');
        return;
      }

      const { error: insertError } = await supabase.from('teacher_assignments').insert({
        school_id: schoolId,
        class_id: classId,
        subject_id: subjectId,
        teacher_id: teacherId,
        academic_year_id: activeYear.id,
      });
      if (insertError) throw insertError;

      setClassId('');
      setSubjectId('');
      setTeacherId('');
      await refetch();
    } catch (e: any) {
      setError(e?.message || 'Failed to assign teacher');
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (id: string) => {
    if (!schoolId) return;
    if (!confirm('Remove this assignment?')) return;
    const { error: deleteError } = await supabase
      .from('teacher_assignments')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
    if (!deleteError) await refetch();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Assignments</h2>
        <p className="text-sm text-gray-500">Assign teacher to class and subject (school-scoped only).</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
            <option value="">Select class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
            <option value="">Select teacher</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
        <div className="flex justify-end">
          <button onClick={createAssignment} disabled={busy} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium">
            {busy ? 'Assigning...' : 'Assign Teacher'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Class</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Teacher</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No assignments yet.</td></tr>
            ) : assignments.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-3">{a.class_name || byId.classesMap.get(a.class_id) || '-'}</td>
                <td className="px-4 py-3">{a.subject_name || byId.subjectsMap.get(a.subject_id) || '-'}</td>
                <td className="px-4 py-3">{a.teacher_name || byId.teachersMap.get(a.teacher_id) || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeAssignment(a.id)} className="px-3 py-1.5 rounded bg-red-50 text-red-700 border border-red-200">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
