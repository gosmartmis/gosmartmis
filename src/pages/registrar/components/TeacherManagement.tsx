import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import CsvImportModal from './CsvImportModal';

type TabType = 'profiles' | 'assignments' | 'directory';

export default function TeacherManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('profiles');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const { schoolInfo } = useTenant();

  useEffect(() => {
    if (schoolInfo?.id) {
      fetchTeachers();
      fetchAssignments();
      fetchClasses();
      fetchSubjects();
    }
  }, [schoolInfo?.id]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          teacher_assignments (
            id,
            class_id,
            subject_id,
            classes (
              name
            ),
            subjects (
              name
            )
          )
        `)
        .eq('school_id', schoolInfo?.id)
        .eq('role', 'teacher')
        .order('full_name');

      if (error) throw error;

      const formattedTeachers = (data || []).map((teacher: any) => {
        const assignedClasses = Array.from(
          new Set(
            teacher.teacher_assignments?.map((a: any) => a.classes?.name).filter(Boolean)
          )
        );
        const primarySubject = teacher.teacher_assignments?.[0]?.subjects?.name || 'N/A';

        return {
          id: teacher.id,
          name: teacher.full_name || 'N/A',
          email: teacher.email,
          phone: teacher.phone || 'N/A',
          subject: primarySubject,
          qualification: 'Bachelor of Education',
          assignedClasses,
        };
      });

      setTeachers(formattedTeachers);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          class_id,
          subject_id,
          teacher_id,
          classes (
            name
          ),
          subjects (
            name
          ),
          profiles (
            full_name
          )
        `)
        .eq('school_id', schoolInfo?.id);

      if (error) throw error;

      const formattedAssignments = (data || []).map((assignment: any) => ({
        id: assignment.id,
        className: assignment.classes?.name || 'N/A',
        subject: assignment.subjects?.name || 'N/A',
        teacherName: assignment.profiles?.full_name || 'N/A',
        teacherId: assignment.teacher_id,
      }));

      setAssignments(formattedAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', schoolInfo?.id)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('school_id', schoolInfo?.id)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage teacher profiles and class assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 text-sm font-medium rounded-lg hover:bg-teal-100 flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-file-upload-line"></i>
            Bulk Import CSV
          </button>
          <button
            onClick={() => setShowAddTeacher(true)}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i>
            Add Teacher
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'profiles'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Teacher Profiles
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Class Assignments
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Teacher Directory
        </button>
      </div>

      {/* Teacher Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Teachers ({teachers.length})</h2>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-xs text-gray-500">{teacher.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {teacher.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{teacher.qualification}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignedClasses.length > 0 ? (
                            teacher.assignedClasses.map((cls: string) => (
                              <span key={cls} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                {cls}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No classes</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <i className="ri-mail-line text-xs"></i>
                            <span className="text-xs">{teacher.email}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <i className="ri-phone-line text-xs"></i>
                            <span className="text-xs">{teacher.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="text-teal-600 hover:text-teal-700 w-8 h-8 flex items-center justify-center">
                            <i className="ri-edit-line"></i>
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 w-8 h-8 flex items-center justify-center">
                            <i className="ri-more-2-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <i className="ri-user-search-line text-5xl mb-3"></i>
                      <p className="text-lg font-medium">No teachers found</p>
                      <p className="text-sm mt-1">Try adjusting your search</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Class Assignments Tab */}
      {activeTab === 'assignments' && (
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Class-Subject Assignment Matrix</h2>
                <p className="text-sm text-gray-600 mt-1">View and manage teacher assignments across classes and subjects</p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 flex items-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line"></i>
                New Assignment
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Class</th>
                  {subjects.map((subject) => (
                    <th key={subject.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {subject.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">{cls.name}</td>
                    {subjects.map((subject) => {
                      const assignment = assignments.find(
                        (a) => a.className === cls.name && a.subject === subject.name
                      );
                      return (
                        <td key={subject.id} className="px-4 py-3">
                          {assignment ? (
                            <div className="flex items-center justify-between gap-2 bg-teal-50 px-2 py-1 rounded">
                              <span className="text-xs text-teal-900 truncate">{assignment.teacherName}</span>
                              <button className="text-red-600 hover:text-red-700 w-5 h-5 flex items-center justify-center flex-shrink-0">
                                <i className="ri-close-line text-sm"></i>
                              </button>
                            </div>
                          ) : (
                            <button className="text-gray-400 hover:text-teal-600 text-xs flex items-center gap-1 whitespace-nowrap">
                              <i className="ri-add-line"></i>
                              Assign
                            </button>
                          )}
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

      {/* Teacher Directory Tab */}
      {activeTab === 'directory' && (
        <div>
          <div className="mb-6">
            <div className="relative max-w-md">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {teacher.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{teacher.name}</h3>
                      <p className="text-sm text-teal-600 font-medium mt-0.5">{teacher.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{teacher.qualification}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="ri-mail-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-xs truncate">{teacher.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="ri-phone-line text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                      <span className="text-xs">{teacher.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Assigned Classes:</div>
                    <div className="flex flex-wrap gap-1">
                      {teacher.assignedClasses.length > 0 ? (
                        teacher.assignedClasses.map((cls: string) => (
                          <span key={cls} className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded font-medium">
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No classes assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-teal-50 text-teal-600 text-sm font-medium rounded-lg hover:bg-teal-100 whitespace-nowrap">
                      View Profile
                    </button>
                    <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 w-10 h-10 flex items-center justify-center">
                      <i className="ri-more-2-fill"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                <i className="ri-user-search-line text-5xl mb-3"></i>
                <p className="text-lg font-medium">No teachers found</p>
                <p className="text-sm mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImport && schoolInfo?.id && (
        <CsvImportModal
          schoolId={schoolInfo.id}
          defaultTab="teachers"
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); fetchTeachers(); }}
        />
      )}

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Teacher</h2>
                <button
                  onClick={() => setShowAddTeacher(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter teacher's full name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="teacher@elite.gosmartmis.rw"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+250788000000"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Specialization</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g., Bachelor of Education"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Classes (Optional)</label>
                  <div className="grid grid-cols-6 gap-2">
                    {classes.map((cls) => (
                      <label key={cls.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddTeacher(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 whitespace-nowrap">
                Add Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">New Assignment</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 whitespace-nowrap">
                Assign Teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}