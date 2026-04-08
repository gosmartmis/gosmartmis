import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { useClasses } from '../../../hooks/useClasses';

export default function EnrollmentManagement() {
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regNumberMap, setRegNumberMap] = useState<Record<string, string>>({}); // profile_id → reg_number
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    national_id: '',
    blood_group: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    class_id: '',
    previous_school: '',
    enrollment_date: '',
    status: 'active',
  });
  
  const { schoolRecord } = useTenant();
  const schoolInfo = schoolRecord ? { id: schoolRecord.id, name: schoolRecord.name } : null;
  const { classes, loading: classesLoading } = useClasses(schoolInfo?.id || null);

  useEffect(() => {
    if (schoolInfo?.id) {
      fetchStudents();
      fetchPendingEnrollments();
      fetchRegNumbers();
    }
  }, [schoolInfo?.id, selectedGrade]);

  const fetchRegNumbers = async () => {
    if (!schoolInfo?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, registration_number')
      .eq('school_id', schoolInfo.id)
      .eq('role', 'student')
      .not('registration_number', 'is', null);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((p: any) => { if (p.registration_number) map[p.id] = p.registration_number; });
      setRegNumberMap(map);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('students')
        .select(`
          id,
          full_name,
          parent_name,
          parent_phone,
          created_at,
          status,
          class_id,
          profile_id,
          classes (
            id,
            name,
            capacity
          )
        `)
        .eq('school_id', schoolInfo?.id)
        .neq('status', 'pending');

      if (selectedGrade !== 'all') {
        query = query.eq('class_id', selectedGrade);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          parent_name,
          parent_phone,
          created_at,
          status,
          class_id,
          classes (
            id,
            name
          )
        `)
        .eq('school_id', schoolInfo?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingStudents(data || []);
    } catch (err) {
      console.error('Error fetching pending enrollments:', err);
    }
  };

  const handleApprove = async (studentId: string) => {
    try {
      if (!schoolInfo?.id) return;
      const { error } = await supabase
        .from('students')
        .update({ status: 'active' })
        .eq('id', studentId)
        .eq('school_id', schoolInfo.id);

      if (error) throw error;

      // Refresh both lists
      await fetchStudents();
      await fetchPendingEnrollments();
    } catch (err) {
      console.error('Error approving enrollment:', err);
      alert('Failed to approve enrollment. Please try again.');
    }
  };

  const handleReject = async (studentId: string) => {
    try {
      if (!schoolInfo?.id) return;
      const { error } = await supabase
        .from('students')
        .update({ status: 'rejected' })
        .eq('id', studentId)
        .eq('school_id', schoolInfo.id);

      if (error) throw error;

      // Refresh pending list
      await fetchPendingEnrollments();
    } catch (err) {
      console.error('Error rejecting enrollment:', err);
      alert('Failed to reject enrollment. Please try again.');
    }
  };

  // Calculate enrollment stats by grade
  const enrollmentByGrade = classes?.map((cls) => {
    const enrolledCount = students.filter((s) => s.class_id === cls.id).length;
    return {
      id: cls.id,
      grade: cls.name,
      target: cls.capacity || 30,
      enrolled: enrolledCount,
      pending: 0,
      sections: [cls.name],
    };
  }) || [];

  const filteredStudents = students.filter((student) => {
    const fullName = (student.full_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const regNum = (student.profile_id ? regNumberMap[student.profile_id] || '' : '').toLowerCase();
    return fullName.includes(query)
      || (student.classes?.name || '').toLowerCase().includes(query)
      || regNum.includes(query);
  });

  const openProfileEditor = (student: any) => {
    setEditingStudent(student);
    setProfileError(null);
    setProfileForm({
      full_name: student.full_name || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      national_id: student.national_id || '',
      blood_group: student.blood_group || '',
      address: student.address || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      class_id: student.class_id || '',
      previous_school: student.previous_school || '',
      enrollment_date: student.enrollment_date || '',
      status: student.status || 'active',
    });
  };

  const saveProfile = async () => {
    if (!editingStudent?.id || !schoolInfo?.id) return;
    if (!profileForm.full_name.trim()) {
      setProfileError('Student full name is required.');
      return;
    }
    if (!profileForm.class_id) {
      setProfileError('Class is required.');
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError(null);
      const { error } = await supabase
        .from('students')
        .update({
          full_name: profileForm.full_name.trim(),
          date_of_birth: profileForm.date_of_birth || null,
          gender: profileForm.gender || null,
          national_id: profileForm.national_id || null,
          blood_group: profileForm.blood_group || null,
          address: profileForm.address || null,
          parent_name: profileForm.parent_name || null,
          parent_phone: profileForm.parent_phone || null,
          parent_email: profileForm.parent_email || null,
          class_id: profileForm.class_id,
          previous_school: profileForm.previous_school || null,
          enrollment_date: profileForm.enrollment_date || null,
          status: profileForm.status || 'active',
        })
        .eq('id', editingStudent.id)
        .eq('school_id', schoolInfo.id);
      if (error) throw error;

      setEditingStudent(null);
      await fetchStudents();
      await fetchPendingEnrollments();
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update student profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (classesLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enrollment Management</h2>
          <p className="text-sm text-gray-600">Manage student enrollments and class assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by name, class or reg number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap">
            <i className="ri-download-line"></i>
            Export
          </button>
        </div>
      </div>

      {/* Grade Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollmentByGrade.map((grade) => {
          const percentage = Math.round((grade.enrolled / grade.target) * 100);
          return (
            <div 
              key={grade.id} 
              onClick={() => setSelectedGrade(selectedGrade === grade.id ? 'all' : grade.id)}
              className={`bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer ${
                selectedGrade === grade.id 
                  ? 'border-teal-500 ring-2 ring-teal-200' 
                  : 'border-gray-100 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{grade.grade}</h3>
                  <p className="text-sm text-gray-600">{grade.sections.length} section{grade.sections.length !== 1 ? 's' : ''}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  percentage >= 90 ? 'bg-green-100 text-green-700' :
                  percentage >= 70 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {percentage}%
                </div>
              </div>
              <div className="mb-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      percentage >= 90 ? 'bg-green-500' :
                      percentage >= 70 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{grade.enrolled} enrolled</span>
                <span className="text-gray-400">{grade.target} capacity</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Students List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedGrade === 'all' ? 'All Students' : `Students in ${classes?.find(c => c.id === selectedGrade)?.name}`}
              <span className="ml-2 text-sm font-normal text-gray-500">({filteredStudents.length})</span>
            </h3>
            {selectedGrade !== 'all' && (
              <button
                onClick={() => setSelectedGrade('all')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap"
              >
                View All Classes
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(student.full_name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {student.full_name}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-sm text-gray-600">
                          {student.classes?.name} · Parent: {student.parent_name || 'N/A'}
                        </span>
                        {student.profile_id && regNumberMap[student.profile_id] && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-mono font-semibold">
                            <i className="ri-hashtag text-xs"></i>
                            {regNumberMap[student.profile_id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                      student.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status || 'Active'}
                    </span>
                    <button
                      onClick={() => openProfileEditor(student)}
                      className="text-teal-600 hover:text-teal-700 w-8 h-8 flex items-center justify-center"
                      title="Complete profile"
                    >
                      <i className="ri-more-2-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <i className="ri-user-search-line text-5xl mb-3"></i>
              <p className="text-lg font-medium">No students found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Enrollments */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Pending Enrollments
              {pendingStudents.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {pendingStudents.length}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">New admissions awaiting approval</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingStudents.length > 0 ? (
            pendingStudents.map((student) => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {(student.full_name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {student.full_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-teal-600 font-medium">{student.classes?.name || 'No class assigned'}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <i className="ri-user-line mr-1"></i>
                        Parent: {student.parent_name || 'N/A'}
                        {student.parent_phone && ` • ${student.parent_phone}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      Pending
                    </span>
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(student.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button 
                        onClick={() => handleApprove(student.id)}
                        className="px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(student.id)}
                        className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-500">
              <i className="ri-user-check-line text-5xl mb-3"></i>
              <p className="text-lg font-medium">No pending enrollments</p>
              <p className="text-sm mt-1">All enrollment requests have been processed</p>
            </div>
          )}
        </div>
      </div>

      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Complete Student Profile</h3>
                <p className="text-xs text-gray-500 mt-1">Update student details and class assignment</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700">
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {profileError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{profileError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={profileForm.full_name} onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <select value={profileForm.class_id} onChange={(e) => setProfileForm((p) => ({ ...p, class_id: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Select class</option>
                  {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
                <input type="date" value={profileForm.date_of_birth || ''} onChange={(e) => setProfileForm((p) => ({ ...p, date_of_birth: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                <select value={profileForm.gender || ''} onChange={(e) => setProfileForm((p) => ({ ...p, gender: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input value={profileForm.national_id || ''} onChange={(e) => setProfileForm((p) => ({ ...p, national_id: e.target.value }))} placeholder="National ID" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <input value={profileForm.blood_group || ''} onChange={(e) => setProfileForm((p) => ({ ...p, blood_group: e.target.value }))} placeholder="Blood group" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <input value={profileForm.parent_name || ''} onChange={(e) => setProfileForm((p) => ({ ...p, parent_name: e.target.value }))} placeholder="Parent/Guardian name" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <input value={profileForm.parent_phone || ''} onChange={(e) => setProfileForm((p) => ({ ...p, parent_phone: e.target.value }))} placeholder="Parent/Guardian phone" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <input value={profileForm.parent_email || ''} onChange={(e) => setProfileForm((p) => ({ ...p, parent_email: e.target.value }))} placeholder="Parent/Guardian email" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <input value={profileForm.previous_school || ''} onChange={(e) => setProfileForm((p) => ({ ...p, previous_school: e.target.value }))} placeholder="Previous school" className="px-3 py-2 border border-gray-300 rounded-lg" />
                <input type="date" value={profileForm.enrollment_date || ''} onChange={(e) => setProfileForm((p) => ({ ...p, enrollment_date: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg" />
                <select value={profileForm.status || 'active'} onChange={(e) => setProfileForm((p) => ({ ...p, status: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <textarea value={profileForm.address || ''} onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />

              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingStudent(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button onClick={saveProfile} disabled={savingProfile} className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:opacity-60">
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}