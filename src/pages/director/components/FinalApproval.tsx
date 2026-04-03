import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useMarks } from '../../../hooks/useMarks';
import { useTerms } from '../../../hooks/useTerms';

// ─── Types ─────────────────────────────────────────────────────────────────
interface StudentEntry {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  grade: string;
}

interface Submission {
  id: string;
  teacher: string;
  subject: string;
  class: string;
  term: string;
  submittedAt: string;
  totalStudents: number;
  averageScore: number;
  status: string;
  students: StudentEntry[];
  markIds: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function gradeFromPct(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function formatAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function FinalApproval() {
  const { profile } = useAuth();
  const { terms } = useTerms(profile?.school_id ?? null);

  const [activeTab, setActiveTab] = useState<'verified' | 'approved' | 'rejected'>('verified');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal]  = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Fetch marks by status ──
  const { marks: verifiedMarks,  loading: verifiedLoading,  updateMarkStatus } = useMarks({ schoolId: profile?.school_id || null, status: 'verified'  });
  const { marks: approvedMarks,  loading: approvedLoading  } = useMarks({ schoolId: profile?.school_id || null, status: 'approved'  });
  const { marks: rejectedMarks,  loading: rejectedLoading  } = useMarks({ schoolId: profile?.school_id || null, status: 'rejected'  });

  // ── Group marks into submissions ──
  const group = useCallback((marks: any[]): Submission[] => {
    const map = new Map<string, Submission>();

    marks.forEach(m => {
      const key = `${m.teacher_id}-${m.class_id}-${m.subject_id}-${m.term_id}`;
      const max  = Number(m.max_score) || 100;
      const pct  = (Number(m.score) || 0) / max * 100;
      const termName = terms.find(t => t.id === m.term_id)?.name || '—';

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          teacher: m.teacher_name || 'Unknown Teacher',
          subject: m.subject_name || 'Unknown Subject',
          class:   m.class_name   || 'Unknown Class',
          term:    termName,
          submittedAt: m.submitted_at || m.updated_at || m.created_at,
          totalStudents: 0,
          averageScore: 0,
          status: m.status,
          students: [],
          markIds: [],
        });
      }

      const sub = map.get(key)!;
      sub.totalStudents += 1;
      sub.averageScore  += pct;
      sub.markIds.push(m.id);
      sub.students.push({
        id:       m.student_id,
        name:     m.student_name || 'Unknown',
        score:    Number(m.score) || 0,
        maxScore: max,
        grade:    gradeFromPct(pct),
      });
    });

    map.forEach(sub => {
      if (sub.totalStudents > 0) sub.averageScore /= sub.totalStudents;
    });

    return Array.from(map.values());
  }, [terms]);

  const verifiedSubs  = group(verifiedMarks);
  const approvedSubs  = group(approvedMarks);
  const rejectedSubs  = group(rejectedMarks);

  const currentSubs = activeTab === 'verified'  ? verifiedSubs
                    : activeTab === 'approved'  ? approvedSubs
                    : rejectedSubs;
  const isLoading   = activeTab === 'verified'  ? verifiedLoading
                    : activeTab === 'approved'  ? approvedLoading
                    : rejectedLoading;

  // ── Actions ──
  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setSaving(true);
    try {
      for (const id of selectedSubmission.markIds) {
        await updateMarkStatus(id, 'approved', profile?.id);
      }
      setShowApproveModal(false);
      setSelectedSubmission(null);
      showToast('success', `Marks approved! Report card generation is now unlocked.`);
    } catch {
      showToast('error', 'Failed to approve marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectReason.trim()) return;
    setSaving(true);
    try {
      for (const id of selectedSubmission.markIds) {
        await updateMarkStatus(id, 'rejected', profile?.id, rejectReason);
      }
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedSubmission(null);
      showToast('success', 'Marks returned to Dean with feedback.');
    } catch {
      showToast('error', 'Failed to reject marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-semibold flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-teal-600' : 'bg-red-600'
        }`}>
          <i className={toast.type === 'success' ? 'ri-checkbox-circle-line text-lg' : 'ri-error-warning-line text-lg'}></i>
          {toast.text}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Final Marks Approval</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Give final sign-off on Dean-verified marks before report cards are generated
          </p>
        </div>

        {/* Workflow badge */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full">Teacher submits</span>
          <i className="ri-arrow-right-s-line text-gray-400 text-base"></i>
          <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full">Dean verifies</span>
          <i className="ri-arrow-right-s-line text-gray-400 text-base"></i>
          <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-full">You approve ✓</span>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Awaiting Your Approval', value: verifiedSubs.length,  color: 'amber',   icon: 'ri-time-line',             tab: 'verified'  as const },
          { label: 'Approved by You',        value: approvedSubs.length,  color: 'emerald', icon: 'ri-shield-check-line',      tab: 'approved'  as const },
          { label: 'Returned / Rejected',    value: rejectedSubs.length,  color: 'red',     icon: 'ri-close-circle-line',      tab: 'rejected'  as const },
        ].map(c => (
          <button
            key={c.tab}
            onClick={() => { setActiveTab(c.tab); setSelectedSubmission(null); }}
            className={`bg-white rounded-xl border-2 p-5 text-left transition-all cursor-pointer ${
              activeTab === c.tab ? `border-${c.color}-400` : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">{c.label}</span>
              <div className={`w-10 h-10 bg-${c.color}-100 rounded-lg flex items-center justify-center`}>
                <i className={`${c.icon} text-xl text-${c.color}-600`}></i>
              </div>
            </div>
            <p className={`text-4xl font-bold text-${c.color}-600`}>{c.value}</p>
          </button>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([
          { id: 'verified' as const,  label: 'Pending Approval' },
          { id: 'approved' as const,  label: 'Approved'         },
          { id: 'rejected' as const,  label: 'Rejected'         },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setSelectedSubmission(null); }}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.id ? 'bg-white text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
            {t.id === 'verified' && verifiedSubs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                {verifiedSubs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {selectedSubmission ? (
        /* Detail view */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedSubmission(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            Back to list
          </button>

          {/* Submission card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {selectedSubmission.teacher.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSubmission.teacher}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedSubmission.subject} · {selectedSubmission.class} · {selectedSubmission.term}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <i className="ri-time-line mr-1"></i>Verified {formatAgo(selectedSubmission.submittedAt)}
                  </p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold whitespace-nowrap">
                Awaiting Your Approval
              </span>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              {[
                { label: 'Students', value: selectedSubmission.totalStudents },
                { label: 'Class Average', value: `${selectedSubmission.averageScore.toFixed(1)}%` },
                {
                  label: 'A Grades',
                  value: selectedSubmission.students.filter(s => s.grade === 'A+' || s.grade === 'A').length,
                },
                {
                  label: 'Below Pass',
                  value: selectedSubmission.students.filter(s => {
                    const pct = (s.score / s.maxScore) * 100;
                    return pct < 50;
                  }).length,
                },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Students table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Student Marks Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSubmission.students.map((s, i) => {
                    const pct = Math.min(100, (s.score / s.maxScore) * 100);
                    const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-teal-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    const gradeColor = pct >= 80 ? 'bg-emerald-100 text-emerald-700'
                                     : pct >= 60 ? 'bg-teal-100 text-teal-700'
                                     : pct >= 50 ? 'bg-amber-100 text-amber-700'
                                     : 'bg-red-100 text-red-700';
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm text-gray-400">{i + 1}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                          {s.score}/{s.maxScore}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`text-sm font-semibold ${pct >= 50 ? 'text-teal-600' : 'text-red-600'}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gradeColor}`}>
                            {s.grade}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action bar */}
          {activeTab === 'verified' && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-close-circle-line mr-2"></i>
                Return to Dean
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                <i className="ri-shield-check-line mr-2"></i>
                Approve — Unlock Report Cards
              </button>
            </div>
          )}
        </div>

      ) : (
        /* List view */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
                <p className="text-gray-500 mt-4 text-sm">Loading submissions…</p>
              </div>
            </div>
          ) : currentSubs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${
                  activeTab === 'verified'  ? 'ri-checkbox-circle-line text-teal-400' :
                  activeTab === 'approved'  ? 'ri-shield-check-line text-emerald-400' :
                  'ri-close-circle-line text-red-400'
                } text-3xl`}></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {activeTab === 'verified'  ? 'No submissions awaiting approval' :
                 activeTab === 'approved'  ? 'No approved marks yet'            :
                 'No rejected marks'                                               }
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab === 'verified'
                  ? 'The Dean hasn\'t verified any marks yet, or all have been processed.'
                  : activeTab === 'approved'
                  ? 'Approved marks will appear here once you give final sign-off.'
                  : 'Returned submissions will appear here.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentSubs.map(sub => (
                <div key={sub.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${
                        activeTab === 'approved' ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : activeTab === 'rejected' ? 'bg-gradient-to-br from-red-400 to-pink-500'
                        : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                      }`}>
                        {sub.teacher.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">{sub.teacher}</h3>
                        <p className="text-sm text-gray-500">{sub.subject} · {sub.class} · {sub.term}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span><i className="ri-user-line mr-1"></i>{sub.totalStudents} students</span>
                          <span><i className="ri-bar-chart-line mr-1"></i>Avg: {sub.averageScore.toFixed(1)}%</span>
                          <span><i className="ri-time-line mr-1"></i>{formatAgo(sub.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {activeTab === 'verified' && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap">
                          Dean Verified — Pending Your Action
                        </span>
                      )}
                      {activeTab === 'approved' && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold whitespace-nowrap">
                          <i className="ri-shield-check-line mr-1"></i>Approved
                        </span>
                      )}
                      {activeTab === 'rejected' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold whitespace-nowrap">
                          <i className="ri-close-circle-line mr-1"></i>Returned
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          activeTab === 'verified'
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {activeTab === 'verified' ? 'Review & Decide' : 'View Details'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Approve Confirmation Modal ───────────────────────────────── */}
      {showApproveModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="ri-shield-check-line text-3xl text-emerald-600"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Final Approval
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              You are giving final approval to{' '}
              <strong className="text-gray-800">{selectedSubmission.subject}</strong> marks for{' '}
              <strong className="text-gray-800">{selectedSubmission.class}</strong> submitted by{' '}
              <strong className="text-gray-800">{selectedSubmission.teacher}</strong>.
              <br /><br />
              This will set all <strong>{selectedSubmission.totalStudents} marks</strong> to{' '}
              <span className="text-emerald-600 font-semibold">Approved</span> and unlock report card generation.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Approving…</>
                ) : (
                  <><i className="ri-shield-check-line"></i> Approve</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject / Return Modal ────────────────────────────────────── */}
      {showRejectModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <i className="ri-arrow-go-back-line text-3xl text-red-500"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Return to Dean
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              Explain why these marks are being returned so the Dean can address the issue.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter reason for returning (e.g., grades seem inconsistent, missing students…)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={saving || !rejectReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <><i className="ri-loader-4-line animate-spin"></i> Returning…</>
                ) : (
                  <><i className="ri-arrow-go-back-line"></i> Return to Dean</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
