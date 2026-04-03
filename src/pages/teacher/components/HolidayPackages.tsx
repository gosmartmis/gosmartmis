import { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTeacherAssignments } from '../../../hooks/useTeacherAssignments';
import { useHolidayPackages, type CreatePackagePayload } from '../../../hooks/useHolidayPackages';
import type { HolidayPackageDB } from '../../../hooks/useHolidayPackages';

interface FormData {
  title: string;
  description: string;
  class_id: string;
  subject_id: string;
  due_date: string;
  attachment_name: string;
  attachment_url: string;
}

const emptyForm: FormData = {
  title: '',
  description: '',
  class_id: '',
  subject_id: '',
  due_date: '',
  attachment_name: '',
  attachment_url: '',
};

export default function HolidayPackages() {
  const { profile } = useAuth();
  const { assignments } = useTeacherAssignments(profile?.school_id ?? null, profile?.id);

  const { packages, loading, error, creating, createPackage, deletePackage } = useHolidayPackages({
    teacherId: profile?.id ?? null,
    schoolId: profile?.school_id ?? null,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState('all');
  const [filterClassId, setFilterClassId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Unique classes and subjects from teacher assignments
  const assignedClasses = useMemo(() => {
    const seen = new Set<string>();
    return assignments.filter(a => {
      if (seen.has(a.class_id)) return false;
      seen.add(a.class_id);
      return true;
    });
  }, [assignments]);

  const assignedSubjects = useMemo(() => {
    const seen = new Set<string>();
    return assignments.filter(a => {
      if (seen.has(a.subject_id)) return false;
      seen.add(a.subject_id);
      return true;
    });
  }, [assignments]);

  const filteredPackages = useMemo(() => packages.filter(pkg => {
    const matchesSubject = filterSubjectId === 'all' || pkg.subject_id === filterSubjectId;
    const matchesClass = filterClassId === 'all' || pkg.class_id === filterClassId;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      pkg.title.toLowerCase().includes(q) ||
      (pkg.description ?? '').toLowerCase().includes(q);
    return matchesSubject && matchesClass && matchesSearch;
  }), [packages, filterSubjectId, filterClassId, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.title.trim() || !formData.class_id || !formData.subject_id) {
      setFormError('Title, class, and subject are required.');
      return;
    }
    const payload: CreatePackagePayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      class_id: formData.class_id,
      subject_id: formData.subject_id,
      due_date: formData.due_date || undefined,
      attachment_name: formData.attachment_name.trim() || undefined,
      attachment_url: formData.attachment_url.trim() || undefined,
    };
    const ok = await createPackage(payload);
    if (ok) {
      setShowCreateModal(false);
      setFormData(emptyForm);
      setSuccessMsg('Holiday package created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setFormError('Failed to create package. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    await deletePackage(id);
    setDeleteConfirmId(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holiday Packages</h1>
          <p className="text-gray-600 mt-1">Send assignments and activities to students during holidays</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setFormError(null); }}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line text-xl"></i>
          Create Package
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          <i className="ri-checkbox-circle-line text-green-600 text-lg"></i>
          {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Packages</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{packages.length}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-teal-100 rounded-lg">
              <i className="ri-folder-line text-2xl text-teal-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Classes Covered</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {new Set(packages.map(p => p.class_id).filter(Boolean)).size}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg">
              <i className="ri-group-line text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Subjects Covered</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {new Set(packages.map(p => p.subject_id).filter(Boolean)).size}
              </p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
              <i className="ri-book-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search packages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Subject</label>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="all">All Subjects</option>
              {assignedSubjects.map(a => (
                <option key={a.subject_id} value={a.subject_id}>{a.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="all">All Classes</option>
              {assignedClasses.map(a => (
                <option key={a.class_id} value={a.class_id}>{a.class_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading packages...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 text-sm">
          <i className="ri-error-warning-line mr-2"></i>{error}
        </div>
      )}

      {/* Packages List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredPackages.map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onDelete={() => setDeleteConfirmId(pkg.id)}
              formatDate={formatDate}
            />
          ))}

          {filteredPackages.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-folder-open-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages found</h3>
              <p className="text-gray-600 text-sm">Try adjusting your filters or create a new holiday package.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full mx-auto mb-4">
              <i className="ri-delete-bin-line text-2xl text-red-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Package?</h3>
            <p className="text-sm text-gray-600 text-center mb-6">This will permanently remove the package. Students will no longer see it.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create Holiday Package</h2>
                <button
                  onClick={() => { setShowCreateModal(false); setFormData(emptyForm); }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <i className="ri-error-warning-line"></i>{formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Package Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mathematics Holiday Practice"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed instructions for students..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select class</option>
                    {assignedClasses.map(a => (
                      <option key={a.class_id} value={a.class_id}>{a.class_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select subject</option>
                    {assignedSubjects.map(a => (
                      <option key={a.subject_id} value={a.subject_id}>{a.subject_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="border-t border-gray-200 pt-5">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  <i className="ri-link mr-1 text-teal-600"></i>
                  Attachment Link <span className="text-gray-400 font-normal">(optional — e.g. Google Drive)</span>
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.attachment_name}
                    onChange={(e) => setFormData({ ...formData, attachment_name: e.target.value })}
                    placeholder="File display name, e.g. Math Practice Sheet.pdf"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="url"
                    value={formData.attachment_url}
                    onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Paste a shareable link so students can access the file directly.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="ri-information-line text-amber-600 text-lg flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Guidelines</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• Provide clear instructions for students</li>
                      <li>• Students will see this package on their Holiday Assignments page</li>
                      <li>• Use a public or school-shared link for the attachment</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setFormData(emptyForm); }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 text-sm flex items-center justify-center gap-2"
                >
                  {creating && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>}
                  {creating ? 'Creating...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface PackageCardProps {
  pkg: HolidayPackageDB;
  onDelete: () => void;
  formatDate: (d: string) => string;
}

function PackageCard({ pkg, onDelete, formatDate }: PackageCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-teal-200 transition-colors">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-bold text-gray-900">{pkg.title}</h3>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full whitespace-nowrap">
                Published
              </span>
            </div>
            {pkg.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pkg.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {pkg.subject_name && (
                <span className="flex items-center gap-1">
                  <i className="ri-book-line text-teal-500"></i>
                  {pkg.subject_name}
                </span>
              )}
              {pkg.class_name && (
                <span className="flex items-center gap-1">
                  <i className="ri-group-line text-orange-500"></i>
                  {pkg.class_name}
                </span>
              )}
              {pkg.due_date && (
                <span className="flex items-center gap-1">
                  <i className="ri-calendar-line text-red-500"></i>
                  Due {formatDate(pkg.due_date)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <i className="ri-time-line text-gray-400"></i>
                {formatDate(pkg.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Attachment */}
        {pkg.attachment_url && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Attachment</p>
            <a
              href={pkg.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors group"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-teal-200 rounded-lg flex-shrink-0">
                <i className="ri-file-line text-xl text-teal-700"></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-teal-900 truncate">
                  {pkg.attachment_name || 'View Attachment'}
                </p>
                <p className="text-xs text-teal-600">Click to open link</p>
              </div>
              <i className="ri-external-link-line text-teal-600 group-hover:text-teal-800"></i>
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
          >
            <i className="ri-delete-bin-line"></i>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
