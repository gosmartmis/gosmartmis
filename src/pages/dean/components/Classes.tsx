import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useClasses } from '../../../hooks/useClasses';
import { useAcademicYears } from '../../../hooks/useAcademicYears';

type Teacher = { id: string; full_name: string };

export default function Classes() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { classes, loading, refetch } = useClasses(schoolId);
  const { academicYears, activeYear } = useAcademicYears(schoolId);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    level: '',
    capacity: '40',
    academic_year_id: '',
    class_teacher_id: '',
  });

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

  useEffect(() => {
    if (!form.academic_year_id && activeYear?.id) {
      setForm((prev) => ({ ...prev, academic_year_id: activeYear.id }));
    }
  }, [activeYear?.id]);

  const teacherMap = useMemo(() => {
    const m = new Map<string, string>();
    teachers.forEach((t) => m.set(t.id, t.full_name));
    return m;
  }, [teachers]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      level: '',
      capacity: '40',
      academic_year_id: activeYear?.id || academicYears[0]?.id || '',
      class_teacher_id: '',
    });
    setShowModal(true);
    setError(null);
  };

  const openEdit = (cls: any) => {
    setEditingId(cls.id);
    setForm({
      name: cls.name || '',
      level: cls.level || '',
      capacity: String(cls.capacity ?? 40),
      academic_year_id: cls.academic_year_id || activeYear?.id || '',
      class_teacher_id: cls.class_teacher_id || '',
    });
    setShowModal(true);
    setError(null);
  };

  const saveClass = async () => {
    if (!schoolId) return;
    if (!form.name.trim() || !form.level.trim() || !form.academic_year_id) {
      setError('Name, level and academic year are required.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        level: form.level.trim(),
        capacity: Number(form.capacity) || 40,
        school_id: schoolId,
        academic_year_id: form.academic_year_id,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('classes')
          .update(payload)
          .eq('id', editingId)
          .eq('school_id', schoolId);
        if (updateError) throw updateError;

        if (form.class_teacher_id) {
          // Optional: if schema includes class_teacher_id, persist it.
          await supabase
            .from('classes')
            .update({ class_teacher_id: form.class_teacher_id } as any)
            .eq('id', editingId)
            .eq('school_id', schoolId);
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('classes')
          .insert(payload)
          .select('id')
          .maybeSingle();
        if (insertError) throw insertError;

        if (inserted?.id && form.class_teacher_id) {
          // Optional: if schema includes class_teacher_id, persist it.
          await supabase
            .from('classes')
            .update({ class_teacher_id: form.class_teacher_id } as any)
            .eq('id', inserted.id)
            .eq('school_id', schoolId);
        }
      }

      setShowModal(false);
      await refetch();
    } catch (e: any) {
      setError(e?.message || 'Failed to save class');
    } finally {
      setBusy(false);
    }
  };

  const deleteClass = async (id: string) => {
    if (!schoolId) return;
    if (!confirm('Delete this class?')) return;
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
    if (!deleteError) await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
          <p className="text-sm text-gray-500">Create, edit, delete classes and set class teacher.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium">
          <i className="ri-add-line mr-1"></i>New Class
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Level</th>
              <th className="px-4 py-3 text-left">Capacity</th>
              <th className="px-4 py-3 text-left">Class Teacher</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No classes yet.</td></tr>
            ) : classes.map((cls: any) => (
              <tr key={cls.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-gray-900">{cls.name}</td>
                <td className="px-4 py-3 text-gray-700">{cls.level || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{cls.capacity ?? '-'}</td>
                <td className="px-4 py-3 text-gray-700">{teacherMap.get(cls.class_teacher_id) || 'Not set'}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(cls)} className="px-3 py-1.5 rounded border border-gray-300">Edit</button>
                  <button onClick={() => deleteClass(cls.id)} className="px-3 py-1.5 rounded bg-red-50 text-red-700 border border-red-200">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Class' : 'Create Class'}</h3>
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Class name" className="px-3 py-2 border border-gray-300 rounded" />
              <input value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} placeholder="Level" className="px-3 py-2 border border-gray-300 rounded" />
              <input type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="Capacity" className="px-3 py-2 border border-gray-300 rounded" />
              <select value={form.academic_year_id} onChange={(e) => setForm((p) => ({ ...p, academic_year_id: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded">
                <option value="">Select academic year</option>
                {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Class Teacher (optional)</label>
              <select value={form.class_teacher_id} onChange={(e) => setForm((p) => ({ ...p, class_teacher_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">Not set</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded border border-gray-300">Cancel</button>
              <button onClick={saveClass} disabled={busy} className="px-4 py-2 rounded bg-teal-600 text-white">{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
