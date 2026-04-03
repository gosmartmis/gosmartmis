import { useState, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useMarks } from '../../../hooks/useMarks';
import { useTerms } from '../../../hooks/useTerms';
import { supabase } from '../../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'pending' | 'verified' | 'approved' | 'rejected';

interface StudentRow {
  markId: string;          // ← actual DB row id for patching
  studentId: string;
  name: string;
  score: number;
  maxScore: number;
  pct: number;
  grade: string;
}

interface GroupedSubmission {
  key: string;
  subject: string;
  className: string;
  term: string;
  termId: string;
  submittedAt: string;
  studentCount: number;
  averagePct: number;
  status: string;
  remarks?: string;
  students: StudentRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gradePct(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  pending:  { label: 'Awaiting Dean',     bg: 'bg-amber-100',   text: 'text-amber-700',   icon: 'ri-time-line'            },
  verified: { label: 'Dean Verified',     bg: 'bg-teal-100',    text: 'text-teal-700',    icon: 'ri-shield-check-line'    },
  approved: { label: 'Director Approved', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'ri-checkbox-circle-fill' },
  rejected: { label: 'Returned',          bg: 'bg-red-100',     text: 'text-red-700',     icon: 'ri-close-circle-line'    },
};

// ─── Progress Tracker ─────────────────────────────────────────────────────────
function ProgressTracker({ status }: { status: string }) {
  const steps = [
    { key: 'pending',  label: 'Submitted',   icon: 'ri-upload-line'          },
    { key: 'verified', label: 'Dean Review', icon: 'ri-shield-check-line'    },
    { key: 'approved', label: 'Director OK', icon: 'ri-checkbox-circle-fill' },
  ];

  const getState = (stepKey: string) => {
    if (status === 'rejected') {
      if (stepKey === 'pending')  return 'done';
      if (stepKey === 'verified') return 'rejected';
      return 'upcoming';
    }
    const order = ['pending', 'verified', 'approved'];
    const cur  = order.indexOf(status);
    const idx  = order.indexOf(stepKey);
    if (idx < cur)  return 'done';
    if (idx === cur) return 'active';
    return 'upcoming';
  };

  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const state = getState(s.key);
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                state === 'done'     ? 'bg-emerald-500 text-white' :
                state === 'active'  ? 'bg-teal-500 text-white ring-4 ring-teal-100' :
                state === 'rejected'? 'bg-red-500 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                <i className={state === 'done' ? 'ri-check-line' : state === 'rejected' ? 'ri-close-line' : s.icon}></i>
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                state === 'done'     ? 'text-emerald-600' :
                state === 'active'  ? 'text-teal-600'    :
                state === 'rejected'? 'text-red-500'      :
                'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-14 h-0.5 mb-5 mx-1 ${
                state === 'done' ? 'bg-emerald-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
interface DrawerProps {
  sub: GroupedSubmission;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
  onResubmitted: () => void;
}

function DetailDrawer({ sub, schoolId, teacherId, teacherName, onClose, onResubmitted }: DrawerProps) {
  const meta = STATUS_META[sub.status] ?? STATUS_META.pending;

  // Edit mode state — keyed by markId → edited score
  const [editing, setEditing] = useState(false);
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const enterEditMode = () => {
    // Pre-fill with current scores
    const init: Record<string, number> = {};
    sub.students.forEach(s => { init[s.markId] = s.score; });
    setEditedScores(init);
    setEditing(true);
  };

  const handleScoreChange = (markId: string, raw: string, max: number) => {
    const val = Math.min(max, Math.max(0, parseFloat(raw) || 0));
    setEditedScores(prev => ({ ...prev, [markId]: val }));
  };

  const handleResubmit = async () => {
    setSubmitting(true);
    try {
      for (const student of sub.students) {
        const newScore = editedScores[student.markId] ?? student.score;
        const pct      = (newScore / student.maxScore) * 100;
        await supabase
          .from('marks')
          .update({
            score:        newScore,
            percentage:   Math.round(pct),
            grade:        gradePct(pct),
            status:       'pending',
            remarks:      null,
            submitted_at: new Date().toISOString(),
          })
          .eq('id', student.markId);
      }
      showToast('success', 'Marks re-submitted! Awaiting Dean review.');
      setEditing(false);
      setTimeout(() => {
        onResubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      showToast('error', 'Re-submit failed. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Edited avg preview
  const editedAvg = editing && sub.students.length > 0
    ? sub.students.reduce((sum, s) => {
        const sc = editedScores[s.markId] ?? s.score;
        return sum + (sc / s.maxScore) * 100;
      }, 0) / sub.students.length
    : sub.averagePct;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={editing ? undefined : onClose} />

      {/* Drawer panel */}
      <div className="w-full max-w-xl bg-white h-full flex flex-col">

        {/* Toast */}
        {toast && (
          <div className={`absolute top-4 left-4 right-4 z-10 px-4 py-3 rounded-xl text-white text-sm font-semibold flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            <i className={toast.type === 'success' ? 'ri-checkbox-circle-line text-lg' : 'ri-error-warning-line text-lg'}></i>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{sub.subject}</h3>
            <p className="text-sm text-gray-500">{sub.className} · {sub.term}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <i className="ri-close-line text-xl text-gray-500"></i>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Status + progress */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${meta.bg} ${meta.text}`}>
                <i className={meta.icon}></i>
                {meta.label}
              </span>
              <span className="text-xs text-gray-400">{timeAgo(sub.submittedAt)}</span>
            </div>
            <ProgressTracker status={sub.status} />
          </div>

          {/* ── Rejection banner + Re-submit CTA ─────────────────────── */}
          {sub.status === 'rejected' && !editing && (
            <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
              <div className="p-4 flex gap-3">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="ri-feedback-line text-red-600 text-lg"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800 mb-1">Feedback from Reviewer</p>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {sub.remarks || 'No specific reason was provided.'}
                  </p>
                </div>
              </div>
              <div className="border-t border-red-200 bg-red-100/50 px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-xs text-red-700 font-medium">
                  Edit the scores below and re-submit for Dean review.
                </p>
                <button
                  onClick={enterEditMode}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-edit-2-line"></i>
                  Edit &amp; Re-submit
                </button>
              </div>
            </div>
          )}

          {/* ── Edit mode banner ─────────────────────────────────────── */}
          {editing && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="ri-pencil-line text-amber-600"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Edit Mode</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Update each student&apos;s score, then click Re-submit. Status will reset to Pending for Dean review.
                </p>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Students',  value: sub.studentCount,                   icon: 'ri-group-line',       color: 'text-teal-600',   bg: 'bg-teal-50'   },
              { label: 'Class Avg', value: `${editedAvg.toFixed(1)}%`,         icon: 'ri-bar-chart-line',   color: 'text-emerald-600', bg: 'bg-emerald-50'},
              {
                label: 'Pass Rate',
                value: sub.studentCount > 0
                  ? `${Math.round((sub.students.filter(s => {
                      const sc = editing ? (editedScores[s.markId] ?? s.score) : s.score;
                      return (sc / s.maxScore) * 100 >= 50;
                    }).length / sub.studentCount) * 100)}%`
                  : '0%',
                icon: 'ri-user-follow-line', color: 'text-amber-600', bg: 'bg-amber-50',
              },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                <div className="w-8 h-8 flex items-center justify-center mx-auto mb-2">
                  <i className={`${stat.icon} ${stat.color} text-lg`}></i>
                </div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Student list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                {editing ? 'Edit Scores' : 'Student Breakdown'}
              </h4>
              {editing && (
                <span className="text-xs text-gray-400">Enter score out of max</span>
              )}
            </div>

            <div className="space-y-2">
              {sub.students.map((s, i) => {
                const displayScore = editing ? (editedScores[s.markId] ?? s.score) : s.score;
                const displayPct   = (displayScore / s.maxScore) * 100;
                const displayGrade = gradePct(displayPct);
                const barColor     = displayPct >= 80 ? 'bg-emerald-500' : displayPct >= 60 ? 'bg-teal-500' : displayPct >= 50 ? 'bg-amber-500' : 'bg-red-500';
                const gradeColor   = displayPct >= 80 ? 'bg-emerald-100 text-emerald-700'
                                   : displayPct >= 60 ? 'bg-teal-100 text-teal-700'
                                   : displayPct >= 50 ? 'bg-amber-100 text-amber-700'
                                   : 'bg-red-100 text-red-700';

                return (
                  <div key={s.markId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{s.name}</span>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {editing ? (
                            /* Score input */
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={s.maxScore}
                                value={editedScores[s.markId] ?? s.score}
                                onChange={e => handleScoreChange(s.markId, e.target.value, s.maxScore)}
                                className="w-16 px-2 py-1 border border-amber-300 rounded-lg text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              />
                              <span className="text-xs text-gray-400">/{s.maxScore}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">{s.score}/{s.maxScore}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor}`}>
                            {displayGrade}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(100, displayPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sticky footer (edit mode actions) ──────────────────────── */}
        {editing && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-white px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => setEditing(false)}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResubmit}
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <><i className="ri-loader-4-line animate-spin"></i> Re-submitting…</>
              ) : (
                <><i className="ri-send-plane-line"></i> Re-submit for Review</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MarksApproval() {
  const { profile } = useAuth();
  const { terms } = useTerms(profile?.school_id);
  const { marks, loading, error, refetch } = useMarks({
    schoolId:  profile?.school_id || null,
    teacherId: profile?.id        || undefined,
  });

  const [filter,      setFilter]      = useState<StatusFilter>('all');
  const [selectedSub, setSelectedSub] = useState<GroupedSubmission | null>(null);

  // ── Group raw marks into per-subject submissions ──────────────────────────
  const grouped = useCallback((): GroupedSubmission[] => {
    const map = new Map<string, GroupedSubmission>();

    marks.forEach(m => {
      const key     = `${m.class_id}-${m.subject_id}-${m.term_id}`;
      const max     = Number(m.max_score) || 100;
      const pct     = Math.min(100, ((Number(m.score) || 0) / max) * 100);
      const termName = terms.find(t => t.id === m.term_id)?.name || '—';

      if (!map.has(key)) {
        map.set(key, {
          key,
          subject:      m.subject_name || 'Unknown Subject',
          className:    m.class_name   || 'Unknown Class',
          term:         termName,
          termId:       m.term_id,
          submittedAt:  m.submitted_at || m.updated_at || m.created_at,
          studentCount: 0,
          averagePct:   0,
          status:       m.status,
          remarks:      m.remarks,
          students:     [],
        });
      }

      const sub = map.get(key)!;
      sub.studentCount += 1;
      sub.averagePct   += pct;
      sub.students.push({
        markId:    m.id,
        studentId: m.student_id,
        name:      m.student_name || 'Unknown',
        score:     Number(m.score) || 0,
        maxScore:  max,
        pct,
        grade:     gradePct(pct),
      });

      // Escalate to highest status in group
      const order = ['pending', 'rejected', 'verified', 'approved'];
      if (order.indexOf(m.status) > order.indexOf(sub.status)) {
        sub.status  = m.status;
        if (m.remarks) sub.remarks = m.remarks;
      }
    });

    map.forEach(sub => {
      if (sub.studentCount > 0) sub.averagePct /= sub.studentCount;
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [marks, terms]);

  const allSubs  = grouped();
  const pending  = allSubs.filter(s => s.status === 'pending');
  const verified = allSubs.filter(s => s.status === 'verified');
  const approved = allSubs.filter(s => s.status === 'approved');
  const rejected = allSubs.filter(s => s.status === 'rejected');

  const displayed =
    filter === 'pending'  ? pending  :
    filter === 'verified' ? verified :
    filter === 'approved' ? approved :
    filter === 'rejected' ? rejected :
    allSubs;

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-500 mt-4">Loading your submissions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
        <i className="ri-error-warning-line text-2xl text-red-600"></i>
        <div>
          <p className="font-bold text-red-900">Failed to load marks</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">

        {/* Page header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marks Submission Status</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your submitted marks and re-submit any that were returned
          </p>
        </div>

        {/* Pipeline explainer */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ri-information-line text-teal-600 text-lg"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-teal-900 mb-2">Approval Pipeline</p>
              <div className="flex items-center gap-2 flex-wrap text-sm">
                {[
                  { icon: 'ri-upload-line',           label: 'You submit'          },
                  { icon: 'ri-shield-check-line',      label: 'Dean verifies'       },
                  { icon: 'ri-checkbox-circle-fill',   label: 'Director approves', highlight: true },
                  { icon: 'ri-file-text-line',         label: 'Report cards unlock' },
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium ${
                      item.highlight
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-teal-200 text-teal-700'
                    }`}>
                      <i className={item.icon}></i> {item.label}
                    </span>
                    {i < arr.length - 1 && <i className="ri-arrow-right-line text-teal-400"></i>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Awaiting Dean',     count: pending.length,  status: 'pending'  as StatusFilter, color: 'amber',   icon: 'ri-time-line'            },
            { label: 'Dean Verified',     count: verified.length, status: 'verified' as StatusFilter, color: 'teal',    icon: 'ri-shield-check-line'    },
            { label: 'Director Approved', count: approved.length, status: 'approved' as StatusFilter, color: 'emerald', icon: 'ri-checkbox-circle-fill' },
            { label: 'Returned',          count: rejected.length, status: 'rejected' as StatusFilter, color: 'red',     icon: 'ri-close-circle-line'    },
          ].map(c => (
            <button
              key={c.status}
              onClick={() => setFilter(filter === c.status ? 'all' : c.status)}
              className={`bg-white rounded-2xl border-2 p-5 text-left transition-all cursor-pointer ${
                filter === c.status ? `border-${c.color}-400` : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-${c.color}-100 rounded-xl flex items-center justify-center`}>
                  <i className={`${c.icon} text-xl text-${c.color}-600`}></i>
                </div>
                {c.count > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${c.color}-100 text-${c.color}-700`}>
                    {c.count}
                  </span>
                )}
              </div>
              <p className={`text-3xl font-bold text-${c.color}-600`}>{c.count}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">{c.label}</p>
            </button>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
          {([
            { id: 'all'      as StatusFilter, label: `All (${allSubs.length})`       },
            { id: 'pending'  as StatusFilter, label: `Pending (${pending.length})`   },
            { id: 'verified' as StatusFilter, label: `Verified (${verified.length})` },
            { id: 'approved' as StatusFilter, label: `Approved (${approved.length})` },
            { id: 'rejected' as StatusFilter, label: `Returned (${rejected.length})` },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === t.id ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        {displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No submissions found</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {filter === 'all'
                ? 'Enter marks from the Marks Entry tab and they will appear here once submitted.'
                : `No submissions with status "${filter}" at the moment.`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {displayed.length} submission{displayed.length !== 1 ? 's' : ''}
              </h3>
              <span className="text-xs text-gray-400">Click a row to view details</span>
            </div>

            <div className="divide-y divide-gray-100">
              {displayed.map(sub => {
                const meta = STATUS_META[sub.status] ?? STATUS_META.pending;
                const isReturned = sub.status === 'rejected';
                return (
                  <div
                    key={sub.key}
                    onClick={() => setSelectedSub(sub)}
                    className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer flex-wrap ${
                      isReturned ? 'bg-red-50/30' : ''
                    }`}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                        <i className={`${meta.icon} text-xl ${meta.text}`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">{sub.subject}</p>
                          {isReturned && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                              Action needed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{sub.className} · {sub.term}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span><i className="ri-group-line mr-1"></i>{sub.studentCount} students</span>
                          <span><i className="ri-bar-chart-line mr-1"></i>Avg: {sub.averagePct.toFixed(1)}%</span>
                          <span><i className="ri-time-line mr-1"></i>{timeAgo(sub.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Mini step indicators */}
                      <div className="hidden sm:flex items-center gap-1.5">
                        {(['pending', 'verified', 'approved'] as const).map((s, i) => {
                          const order = ['pending', 'verified', 'approved'];
                          const cur  = order.indexOf(sub.status === 'rejected' ? 'pending' : sub.status);
                          const idx  = order.indexOf(s);
                          const rej  = sub.status === 'rejected' && s === 'verified';
                          const done = idx < cur || (sub.status === 'approved' && idx <= cur);
                          const active = idx === cur && sub.status !== 'rejected';
                          return (
                            <div key={s} className="flex items-center gap-1.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                rej ? 'bg-red-500 text-white' :
                                done || active ? 'bg-teal-500 text-white' :
                                'bg-gray-200 text-gray-400'
                              }`}>
                                {rej ? <i className="ri-close-line"></i> :
                                 done ? <i className="ri-check-line"></i> :
                                 active ? <i className="ri-radio-button-line"></i> :
                                             <i className="ri-circle-line"></i>}
                              </div>
                              {i < 2 && <div className={`w-4 h-0.5 ${done ? 'bg-teal-400' : 'bg-gray-200'}`} />}
                            </div>
                          );
                        })}
                      </div>

                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>

                      <div className="w-5 h-5 flex items-center justify-center">
                        <i className="ri-arrow-right-s-line text-gray-400 text-lg"></i>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedSub && (
        <DetailDrawer
          sub={selectedSub}
          schoolId={profile?.school_id || ''}
          teacherId={profile?.id || ''}
          teacherName={profile?.full_name || 'Teacher'}
          onClose={() => setSelectedSub(null)}
          onResubmitted={() => {
            setSelectedSub(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
