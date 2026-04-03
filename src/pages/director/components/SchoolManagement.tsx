import { useState } from 'react';

export default function SchoolManagement() {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);

  const schoolInfo = {
    name: 'Elite School',
    motto: 'Excellence Through Education',
    description: 'Elite School is a leading institution dedicated to providing quality education to nursery and primary students. We focus on holistic development and academic excellence.',
    address: 'KG 123 Street, Kigali Heights, Kigali, Rwanda',
    phone: '+250 788 123 456',
    email: 'info@eliteschool.rw',
    website: 'elite.sms.ac.rw',
    foundedYear: '2005',
    director: 'John Doe',
    registrationNumber: 'REG/2024/001',
  };

  const academicYears = [
    { year: '2024-2025', status: 'Current', startDate: 'Sep 9, 2024', endDate: 'Jul 15, 2025', terms: 3 },
    { year: '2023-2024', status: 'Completed', startDate: 'Sep 11, 2023', endDate: 'Jul 12, 2024', terms: 3 },
    { year: '2022-2023', status: 'Completed', startDate: 'Sep 12, 2022', endDate: 'Jul 14, 2023', terms: 3 },
  ];

  const terms = [
    { name: 'Term 1', academicYear: '2024-2025', startDate: 'Sep 9, 2024', endDate: 'Dec 20, 2024', status: 'Active' },
    { name: 'Term 2', academicYear: '2024-2025', startDate: 'Jan 6, 2025', endDate: 'Apr 11, 2025', status: 'Upcoming' },
    { name: 'Term 3', academicYear: '2024-2025', startDate: 'Apr 28, 2025', endDate: 'Jul 15, 2025', status: 'Upcoming' },
  ];

  const classes = [
    { name: 'P1A', level: 'Primary 1', students: 32, teacher: 'Mrs. Sarah Kayitesi', room: 'Room 101' },
    { name: 'P1B', level: 'Primary 1', students: 30, teacher: 'Mr. John Mugabe', room: 'Room 102' },
    { name: 'P2A', level: 'Primary 2', students: 35, teacher: 'Mrs. Marie Claire', room: 'Room 103' },
    { name: 'P2B', level: 'Primary 2', students: 33, teacher: 'Mr. Eric Ndayisaba', room: 'Room 104' },
    { name: 'P3A', level: 'Primary 3', students: 34, teacher: 'Mrs. Grace Uwase', room: 'Room 201' },
    { name: 'P3B', level: 'Primary 3', students: 31, teacher: 'Mr. Paul Manzi', room: 'Room 202' },
    { name: 'P4A', level: 'Primary 4', students: 33, teacher: 'Mrs. Alice Uwimana', room: 'Room 203' },
    { name: 'P4B', level: 'Primary 4', students: 32, teacher: 'Mr. David Iradukunda', room: 'Room 204' },
    { name: 'P5A', level: 'Primary 5', students: 34, teacher: 'Mrs. Marie Mutesi', room: 'Room 301' },
    { name: 'P5B', level: 'Primary 5', students: 31, teacher: 'Mr. Jean Paul', room: 'Room 302' },
    { name: 'P6A', level: 'Primary 6', students: 33, teacher: 'Mrs. Sarah Mugisha', room: 'Room 303' },
    { name: 'P6B', level: 'Primary 6', students: 32, teacher: 'Mr. Eric Manzi', room: 'Room 304' },
  ];

  const subjects = [
    { name: 'Mathematics', code: 'MATH', teachers: 8, classes: 12 },
    { name: 'English', code: 'ENG', teachers: 8, classes: 12 },
    { name: 'Science', code: 'SCI', teachers: 6, classes: 12 },
    { name: 'Social Studies', code: 'SST', teachers: 6, classes: 12 },
    { name: 'Kinyarwanda', code: 'KIN', teachers: 8, classes: 12 },
    { name: 'ICT', code: 'ICT', teachers: 4, classes: 12 },
    { name: 'Art & Craft', code: 'ART', teachers: 3, classes: 12 },
    { name: 'Physical Education', code: 'PE', teachers: 4, classes: 12 },
  ];

  const tabs = [
    { id: 'general', label: 'General Information', icon: 'ri-information-line' },
    { id: 'academic-years', label: 'Academic Years', icon: 'ri-calendar-line' },
    { id: 'classes', label: 'Classes', icon: 'ri-building-line' },
    { id: 'subjects', label: 'Subjects', icon: 'ri-book-2-line' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">School Management</h2>
          <p className="text-sm text-gray-600">Manage your school settings and academic structure</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <i className={`ri-${isEditing ? 'save' : 'edit'}-line`}></i>
          {isEditing ? 'Save Changes' : 'Edit Settings'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className={`${tab.icon} text-lg`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Information */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <i className="ri-school-line text-4xl text-white"></i>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{schoolInfo.name}</h3>
                <p className="text-teal-600 font-medium">{schoolInfo.motto}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    defaultValue={schoolInfo.name}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motto</label>
                  <input
                    type="text"
                    defaultValue={schoolInfo.motto}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    defaultValue={schoolInfo.description}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                  <input
                    type="text"
                    defaultValue={schoolInfo.foundedYear}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    defaultValue={schoolInfo.address}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    defaultValue={schoolInfo.phone}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={schoolInfo.email}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    defaultValue={schoolInfo.registrationNumber}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Academic Years */}
      {activeTab === 'academic-years' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Academic Years</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap">
              <i className="ri-add-line"></i>
              Add Academic Year
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Terms</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {academicYears.map((year, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{year.year}</td>
                      <td className="px-6 py-4 text-gray-600">{year.startDate}</td>
                      <td className="px-6 py-4 text-gray-600">{year.endDate}</td>
                      <td className="px-6 py-4 text-gray-600">{year.terms}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          year.status === 'Current' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {year.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                          <i className="ri-eye-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Terms - 2024-2025</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {terms.map((term, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{term.name}</td>
                      <td className="px-6 py-4 text-gray-600">{term.startDate}</td>
                      <td className="px-6 py-4 text-gray-600">{term.endDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          term.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          term.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {term.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Classes */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Classes</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap">
              <i className="ri-add-line"></i>
              Add Class
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class Teacher</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classes.map((cls, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{cls.name}</td>
                      <td className="px-6 py-4 text-gray-600">{cls.level}</td>
                      <td className="px-6 py-4 text-gray-600">{cls.students}</td>
                      <td className="px-6 py-4 text-gray-600">{cls.teacher}</td>
                      <td className="px-6 py-4 text-gray-600">{cls.room}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View">
                            <i className="ri-eye-line"></i>
                          </button>
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <i className="ri-edit-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Subjects</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap">
              <i className="ri-add-line"></i>
              Add Subject
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((subject, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <i className="ri-book-2-line text-xl text-white"></i>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                    {subject.code}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{subject.name}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{subject.teachers} Teachers</p>
                  <p>{subject.classes} Classes</p>
                </div>
                <button className="w-full mt-4 py-2 text-teal-600 text-sm font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}