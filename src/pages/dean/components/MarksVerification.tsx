import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useTerms } from '../../../hooks/useTerms';
import { supabase } from '../../../lib/supabase';
import { notifyMarksApproved, notifyMarksRejected } from '../../../utils/notificationService';

interface Mark {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  teacherId: string;
  teacherName: string;
  className: string;
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export default function MarksVerification() {
  const { profile } = useAuth();
  const { terms, loading: termsLoading } = useTerms(profile?.school_id ?? null);

  const [marks, setMarks] = useState<Mark[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarks, setSelectedMarks] = useState<string[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingMark, setViewingMark] = useState<Mark | null>(null);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-select the first term when terms load
  useEffect(() => {
    if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0].id);
    }
  }, [terms]);

  // Fetch marks from Supabase
  const fetchMarks = useCallback(async () => {
    if (!profile?.school_id || !selectedTerm) return;

    setLoadingMarks(true);
    try {
      const { data, error } = await supabase
        .from('marks')
        .select(`
          id,
          teacher_id,
          score,
          max_score,
          percentage,
          grade,
          status,
          remarks,
          submitted_at,
          updated_at,
          students:student_id (
            full_name,
            student_id
          ),
          subjects:subject_id (
            name
          ),
          classes:class_id (
            name
          ),
          profiles:teacher_id (
            full_name
          )
        `)
        .eq('school_id', profile.school_id)
        .eq('term_id', selectedTerm)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const mapped: Mark[] = (data || []).map((m: any) => ({
        id: m.id,
        studentId: m.students?.student_id || 'N/A',
        studentName: m.students?.full_name || 'Unknown Student',
        subject: m.subjects?.name || 'Unknown Subject',
        score: Number(m.score) || 0,
        maxScore: Number(m.max_score) || 100,
        percentage: Number(m.percentage) || 0,
        teacherId: m.teacher_id || '',
        teacherName: m.profiles?.full_name || 'Unknown Teacher',
        className: m.classes?.name || 'Unknown Class',
        status: m.status as Mark['status'],
        submittedAt: m.submitted_at,
        verifiedAt: m.updated_at,
        rejectionReason: m.remarks || undefined,
      }));

      setMarks(mapped);
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoadingMarks(false);
    }
  }, [profile?.school_id, selectedTerm]);

  useEffect(() => {
    fetchMarks();
  }, [fetchMarks]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
  const filteredMarks = marks.filter((mark) => {
    const matchesStatus = filterStatus === 'all' || mark.status === filterStatus;
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      mark.studentName.toLowerCase().includes(lowerSearch) ||
      mark.subject.toLowerCase().includes(lowerSearch) ||
      mark.teacherName.toLowerCase().includes(lowerSearch) ||
      mark.className.toLowerCase().includes(lowerSearch);
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    pending: marks.filter((m) => m.status === 'pending').length,
    verified: marks.filter((m) => m.status === 'verified').length,
    rejected: marks.filter((m) => m.status === 'rejected').length,
  };

  // -------------------------------------------------------------------------
  // Helper functions
  // -------------------------------------------------------------------------
  const getStatusBadge = (status: Mark['status']) => {
    const styles: Record<Mark['status'], string> = {
      pending: 'bg-amber-100 text-amber-700',
      verified: 'bg-teal-100 text-teal-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] ?? styles.pending;
  };

  const getStatusIcon = (status: Mark['status']) => {
    const icons: Record<Mark['status'], string> = {
      pending: 'ri-time-line',
      verified: 'ri-checkbox-circle-line',
      approved: 'ri-shield-check-line',
      rejected: 'ri-close-circle-line',
    };
    return icons[status] ?? icons.pending;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------
  const handleSelectMark = (markId: string) => {
    setSelectedMarks((prev) =>
      prev.includes(markId) ? prev.filter((id) => id !== markId) : [...prev, markId],
    );
  };

  const handleSelectAll = () => {
    const pendingIds = filteredMarks.filter((m) => m.status === 'pending').map((m) => m.id);
    setSelectedMarks((prev) => (prev.length === pendingIds.length && pendingIds.length > 0 ? [] : pendingIds));
  };

  const handleVerifyMarks = async () => {
    setSaving(true);
    try {
      for (const markId of selectedMarks) {
        const { error } = await supabase
          .from('marks')
          .update({ status: 'verified', approved_by: profile?.id })
          .eq('id', markId);
        if (error) throw error;
      }

      // Group selected marks by teacher and send one notification per teacher
      if (profile?.school_id) {
        const teacherGroups = new Map<string, { name: string; subjects: Set<string>; classes: Set<string>; count: number }>();
        selectedMarks.forEach((id) => {
          const m = marks.find((mk) => mk.id === id);
          if (!m?.teacherId) return;
          if (!teacherGroups.has(m.teacherId)) {
            teacherGroups.set(m.teacherId, { name: m.teacherName, subjects: new Set(), classes: new Set(), count: 0 });
          }
          const g = teacherGroups.get(m.teacherId)!;
          g.subjects.add(m.subject);
          g.classes.add(m.className);
          g.count += 1;
        });

        for (const [teacherId, g] of teacherGroups.entries()) {
          notifyMarksApproved(
            teacherId,
            profile.school_id,
            Array.from(g.classes).join(', '),
            Array.from(g.subjects).join(', '),
            g.count,
            profile.full_name || 'Dean',
          );
        }
      }

      setSelectedMarks([]);
      setShowVerifyModal(false);
      setActionMessage({ type: 'success', text: `${selectedMarks.length} mark(s) verified and sent to Director.` });
      setTimeout(() => setActionMessage(null), 3000);
      await fetchMarks();
    } catch (err) {
      console.error('Error verifying marks:', err);
      setActionMessage({ type: 'error', text: 'Failed to verify marks. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRejectMarks = async () => {
    if (!rejectionReason.trim()) return;
    setSaving(true);
    try {
      for (const markId of selectedMarks) {
        const { error } = await supabase
          .from('marks')
          .update({ status: 'rejected', remarks: rejectionReason })
          .eq('id', markId);
        if (error) throw error;
      }

      // Group selected marks by teacher and notify each with the rejection reason
      if (profile?.school_id) {
        const teacherGroups = new Map<string, { name: string; subjects: Set<string>; classes: Set<string>; count: number }>();
        selectedMarks.forEach((id) => {
          const m = marks.find((mk) => mk.id === id);
          if (!m?.teacherId) return;
          if (!teacherGroups.has(m.teacherId)) {
            teacherGroups.set(m.teacherId, { name: m.teacherName, subjects: new Set(), classes: new Set(), count: 0 });
          }
          const g = teacherGroups.get(m.teacherId)!;
          g.subjects.add(m.subject);
          g.classes.add(m.className);
          g.count += 1;
        });

        for (const [teacherId, g] of teacherGroups.entries()) {
          notifyMarksRejected(
            teacherId,
            profile.school_id,
            Array.from(g.classes).join(', '),
            Array.from(g.subjects).join(', '),
            g.count,
            profile.full_name || 'Dean',
            rejectionReason,
          );
        }
      }

      setSelectedMarks([]);
      setRejectionReason('');
      setShowRejectModal(false);
      setActionMessage({ type: 'success', text: 'Marks rejected and returned to teacher.' });
      setTimeout(() => setActionMessage(null), 3000);
      await fetchMarks();
    } catch (err) {
      console.error('Error rejecting marks:', err);
      setActionMessage({ type: 'error', text: 'Failed to reject marks. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marks Verification</h1>
        <p className="text-gray-600">Review and verify marks submitted by teachers</p>
      </div>

      {/* Action feedback */}
      {actionMessage && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <i className={`${actionMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-xl`}></i>
          <span className="text-sm font-semibold">{actionMessage.text}</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Verification</p>
              <p className="text-3xl font-bold text-amber-600">
                {loadingMarks ? '...' : statusCounts.pending}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting your review</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-2xl text-amber-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border-2 border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Verified</p>
              <p className="text-3xl font-bold text-teal-600">
                {loadingMarks ? '...' : statusCounts.verified}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sent to Director</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-teal-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">
                {loadingMarks ? '...' : statusCounts.rejected}
              </p>
              <p className="text-xs text-gray-500 mt-1">Returned to teachers</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <i className="ri-close-circle-line text-2xl text-red-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Term Filter + Filters Row */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={termsLoading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              {terms.map(term => (
                <option key={term.id} value={term.id}>{term.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search student, teacher, subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {selectedMarks.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <i className="ri-close-circle-line mr-2"></i>
                Reject {selectedMarks.length}
              </button>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <i className="ri-checkbox-circle-line mr-2"></i>
                Verify {selectedMarks.length}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loadingMarks ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedMarks.length === filteredMarks.filter((m) => m.status === 'pending').length &&
                        filteredMarks.filter((m) => m.status === 'pending').length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teacher</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMarks.map((mark) => (
                  <tr key={mark.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {mark.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedMarks.includes(mark.id)}
                          onChange={() => handleSelectMark(mark.id)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                        />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-teal-700">
                            {(mark.studentName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{mark.studentName}</p>
                          <p className="text-xs text-gray-500">{mark.studentId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-900">{mark.className}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{mark.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{mark.teacherName}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {mark.score}/{mark.maxScore}
                        </span>
                        <span className="text-xs text-gray-500">({mark.percentage}%)</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              mark.percentage >= 80 ? 'bg-emerald-500' :
                              mark.percentage >= 70 ? 'bg-teal-500' :
                              mark.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, mark.percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(mark.status)}`}>
                        <i className={`${getStatusIcon(mark.status)} mr-1`}></i>
                        {mark.status === 'pending' ? 'Pending' : mark.status.charAt(0).toUpperCase() + mark.status.slice(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => setViewingMark(mark)}
                        className="text-teal-600 hover:text-teal-700 text-sm font-medium cursor-pointer whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMarks.length === 0 && (
              <div className="text-center py-12">
                <i className="ri-file-list-3-line text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 font-medium">No marks found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {marks.length === 0
                    ? 'No marks submitted yet for this term'
                    : 'Try adjusting your search or filter'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <i className="ri-checkbox-circle-fill text-2xl text-teal-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Verify Marks</h3>
                <p className="text-sm text-gray-600">Confirm verification and send to Director</p>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-teal-800">
                You are about to verify <strong>{selectedMarks.length} mark{selectedMarks.length > 1 ? 's' : ''}</strong>.
                These marks will be sent to the Director for final approval.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyMarks}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin"></i> Verifying...</> : 'Verify Marks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-close-circle-fill text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reject Marks</h3>
                <p className="text-sm text-gray-600">Provide reason for rejection</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why these marks are being rejected..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectMarks}
                disabled={!rejectionReason.trim() || saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><i className="ri-loader-4-line animate-spin"></i> Rejecting...</> : 'Reject Marks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingMark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Mark Details</h3>
              <button
                onClick={() => setViewingMark(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Student</p>
                  <p className="text-base font-semibold text-gray-900">{viewingMark.studentName}</p>
                  <p className="text-xs text-gray-500">{viewingMark.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Class</p>
                  <p className="text-base font-semibold text-gray-900">{viewingMark.className}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Subject</p>
                  <p className="text-base font-semibold text-gray-900">{viewingMark.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Teacher</p>
                  <p className="text-base font-semibold text-gray-900">{viewingMark.teacherName}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Score</p>
                    <p className="text-2xl font-bold text-gray-900">{viewingMark.score}/{viewingMark.maxScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Percentage</p>
                    <p className="text-2xl font-bold text-gray-900">{viewingMark.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(viewingMark.status)}`}>
                      <i className={`${getStatusIcon(viewingMark.status)} mr-1`}></i>
                      {viewingMark.status === 'pending' ? 'Pending' : viewingMark.status.charAt(0).toUpperCase() + viewingMark.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {viewingMark.submittedAt && (
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Timeline</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="ri-send-plane-line text-amber-600"></i>
                      <span>Submitted: {formatDate(viewingMark.submittedAt)}</span>
                    </div>
                    {(viewingMark.status === 'verified' || viewingMark.status === 'approved') && viewingMark.verifiedAt && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="ri-checkbox-circle-line text-teal-600"></i>
                        <span>Verified: {formatDate(viewingMark.verifiedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {viewingMark.rejectionReason && (
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Rejection Reason</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{viewingMark.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setViewingMark(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
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
