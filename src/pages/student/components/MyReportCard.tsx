import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useStudents } from '../../../hooks/useStudents';
import { useStudentMarks } from '../../../hooks/useStudentMarks';
import { useReportCard } from '../../../hooks/useReportCard';
import ReportCardPreview from '../../../components/ReportCardPreview';
import { downloadReportCard } from '../../../utils/reportCardGenerator';

/* ─── Status helpers ───────────────────────────────────────────────── */
function statusBadge(status: 'approved' | 'verified' | 'pending') {
  const map = {
    approved: { label: 'Published', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'ri-checkbox-circle-fill' },
    verified: { label: 'Dean Verified', bg: 'bg-teal-100', text: 'text-teal-700', icon: 'ri-shield-check-line' },
    pending: { label: 'Pending Review', bg: 'bg-amber-100', text: 'text-amber-700', icon: 'ri-time-line' },
  };
  return map[status] ?? map.pending;
}

function getGrade(avg: number) {
  if (avg >= 80) return { label: 'A', color: 'text-emerald-600' };
  if (avg >= 70) return { label: 'B', color: 'text-teal-600' };
  if (avg >= 60) return { label: 'C', color: 'text-amber-600' };
  if (avg >= 50) return { label: 'D', color: 'text-orange-600' };
  return { label: 'F', color: 'text-red-600' };
}

/* ─── Report Card Loader modal ──────────────────────────────────────── */
interface LoaderModalProps {
  studentId: string;
  termId: string;
  termName: string;
  onClose: () => void;
  mode: 'preview' | 'download';
}

function ReportCardLoader({ studentId, termId, termName, onClose, mode }: LoaderModalProps) {
  const { reportCardData, loading, error } = useReportCard(studentId, termId);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!reportCardData) return;
    setDownloading(true);
    try {
      await downloadReportCard(reportCardData);
    } catch {
      /* silently ignore */
    } finally {
      setDownloading(false);
      onClose();
    }
  };

  // Once data is ready for download mode, auto-trigger
  if (!loading && !error && reportCardData && mode === 'download') {
    if (!downloading) {
      handleDownload();
    }
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-xl">
          <i className="ri-loader-4-line text-5xl text-teal-600 animate-spin"></i>
          <p className="text-gray-700 font-medium">Generating PDF…</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-xl">
          <i className="ri-loader-4-line text-5xl text-teal-600 animate-spin"></i>
          <p className="text-gray-700 font-medium">Loading report card for {termName}…</p>
        </div>
      </div>
    );
  }

  if (error || !reportCardData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl text-center">
          <i className="ri-error-warning-line text-5xl text-amber-500 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Report Card Not Available</h3>
          <p className="text-sm text-gray-600 mb-6">
            {error || 'Your report card for this term has not been generated yet. Please check back once marks are finalised.'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return <ReportCardPreview data={reportCardData} onClose={onClose} />;
}

/* ─── Term Summary Card ─────────────────────────────────────────────── */
interface TermCardProps {
  term: string;
  termId: string;
  average: number;
  total: number;
  maxTotal: number;
  rank: number;
  classSize: number;
  subjectCount: number;
  status: 'approved' | 'verified' | 'pending';
  onPreview: () => void;
  onDownload: () => void;
}

function TermCard({
  term, average, total, maxTotal, rank, classSize, subjectCount, status, onPreview, onDownload,
}: TermCardProps) {
  const badge = statusBadge(status);
  const grade = getGrade(average);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-teal-200 transition-colors">
      {/* Top stripe */}
      <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">{term}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subjectCount} subjects</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
            <i className={`${badge.icon} text-sm`}></i>
            {badge.label}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${grade.color}`}>{grade.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">Grade</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{average}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Average</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{rank}<span className="text-sm text-gray-400">/{classSize}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">Rank</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Total Score</span>
            <span className="text-xs font-semibold text-gray-700">{total} / {maxTotal}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all"
              style={{ width: `${maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            <i className="ri-eye-line w-4 h-4 flex items-center justify-center"></i>
            Preview
          </button>
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all text-sm font-semibold whitespace-nowrap cursor-pointer"
          >
            <i className="ri-download-2-line w-4 h-4 flex items-center justify-center"></i>
            Download PDF
          </button>
        </div>

        {status === 'pending' && (
          <p className="text-xs text-amber-600 mt-3 text-center">
            Report card will be available once marks are approved
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function MyReportCard() {
  const { user } = useAuth();
  const { students } = useStudents();
  const currentStudent = students.find(s => s.user_id === user?.id);
  const studentId = currentStudent?.id || '';

  const { examResults, loading, error } = useStudentMarks(studentId);

  const [loader, setLoader] = useState<{
    termId: string;
    termName: string;
    mode: 'preview' | 'download';
  } | null>(null);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-600 mt-4">Loading your report cards…</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
          <div>
            <h3 className="font-bold text-red-900">Error Loading Report Cards</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Count published vs pending ── */
  const publishedCount = examResults.filter(t => t.exams[0]?.status === 'approved').length;
  const pendingCount = examResults.filter(t => t.exams[0]?.status !== 'approved').length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Report Cards</h2>
          <p className="text-sm text-gray-500 mt-1">
            Preview and download your official academic report cards
          </p>
        </div>
        {examResults.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-checkbox-circle-fill text-emerald-600"></i>
              </div>
              <span className="text-sm font-semibold text-emerald-700">{publishedCount} Published</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-time-line text-amber-600"></i>
                </div>
                <span className="text-sm font-semibold text-amber-700">{pendingCount} Pending</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className="ri-information-line text-teal-600 text-xl"></i>
        </div>
        <div>
          <h4 className="font-semibold text-teal-900 mb-1">About Your Report Cards</h4>
          <p className="text-sm text-teal-700 leading-relaxed">
            Report cards become available after your marks have been verified by the Dean of Studies and approved by the Director.
            Once published, you can preview them online or download an official PDF copy.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {examResults.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <i className="ri-file-text-line text-4xl text-teal-500"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Report Cards Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Your report cards will appear here once marks have been entered and approved for each term.
          </p>
        </div>
      )}

      {/* Report card grid */}
      {examResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {examResults.map((termData) => {
            const exam = termData.exams[0];
            if (!exam) return null;
            return (
              <TermCard
                key={termData.termId}
                term={termData.term}
                termId={termData.termId}
                average={exam.average}
                total={exam.total}
                maxTotal={exam.maxTotal}
                rank={exam.rank}
                classSize={exam.classSize}
                subjectCount={exam.subjects.length}
                status={exam.status}
                onPreview={() => setLoader({ termId: termData.termId, termName: termData.term, mode: 'preview' })}
                onDownload={() => setLoader({ termId: termData.termId, termName: termData.term, mode: 'download' })}
              />
            );
          })}
        </div>
      )}

      {/* How it works section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">How the Approval Process Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', icon: 'ri-edit-2-line', label: 'Teacher Enters Marks', desc: 'Your subject teacher records your scores for the term', color: 'bg-blue-50 text-blue-600' },
            { step: '2', icon: 'ri-shield-check-line', label: 'Dean Verifies', desc: 'The Dean of Studies reviews and verifies all submitted marks', color: 'bg-teal-50 text-teal-600' },
            { step: '3', icon: 'ri-checkbox-circle-line', label: 'Director Approves', desc: 'The Director gives final approval and your report card is published', color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ step, icon, label, desc, color }) => (
            <div key={step} className="flex gap-4 p-4 rounded-xl bg-gray-50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <i className={`${icon} text-lg`}></i>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Step {step}</p>
                <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loader / Preview modal */}
      {loader && studentId && (
        <ReportCardLoader
          studentId={studentId}
          termId={loader.termId}
          termName={loader.termName}
          mode={loader.mode}
          onClose={() => setLoader(null)}
        />
      )}
    </div>
  );
}
