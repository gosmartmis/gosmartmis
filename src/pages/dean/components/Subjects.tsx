import { useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useSubjects } from '../../../hooks/useSubjects';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';

export default function Subjects({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { subjects, loading, refetch } = useSubjects(schoolId);
  const { assignments } = useTeacherAssignments(schoolId);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const classCounts = useMemo(() => {
    const map = new Map<string, Set<string>>();
    assignments.forEach((a) => {
      if (!a.subject_id || !a.class_id) return;
      if (!map.has(a.subject_id)) map.set(a.subject_id, new Set<string>());
      map.get(a.subject_id)!.add(a.class_id);
    });
    return map;
  }, [assignments]);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setError(null);
    setShowModal(true);
  };

  const openEdit = (s: { id: string; name: string; code: string }) => {
    setEditingId(s.id);
    setName(s.name || '');
    setCode(s.code || '');
    setError(null);
    setShowModal(true);
  };

  const saveSubject = async () => {
    if (!schoolId) return;
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from('subjects')
          .update({ name: name.trim(), code: code.trim() || null })
          .eq('id', editingId)
          .eq('school_id', schoolId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subjects')
          .insert({ name: name.trim(), code: code.trim() || null, school_id: schoolId });
        if (insertError) throw insertError;
      }
      setShowModal(false);
      await refetch();
    } catch (e: any) {
      setError(e?.message || 'Failed to save subject');
    } finally {
      setBusy(false);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!schoolId) return;
    if (!confirm('Delete this subject?')) return;
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('school_id', schoolId);
    if (!deleteError) await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subjects</h2>
          <p className="text-sm text-gray-500">Create and manage subjects. Assign them to classes from Teacher Assignments.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('teacher-assignments')} className="px-4 py-2 rounded-lg border border-teal-300 text-teal-700 text-sm font-medium">
            Assign to Classes
          </button>
          <button onClick={openCreate} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium">
            <i className="ri-add-line mr-1"></i>New Subject
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Assigned Classes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : subjects.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No subjects yet.</td></tr>
            ) : subjects.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-700">{s.code || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{classCounts.get(s.id)?.size || 0}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEdit(s)} className="px-3 py-1.5 rounded border border-gray-300">Edit</button>
                  <button onClick={() => deleteSubject(s.id)} className="px-3 py-1.5 rounded bg-red-50 text-red-700 border border-red-200">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Subject' : 'Create Subject'}</h3>
            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name" className="w-full px-3 py-2 border border-gray-300 rounded" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Subject code (optional)" className="w-full px-3 py-2 border border-gray-300 rounded" />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded border border-gray-300">Cancel</button>
              <button onClick={saveSubject} disabled={busy} className="px-4 py-2 rounded bg-teal-600 text-white">{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
