import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useMarks } from '../../../hooks/useMarks';
import { useTerms } from '../../../hooks/useTerms';
import { notifyMarksApproved, notifyMarksRejected } from '../../../utils/notificationService';

export default function MarksApproval() {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { profile } = useAuth();
  const { terms } = useTerms(profile?.school_id ?? null);

  // Fetch real marks data from Supabase
  const { marks: pendingMarks, loading: pendingLoading, updateMarkStatus } = useMarks({
    schoolId: profile?.school_id || null,
    status: 'pending'
  });

  const { marks: approvedMarks, loading: approvedLoading } = useMarks({
    schoolId: profile?.school_id || null,
    status: 'verified'
  });

  const { marks: rejectedMarks, loading: rejectedLoading } = useMarks({
    schoolId: profile?.school_id || null,
    status: 'rejected'
  });

  // Group marks by submission (teacher + class + subject + term)
  const groupMarksBySubmission = (marks: any[]) => {
    const grouped = new Map();
    
    marks.forEach(mark => {
      const key = `${mark.teacher_id}-${mark.class_id}-${mark.subject_id}-${mark.term_id}`;
      const maxMark = Number(mark.max_score) || 100;
      const scorePct = (Number(mark.score) || 0) / maxMark * 100;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          teacher: mark.teacher_name || 'Unknown Teacher',
          subject: mark.subject_name || 'Unknown Subject',
          class: mark.class_name || 'Unknown Class',
          term: terms.find(t => t.id === mark.term_id)?.name || 'Unknown Term',
          submittedAt: mark.submitted_at ? formatTimeAgo(mark.submitted_at) : formatTimeAgo(mark.created_at),
          approvedAt: mark.updated_at ? formatTimeAgo(mark.updated_at) : null,
          totalStudents: 0,
          averageScore: 0,
          status: mark.status,
          approvedBy: 'You',
          students: [],
          markIds: []
        });
      }
      
      const submission = grouped.get(key);
      submission.totalStudents += 1;
      submission.markIds.push(mark.id);
      submission.averageScore += scorePct;
      
      submission.students.push({
        id: mark.student_id,
        name: mark.student_name || 'Unknown Student',
        rollNo: 'N/A',
        score: Number(mark.score) || 0,
        maxScore: maxMark,
        grade: calculateGrade(scorePct)
      });
    });
    
    // Calculate average scores
    grouped.forEach(submission => {
      if (submission.totalStudents > 0) {
        submission.averageScore = submission.averageScore / submission.totalStudents;
      }
    });
    
    return Array.from(grouped.values());
  };

  const pendingSubmissions = groupMarksBySubmission(pendingMarks);
  const approvedSubmissions = groupMarksBySubmission(approvedMarks);
  const rejectedSubmissions = groupMarksBySubmission(rejectedMarks);

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    try {
      for (const markId of selectedSubmission.markIds) {
        await updateMarkStatus(markId, 'verified', profile?.id);
      }

      // Notify the teacher who submitted these marks
      if (profile?.school_id) {
        const sourceMark = pendingMarks.find((m) => m.id === selectedSubmission.markIds[0]);
        if (sourceMark?.teacher_id) {
          notifyMarksApproved(
            sourceMark.teacher_id,
            profile.school_id,
            selectedSubmission.class,
            selectedSubmission.subject,
            selectedSubmission.markIds.length,
            profile.full_name || 'Dean',
          );
        }
      }

      setShowApproveModal(false);
      setSelectedSubmission(null);
      setActionMessage({ type: 'success', text: 'Marks approved and forwarded to Director!' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Error approving marks:', error);
      setActionMessage({ type: 'error', text: 'Failed to approve marks. Please try again.' });
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectReason.trim()) return;
    
    try {
      for (const markId of selectedSubmission.markIds) {
        await updateMarkStatus(markId, 'rejected', profile?.id, rejectReason);
      }

      // Notify the teacher with the rejection reason
      if (profile?.school_id) {
        const sourceMark = pendingMarks.find((m) => m.id === selectedSubmission.markIds[0]);
        if (sourceMark?.teacher_id) {
          notifyMarksRejected(
            sourceMark.teacher_id,
            profile.school_id,
            selectedSubmission.class,
            selectedSubmission.subject,
            selectedSubmission.markIds.length,
            profile.full_name || 'Dean',
            rejectReason,
          );
        }
      }

      setShowRejectModal(false);
      setRejectReason('');
      setSelectedSubmission(null);
      setActionMessage({ type: 'success', text: 'Marks rejected and returned to teacher.' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (error) {
      console.error('Error rejecting marks:', error);
      setActionMessage({ type: 'error', text: 'Failed to reject marks. Please try again.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marks Approval</h2>
          <p className="text-gray-600 mt-1">Review and verify marks submitted by teachers</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <i className="ri-time-line mr-2"></i>
            {pendingLoading ? '...' : pendingSubmissions.length} Pending
          </span>
        </div>
      </div>

      {/* Action Feedback */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <i className={`${actionMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-xl`}></i>
          <span className="text-sm font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending Verification
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'approved'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Rejected
        </button>
      </div>

      {selectedSubmission ? (
        /* Detailed View */
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedSubmission(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <i className="ri-arrow-left-line w-5 h-5 flex items-center justify-center"></i>
            Back to List
          </button>

          {/* Submission Details */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                  {selectedSubmission.teacher.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSubmission.teacher}</h3>
                  <p className="text-gray-600">{selectedSubmission.subject} Teacher</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span><i className="ri-calendar-line mr-1"></i>{selectedSubmission.exam}</span>
                    <span><i className="ri-book-line mr-1"></i>{selectedSubmission.class}</span>
                    <span><i className="ri-time-line mr-1"></i>Submitted {selectedSubmission.submittedAt}</span>
                  </div>
                </div>
              </div>
              <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                Pending Verification
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{selectedSubmission.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{selectedSubmission.averageScore.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Class Average</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">
                  {selectedSubmission.students.filter((s: any) => {
                    const pct = (s.score / s.maxScore) * 100;
                    return pct >= 80;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">A Grades</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {selectedSubmission.students.filter((s: any) => {
                    const pct = (s.score / s.maxScore) * 100;
                    return pct < 60;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Below Pass</div>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Student Marks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">#</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Student Name</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Roll No</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Score</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Percentage</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Grade</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSubmission.students.map((student: any, index: number) => {
                    const percentage = (student.score / student.maxScore) * 100;
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {student.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="font-semibold text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.rollNo}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {student.score} / {student.maxScore}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${percentage >= 80 ? 'text-emerald-600' : percentage >= 60 ? 'text-teal-600' : percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700' :
                            student.grade === 'B' ? 'bg-teal-100 text-teal-700' :
                            student.grade === 'C' ? 'bg-blue-100 text-blue-700' :
                            student.grade === 'D' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-teal-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
            >
              <i className="ri-close-line mr-2"></i>
              Reject & Return
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl transition-all font-medium"
            >
              <i className="ri-check-line mr-2"></i>
              Approve & Forward to Director
            </button>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {activeTab === 'pending' && (
            pendingLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-checkbox-circle-line text-3xl text-gray-400 w-8 h-8 flex items-center justify-center"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No pending marks submissions to review</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingSubmissions.map((approval) => (
                  <div key={approval.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {approval.teacher.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{approval.teacher}</h3>
                          <p className="text-sm text-gray-600">{approval.subject} • {approval.class} • {approval.exam}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span><i className="ri-user-line mr-1"></i>{approval.totalStudents} students</span>
                            <span><i className="ri-bar-chart-line mr-1"></i>Avg: {approval.averageScore.toFixed(1)}%</span>
                            <span><i className="ri-time-line mr-1"></i>{approval.submittedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          Pending
                        </span>
                        <button
                          onClick={() => setSelectedSubmission(approval)}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'approved' && (
            approvedLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : approvedSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-checkbox-circle-line text-3xl text-gray-400 w-8 h-8 flex items-center justify-center"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Approved Marks</h3>
                <p className="text-gray-600">Approved marks will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {approvedSubmissions.map((mark) => (
                  <div key={mark.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {mark.teacher.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{mark.teacher}</h3>
                          <p className="text-sm text-gray-600">{mark.subject} • {mark.class} • {mark.exam}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span><i className="ri-user-line mr-1"></i>{mark.totalStudents} students</span>
                            <span><i className="ri-bar-chart-line mr-1"></i>Avg: {mark.averageScore.toFixed(1)}%</span>
                            <span><i className="ri-check-line mr-1"></i>Approved by {mark.approvedBy}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'rejected' && (
            rejectedLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : rejectedSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-close-circle-line text-3xl text-gray-400 w-8 h-8 flex items-center justify-center"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Rejected Marks</h3>
                <p className="text-gray-600">All marks submissions are either pending or approved</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {rejectedSubmissions.map((mark) => (
                  <div key={mark.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {mark.teacher.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{mark.teacher}</h3>
                          <p className="text-sm text-gray-600">{mark.subject} • {mark.class} • {mark.exam}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span><i className="ri-user-line mr-1"></i>{mark.totalStudents} students</span>
                            <span><i className="ri-bar-chart-line mr-1"></i>Avg: {mark.averageScore.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Rejected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-3xl text-emerald-600 w-8 h-8 flex items-center justify-center"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Approve Marks?</h3>
            <p className="text-gray-600 text-center mb-6">
              You are about to approve marks for <strong>{selectedSubmission?.subject}</strong> by {selectedSubmission?.teacher}. 
              This will forward the marks to the Director for final approval.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl transition-all font-medium"
              >
                Approve & Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-close-line text-3xl text-red-600 w-8 h-8 flex items-center justify-center"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Reject Marks?</h3>
            <p className="text-gray-600 text-center mb-4">
              Please provide a reason for rejecting these marks. The teacher will be notified.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}