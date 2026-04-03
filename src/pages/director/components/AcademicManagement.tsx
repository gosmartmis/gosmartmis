import { useState } from 'react';
import { academicYears, terms, classes, subjects } from '../../../mocks/academic-years';

export default function AcademicManagement() {
  const [activeTab, setActiveTab] = useState('years');
  const [showYearModal, setShowYearModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [newYear, setNewYear] = useState({
    year_name: '',
    start_date: '',
    end_date: ''
  });

  const [newTerm, setNewTerm] = useState({
    academic_year_id: 1,
    term_name: '',
    start_date: '',
    end_date: ''
  });

  const [newClass, setNewClass] = useState({
    class_name: '',
    level: '',
    capacity: '',
    room_number: '',
    class_teacher: ''
  });

  const [newSubject, setNewSubject] = useState({
    subject_name: '',
    subject_code: '',
    level: '',
    max_score: '',
    pass_mark: '',
    teacher_name: ''
  });

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating academic year:', newYear);
    setShowYearModal(false);
    setNewYear({ year_name: '', start_date: '', end_date: '' });
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating term:', newTerm);
    setShowTermModal(false);
    setNewTerm({ academic_year_id: 1, term_name: '', start_date: '', end_date: '' });
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating class:', newClass);
    setShowClassModal(false);
    setNewClass({ class_name: '', level: '', capacity: '', room_number: '', class_teacher: '' });
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating subject:', newSubject);
    setShowSubjectModal(false);
    setNewSubject({ subject_name: '', subject_code: '', level: '', max_score: '', pass_mark: '', teacher_name: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700';
      case 'archived':
        return 'bg-slate-100 text-slate-600';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-slate-100 text-slate-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const filteredTerms = selectedYear ? terms.filter(t => t.academic_year_id === selectedYear) : terms;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Academic Management</h1>
        <p className="text-sm text-slate-600">Manage academic years, terms, classes, and subjects</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('years')}
          className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'years'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Academic Years
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'terms'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Terms
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'classes'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Classes
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'subjects'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Subjects
        </button>
      </div>

      {/* Academic Years Tab */}
      {activeTab === 'years' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Academic Years</h2>
            <button
              onClick={() => setShowYearModal(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Create Academic Year
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Academic Year</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {academicYears.map((year) => (
                  <tr key={year.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{year.year_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{year.start_date}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{year.end_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(year.status)}`}>
                        {year.status.charAt(0).toUpperCase() + year.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {year.status === 'archived' && (
                          <button className="px-3 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors whitespace-nowrap">
                            Set Active
                          </button>
                        )}
                        {year.status === 'active' && (
                          <button className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap">
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Terms Tab */}
      {activeTab === 'terms' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-800">Terms</h2>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Academic Years</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowTermModal(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Create Term
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Term Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Academic Year</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTerms.map((term) => {
                  const year = academicYears.find(y => y.id === term.academic_year_id);
                  return (
                    <tr key={term.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{term.term_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{year?.year_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{term.start_date}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{term.end_date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(term.status)}`}>
                          {term.status.charAt(0).toUpperCase() + term.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {term.status === 'upcoming' && (
                            <button className="px-3 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors whitespace-nowrap">
                              Set Active
                            </button>
                          )}
                          <button className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Classes</h2>
            <button
              onClick={() => setShowClassModal(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Create Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{cls.class_name}</h3>
                    <p className="text-sm text-slate-600">{cls.level}</p>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <i className="ri-more-2-fill"></i>
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <i className="ri-user-line text-slate-400"></i>
                    <span className="text-slate-600">Teacher:</span>
                    <span className="font-medium text-slate-800">{cls.class_teacher}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <i className="ri-group-line text-slate-400"></i>
                    <span className="text-slate-600">Students:</span>
                    <span className="font-medium text-slate-800">{cls.current_students} / {cls.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <i className="ri-door-line text-slate-400"></i>
                    <span className="text-slate-600">Room:</span>
                    <span className="font-medium text-slate-800">{cls.room_number}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${(cls.current_students / cls.capacity) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  {Math.round((cls.current_students / cls.capacity) * 100)}% Capacity
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Subjects</h2>
            <button
              onClick={() => setShowSubjectModal(true)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Add Subject
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Max Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Pass Mark</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Classes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{subject.subject_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.subject_code}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.level}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.max_score}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.pass_mark}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.teacher_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.classes.join(', ')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <i className="ri-edit-line"></i>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Academic Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Create Academic Year</h3>
              <button
                onClick={() => setShowYearModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Academic Year</label>
                <input
                  type="text"
                  placeholder="e.g., 2025-2026"
                  value={newYear.year_name}
                  onChange={(e) => setNewYear({ ...newYear, year_name: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newYear.start_date}
                  onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newYear.end_date}
                  onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowYearModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Create Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Create Term</h3>
              <button
                onClick={() => setShowTermModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Academic Year</label>
                <select
                  value={newTerm.academic_year_id}
                  onChange={(e) => setNewTerm({ ...newTerm, academic_year_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {academicYears.filter(y => y.status === 'active').map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.year_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Term Name</label>
                <input
                  type="text"
                  placeholder="e.g., Term 1"
                  value={newTerm.term_name}
                  onChange={(e) => setNewTerm({ ...newTerm, term_name: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newTerm.start_date}
                  onChange={(e) => setNewTerm({ ...newTerm, start_date: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newTerm.end_date}
                  onChange={(e) => setNewTerm({ ...newTerm, end_date: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Create Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Create Class</h3>
              <button
                onClick={() => setShowClassModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Class Name</label>
                <input
                  type="text"
                  placeholder="e.g., P1A"
                  value={newClass.class_name}
                  onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Level</label>
                <select
                  value={newClass.level}
                  onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="Primary 6">Primary 6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Capacity</label>
                <input
                  type="number"
                  placeholder="e.g., 35"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g., Room 101"
                  value={newClass.room_number}
                  onChange={(e) => setNewClass({ ...newClass, room_number: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Class Teacher</label>
                <input
                  type="text"
                  placeholder="Teacher name"
                  value={newClass.class_teacher}
                  onChange={(e) => setNewClass({ ...newClass, class_teacher: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Add Subject</h3>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mathematics"
                  value={newSubject.subject_name}
                  onChange={(e) => setNewSubject({ ...newSubject, subject_name: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g., MATH"
                  value={newSubject.subject_code}
                  onChange={(e) => setNewSubject({ ...newSubject, subject_code: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Level</label>
                <select
                  value={newSubject.level}
                  onChange={(e) => setNewSubject({ ...newSubject, level: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="Primary 1">Primary 1</option>
                  <option value="Primary 2">Primary 2</option>
                  <option value="Primary 3">Primary 3</option>
                  <option value="Primary 4">Primary 4</option>
                  <option value="Primary 5">Primary 5</option>
                  <option value="Primary 6">Primary 6</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Max Score</label>
                  <input
                    type="number"
                    placeholder="e.g., 20"
                    value={newSubject.max_score}
                    onChange={(e) => setNewSubject({ ...newSubject, max_score: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pass Mark</label>
                  <input
                    type="number"
                    placeholder="e.g., 10"
                    value={newSubject.pass_mark}
                    onChange={(e) => setNewSubject({ ...newSubject, pass_mark: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Teacher</label>
                <input
                  type="text"
                  placeholder="Teacher name"
                  value={newSubject.teacher_name}
                  onChange={(e) => setNewSubject({ ...newSubject, teacher_name: e.target.value })}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}