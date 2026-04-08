import { useState, useEffect, useCallback } from 'react';
import { supabase, invokeAuthedEdgeFunction } from '../../../lib/supabase';
import { School } from '../../../hooks/useSchools';

interface DirectorProfile {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  avatar_url: string | null;
}

interface Props {
  school: School;
  onClose: () => void;
  onDirectorChanged?: () => void;
}

async function callEdgeFunction(payload: object) {
  return invokeAuthedEdgeFunction('manage-school-user', payload);
}

export default function DirectorManageModal({ school, onClose, onDirectorChanged }: Props) {
  const [director, setDirector] = useState<DirectorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const fetchDirector = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', school.id)
      .eq('role', 'director')
      .maybeSingle();

    setDirector(data ?? null);
  }, [school.id]);

  useEffect(() => {
    fetchDirector();
  }, [fetchDirector]);

  const handleCreate = async () => {
    if (!email.trim()) {
      alert("Enter email first");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || 'Director';

    try {
      setLoading(true);

      await callEdgeFunction({
        action: 'create',
        school_id: school.id,
        school_name: school.name,
        school_slug: school.slug,
        director_name: cleanName,
        director_email: cleanEmail,
      });

      alert("Director created ✅");

      await fetchDirector();
      onDirectorChanged?.();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">

        <h2 className="text-lg font-bold">Manage Director</h2>

        {director ? (
          <div className="p-3 border rounded">
            <p><b>Name:</b> {director.full_name}</p>
            <p><b>Email:</b> {director.email}</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Director name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <input
              type="email"
              placeholder="Director email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-teal-600 text-white p-2 rounded"
            >
              {loading ? "Creating..." : "Create Director"}
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-gray-200 p-2 rounded"
        >
          Close
        </button>

      </div>
    </div>
  );
}