import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useHolidayPackages, type HolidayPackageDB } from '../../../hooks/useHolidayPackages';
import { supabase } from '../../../lib/supabase';

export default function HolidayAssignments() {
  const { profile } = useAuth();
  const [classId, setClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<HolidayPackageDB | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState('all');

  // Fetch student's class from students table
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('class_id, classes:class_id ( name )')
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (data) {
        setClassId(data.class_id ?? null);
        setClassName((data as any).classes?.name ?? '');
      }
    })();
  }, [profile?.id]);

  const { packages, loading, error } = useHolidayPackages({
    classId: classId ?? null,
    schoolId: profile?.school_id ?? null,
  });

  const uniqueSubjects = useMemo(() => {
    const seen = new Set<string>();
    return packages.filter(p => {
      if (!p.subject_id || seen.has(p.subject_id)) return false;
      seen.add(p.subject_id);
      return true;
    });
  }, [packages]);

  const filteredPackages = useMemo(() => packages.filter(pkg =>
    filterSubjectId === 'all' || pkg.subject_id === filterSubjectId
  ), [packages, filterSubjectId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Holiday Assignments</h1>
        <p className="text-gray-600 mt-1">View and download assignments posted by your teachers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Assignments</p>
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
              <p className="text-gray-600 text-sm">Your Class</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{className || '—'}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-lg">
              <i className="ri-group-line text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Subjects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{uniqueSubjects.length}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-lg">
              <i className="ri-book-line text-2xl text-green-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      {uniqueSubjects.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Subject:</label>
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(p => (
                <option key={p.subject_id!} value={p.subject_id!}>{p.subject_name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading assignments...</span>
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
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-teal-200 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{pkg.title}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                        New
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="text-gray-600 text-sm mb-3">{pkg.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {pkg.subject_name && (
                        <span className="flex items-center gap-1">
                          <i className="ri-book-line text-teal-500"></i>
                          {pkg.subject_name}
                        </span>
                      )}
                      {pkg.teacher_name && (
                        <span className="flex items-center gap-1">
                          <i className="ri-user-line text-orange-500"></i>
                          {pkg.teacher_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <i className="ri-calendar-line text-gray-400"></i>
                        {formatDate(pkg.created_at)}
                      </span>
                      {pkg.due_date && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <i className="ri-alarm-line"></i>
                          Due {formatDate(pkg.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attachment */}
                {pkg.attachment_url && (
                  <div className="mb-4">
                    <a
                      href={pkg.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg border border-teal-200 hover:shadow-md transition-all group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-teal-200 rounded-lg flex-shrink-0">
                        <i className="ri-file-line text-2xl text-teal-700"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-teal-900 truncate">
                          {pkg.attachment_name || 'View Assignment File'}
                        </p>
                        <p className="text-xs text-teal-600">Click to open &amp; download</p>
                      </div>
                      <div className="px-4 py-2 bg-teal-600 text-white rounded-lg group-hover:bg-teal-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm">
                        <i className="ri-external-link-line"></i>
                        Open
                      </div>
                    </a>
                  </div>
                )}

                {/* View Details */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedPackage(pkg)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:from-teal-700 hover:to-teal-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer text-sm"
                  >
                    <i className="ri-eye-line text-lg"></i>
                    View Full Instructions
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredPackages.length === 0 && !loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-4">
                <i className="ri-folder-open-line text-3xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600 text-sm">Your teachers haven&apos;t posted any holiday assignments yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPackage.title}</h2>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Info Grid */}
              <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-xl p-6 mb-6 border border-teal-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Subject</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPackage.subject_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Class</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPackage.class_name ?? className}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teacher</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPackage.teacher_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Posted</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedPackage.created_at)}</p>
                  </div>
                </div>
                {selectedPackage.due_date && (
                  <div className="mt-4 pt-4 border-t border-teal-200 flex items-center gap-2 text-red-600 font-medium text-sm">
                    <i className="ri-alarm-line"></i>
                    Due date: {formatDate(selectedPackage.due_date)}
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedPackage.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Instructions</h3>
                  <p className="text-gray-700 leading-relaxed text-sm">{selectedPackage.description}</p>
                </div>
              )}

              {/* Attachment */}
              {selectedPackage.attachment_url && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Assignment Material</h3>
                  <a
                    href={selectedPackage.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-teal-100 rounded-lg flex-shrink-0">
                      <i className="ri-file-line text-2xl text-teal-600"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{selectedPackage.attachment_name || 'View File'}</p>
                      <p className="text-xs text-gray-500">External link — opens in new tab</p>
                    </div>
                    <div className="px-5 py-2 bg-teal-600 text-white rounded-lg group-hover:bg-teal-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm">
                      <i className="ri-external-link-line"></i>
                      Open
                    </div>
                  </a>
                </div>
              )}

              {/* Important Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <i className="ri-information-line text-amber-600 text-lg flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Reminder</p>
                    <p className="text-xs text-amber-700">
                      Complete all assignments during the holiday period and bring your work on the first day of the new term.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedPackage(null)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
