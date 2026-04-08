import { useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useClasses } from '../../../hooks/useClasses';
import { useSubjects } from '../../../hooks/useSubjects';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { classes, loading: classesLoading } = useClasses(schoolId);
  const { subjects, loading: subjectsLoading } = useSubjects(schoolId);
  const { assignments, loading: assignmentsLoading } = useTeacherAssignments(schoolId);

  const teacherCount = useMemo(() => {
    const ids = new Set(assignments.map((a) => a.teacher_id));
    return ids.size;
  }, [assignments]);

  const stats = [
    {
      label: 'Classes',
      value: classesLoading ? '...' : String(classes.length),
      icon: 'ri-building-line',
      action: () => setActiveTab('classes'),
    },
    {
      label: 'Subjects',
      value: subjectsLoading ? '...' : String(subjects.length),
      icon: 'ri-book-open-line',
      action: () => setActiveTab('subjects'),
    },
    {
      label: 'Teacher Assignments',
      value: assignmentsLoading ? '...' : String(assignments.length),
      icon: 'ri-user-settings-line',
      action: () => setActiveTab('teacher-assignments'),
    },
    {
      label: 'Active Teachers',
      value: assignmentsLoading ? '...' : String(teacherCount),
      icon: 'ri-user-star-line',
      action: () => setActiveTab('teacher-assignments'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Dean Dashboard</h2>
        <p className="text-sm text-white/90 mt-1">Manage classes, subjects, and teacher allocations for your school.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={s.action}
            className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <i className={`${s.icon} text-2xl text-teal-600`}></i>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveTab('classes')} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium">Manage Classes</button>
          <button onClick={() => setActiveTab('subjects')} className="px-4 py-2 rounded-lg bg-teal-50 text-teal-700 text-sm font-medium border border-teal-200">Manage Subjects</button>
          <button onClick={() => setActiveTab('teacher-assignments')} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium">Assign Teachers</button>
        </div>
      </div>
    </div>
  );
}
