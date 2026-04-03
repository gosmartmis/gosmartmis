import { useState } from 'react';

export default function Documents() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = [
    { id: 'all', name: 'All Documents', count: 3847 },
    { id: 'registration', name: 'Registration Forms', count: 156 },
    { id: 'transcripts', name: 'Academic Transcripts', count: 1248 },
    { id: 'certificates', name: 'Certificates', count: 892 },
    { id: 'medical', name: 'Medical Records', count: 1189 },
    { id: 'consent', name: 'Consent Forms', count: 362 },
  ];

  const documents = [
    {
      id: 'DOC-2024-001',
      name: 'Birth Certificate - Emmanuel Niyonzima',
      category: 'registration',
      student: 'Emmanuel Niyonzima',
      studentId: 'STU-2024-156',
      type: 'PDF',
      size: '1.2 MB',
      uploadedBy: 'Rose Mukamana',
      date: 'Oct 25, 2024',
      status: 'Verified',
    },
    {
      id: 'DOC-2024-002',
      name: 'Previous School Report - Claire Uwimana',
      category: 'transcripts',
      student: 'Claire Uwimana',
      studentId: 'STU-2024-157',
      type: 'PDF',
      size: '856 KB',
      uploadedBy: 'Rose Mukamana',
      date: 'Oct 25, 2024',
      status: 'Verified',
    },
    {
      id: 'DOC-2024-003',
      name: 'Immunization Record - Kevin Habimana',
      category: 'medical',
      student: 'Kevin Habimana',
      studentId: 'STU-2024-158',
      type: 'PDF',
      size: '2.1 MB',
      uploadedBy: 'Parent Upload',
      date: 'Oct 24, 2024',
      status: 'Pending Review',
    },
    {
      id: 'DOC-2024-004',
      name: 'Parent ID Copy - Grace Mutoni',
      category: 'registration',
      student: 'Joyce Mutoni',
      studentId: 'STU-2024-159',
      type: 'JPG',
      size: '3.4 MB',
      uploadedBy: 'Rose Mukamana',
      date: 'Oct 24, 2024',
      status: 'Verified',
    },
    {
      id: 'DOC-2024-005',
      name: 'Transfer Certificate - David Ndayisaba',
      category: 'certificates',
      student: 'David Ndayisaba',
      studentId: 'STU-2024-089',
      type: 'PDF',
      size: '1.8 MB',
      uploadedBy: 'Parent Upload',
      date: 'Oct 23, 2024',
      status: 'Pending Review',
    },
    {
      id: 'DOC-2024-006',
      name: 'Medical Consent Form - Sarah Mugisha',
      category: 'consent',
      student: 'Sarah Mugisha',
      studentId: 'STU-2024-001',
      type: 'PDF',
      size: '645 KB',
      uploadedBy: 'Rose Mukamana',
      date: 'Oct 22, 2024',
      status: 'Verified',
    },
  ];

  const recentUploads = [
    { name: 'Emmanuel Niyonzima', action: 'uploaded Birth Certificate', time: '10 minutes ago' },
    { name: 'Rose Mukamana', action: 'verified 5 documents', time: '30 minutes ago' },
    { name: 'Parent Portal', action: 'received 3 new uploads', time: '1 hour ago' },
    { name: 'System', action: 'auto-archived 50 old documents', time: '2 hours ago' },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return 'ri-file-pdf-line text-red-500';
      case 'JPG':
      case 'PNG':
        return 'ri-image-line text-purple-500';
      case 'DOC':
      case 'DOCX':
        return 'ri-file-word-line text-blue-500';
      default:
        return 'ri-file-text-line text-gray-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-sm text-gray-600">Manage and verify student documents</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2">
          <i className="ri-upload-cloud-line"></i>
          Upload Document
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <i className="ri-folder-3-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">3,847</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <i className="ri-check-double-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">3,245</div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <i className="ri-time-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">156</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <i className="ri-error-warning-line text-2xl text-white"></i>
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">23</div>
              <div className="text-sm text-gray-600">Missing</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-900 mb-4 px-2">Categories</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium">{cat.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-6">
            <h3 className="font-semibold text-gray-900 mb-4 px-2">Recent Activity</h3>
            <div className="space-y-4">
              {recentUploads.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 px-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{activity.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">{activity.action}</div>
                    <div className="text-xs text-gray-400 mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search documents..."
                      className="pl-11 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <select className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Review</option>
                    <option value="missing">Missing</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <i className="ri-grid-line text-xl"></i>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-100 text-teal-600' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <i className="ri-list-check-line text-xl"></i>
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border border-gray-200 rounded-xl hover:border-teal-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className={`${getFileIcon(doc.type)} text-2xl`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{doc.name}</div>
                        <div className="text-sm text-gray-600 mt-1">{doc.student}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.status === 'Verified' ? 'bg-green-100 text-green-700' :
                        doc.status === 'Pending Review' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {doc.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                          <i className="ri-eye-line"></i>
                        </button>
                        <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Download">
                          <i className="ri-download-line"></i>
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Verify">
                          <i className="ri-check-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Document</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <i className={`${getFileIcon(doc.type)} text-xl`}></i>
                            <div>
                              <div className="font-medium text-gray-900">{doc.name}</div>
                              <div className="text-xs text-gray-500">{doc.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{doc.student}</div>
                          <div className="text-xs text-gray-500">{doc.studentId}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            doc.status === 'Verified' ? 'bg-green-100 text-green-700' :
                            doc.status === 'Pending Review' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <i className="ri-eye-line"></i>
                            </button>
                            <button className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                              <i className="ri-download-line"></i>
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
        </div>
      </div>
    </div>
  );
}