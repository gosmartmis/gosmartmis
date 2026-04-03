import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTeacherClasses } from '../../../hooks/useTeacherClasses';

export default function MyClasses() {
  const { profile } = useAuth();
  const schoolId = profile?.school_id || null;
  const teacherId = profile?.id || null;

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { classes, students, loading, error, fetchStudentsByClass } = useTeacherClasses(
    schoolId,
    teacherId
  );

  // Load students when a class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass);
    }
  }, [selectedClass]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClassData = classes.find(c => c.class_id === selectedClass);

  return (
    <div className="space-y-6">
      {!selectedClass ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
              <p className="text-gray-600 mt-1">Manage your assigned classes and students</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium whitespace-nowrap">
                {loading ? '...' : classes.length} Classes Assigned
              </span>
            </div>
          </div>

          {/* Classes Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <i className="ri-loader-4-line text-4xl mb-3 animate-spin"></i>
              <p className="text-sm">Loading your classes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <i className="ri-error-warning-line text-4xl mb-3"></i>
              <p className="text-sm">{error}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="ri-book-line text-4xl mb-3"></i>
              <p className="text-sm">No classes assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((cls) => (
                <div 
                  key={cls.id} 
                  onClick={() => setSelectedClass(cls.class_id)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                        <span className="text-2xl font-bold">{cls.class_name.substring(0, 3)}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{cls.class_name}</h3>
                        <p className="text-gray-600">{cls.subject_name}</p>
                      </div>
                    </div>
                    <i className="ri-arrow-right-line text-gray-400 group-hover:text-teal-500 text-xl w-6 h-6 flex items-center justify-center"></i>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="ri-user-3-line w-4 h-4 flex items-center justify-center"></i>
                      {cls.students_count} Students
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="ri-map-pin-line w-4 h-4 flex items-center justify-center"></i>
                      {cls.room}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                      <i className="ri-time-line w-4 h-4 flex items-center justify-center"></i>
                      {cls.schedule}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Avg Score</span>
                        <span className="font-bold text-gray-900">{cls.average_score}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                          style={{ width: `${cls.average_score}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Attendance</span>
                        <span className="font-bold text-gray-900">{cls.attendance_rate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                          style={{ width: `${cls.attendance_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Class Detail View */}
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => {
                setSelectedClass(null);
                setSearchQuery('');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="ri-arrow-left-line text-xl w-6 h-6 flex items-center justify-center"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedClassData?.class_name} - {selectedClassData?.subject_name}
              </h2>
              <p className="text-gray-600">
                {selectedClassData?.students_count} Students • {selectedClassData?.room} • {selectedClassData?.schedule}
              </p>
            </div>
          </div>

          {/* Class Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { 
                label: 'Total Students', 
                value: selectedClassData?.students_count.toString() || '0', 
                icon: 'ri-user-3-line', 
                color: 'teal' 
              },
              { 
                label: 'Average Score', 
                value: `${selectedClassData?.average_score || 0}%`, 
                icon: 'ri-bar-chart-line', 
                color: 'emerald' 
              },
              { 
                label: 'Attendance Rate', 
                value: `${selectedClassData?.attendance_rate || 0}%`, 
                icon: 'ri-calendar-check-line', 
                color: 'cyan' 
              },
              { 
                label: 'Pass Rate', 
                value: `${selectedClassData?.average_score && selectedClassData.average_score >= 50 ? Math.round((selectedClassData.average_score / 100) * 100) : 0}%`, 
                icon: 'ri-checkbox-circle-line', 
                color: 'green' 
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                    <i className={`${stat.icon} text-${stat.color}-600 w-5 h-5 flex items-center justify-center`}></i>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Student List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">Student List</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
                    />
                  </div>
                  <button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
                    Export List
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <i className="ri-loader-4-line text-4xl mb-3 animate-spin"></i>
                <p className="text-sm">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <i className="ri-user-line text-4xl mb-3"></i>
                <p className="text-sm">
                  {searchQuery ? 'No students found matching your search' : 'No students in this class'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Roll No</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Parent Contact</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Avg Score</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Attendance</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.parent_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.roll_no}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.parent_phone}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${student.avg_score >= 80 ? 'text-emerald-600' : student.avg_score >= 60 ? 'text-teal-600' : 'text-red-600'}`}>
                              {student.avg_score}%
                            </span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${student.avg_score >= 80 ? 'bg-emerald-500' : student.avg_score >= 60 ? 'bg-teal-500' : 'bg-red-500'}`}
                                style={{ width: `${student.avg_score}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            student.attendance >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            student.attendance >= 75 ? 'bg-teal-100 text-teal-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.attendance}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View Profile">
                              <i className="ri-user-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Send Message">
                              <i className="ri-message-3-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View Marks">
                              <i className="ri-file-list-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}