import { useState, useEffect } from 'react';
import { useStudentMarks } from '../../../hooks/useStudentMarks';
import { useAuth } from '../../../hooks/useAuth';
import { useStudents } from '../../../hooks/useStudents';
import { useReportCard } from '../../../hooks/useReportCard';
import { downloadReportCard } from '../../../utils/reportCardGenerator';
import ReportCardPreview from '../../../components/ReportCardPreview';

export default function Marks() {
  const { user } = useAuth();
  const { students } = useStudents();
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState(0);
  const [showReportCard, setShowReportCard] = useState(false);
  const [reportTermId, setReportTermId] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Get current student ID
  const currentStudent = students.find(s => s.user_id === user?.id);
  const studentId = currentStudent?.id || '';

  // Fetch real marks data
  const { examResults, loading, error } = useStudentMarks(studentId);

  // Set default term when data loads
  useEffect(() => {
    if (examResults.length > 0 && !selectedTerm) {
      setSelectedTerm(examResults[0].term);
      setReportTermId(examResults[0].termId);
    }
  }, [examResults]);

  // Sync reportTermId when selectedTerm changes
  useEffect(() => {
    const found = examResults.find(t => t.term === selectedTerm);
    if (found) setReportTermId(found.termId);
  }, [selectedTerm, examResults]);

  const termData = examResults.find(t => t.term === selectedTerm);
  const examData = termData?.exams[selectedExam];

  // Fetch real report card data from Supabase
  const {
    reportCardData,
    loading: reportCardLoading,
    error: reportCardError,
  } = useReportCard(showReportCard ? studentId : '', showReportCard ? reportTermId : '');

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 70) return 'bg-teal-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-100';
    if (grade.startsWith('B')) return 'text-teal-600 bg-teal-100';
    if (grade.startsWith('C')) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const handleDownloadReportCard = async () => {
    if (!reportTermId || !studentId) return;
    
    setDownloadingReport(true);
    try {
      // Fetch report card data directly
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_report_card_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_student_id: studentId,
          p_term_id: reportTermId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report card data');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        alert('No report card data available for this term. Please contact your school administrator.');
        return;
      }

      // Generate and download PDF
      await downloadReportCard(data[0]);
      
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report card. Please try again or contact support.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleOpenReportCard = () => {
    if (!reportTermId) return;
    setShowReportCard(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-600 mt-4">Loading marks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <i className="ri-error-warning-line text-2xl text-red-600"></i>
          <div>
            <h3 className="font-bold text-red-900">Error Loading Marks</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (examResults.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Marks</h2>
            <p className="text-sm text-gray-600 mt-1">View your examination results and progress</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <i className="ri-file-list-line text-5xl text-yellow-600 mb-4"></i>
          <h3 className="text-lg font-bold text-yellow-900 mb-2">No Marks Available</h3>
          <p className="text-sm text-yellow-700">
            Your examination marks have not been entered yet. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Marks</h2>
          <p className="text-sm text-gray-600 mt-1">View your examination results and progress</p>
        </div>
        <button
          onClick={handleDownloadReportCard}
          disabled={!reportTermId || downloadingReport}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadingReport ? (
            <>
              <i className="ri-loader-4-line w-5 h-5 flex items-center justify-center animate-spin"></i>
              <span className="font-medium">Downloading...</span>
            </>
          ) : (
            <>
              <i className="ri-file-download-line w-5 h-5 flex items-center justify-center"></i>
              <span className="font-medium">Download Report Card</span>
            </>
          )}
        </button>
      </div>

      {/* Term & Exam Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={selectedTerm}
            onChange={(e) => {
              setSelectedTerm(e.target.value);
              setSelectedExam(0);
            }}
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {examResults.map((term) => (
              <option key={term.termId} value={term.term}>{term.term}</option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 flex items-center justify-center"></i>
        </div>

        {termData && termData.exams.length > 1 && (
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200">
            {termData.exams.map((exam, index) => (
              <button
                key={index}
                onClick={() => setSelectedExam(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedExam === index
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {exam.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {examData && (
        <>
          {/* Marks Pending Approval Banner */}
          {examData.status !== 'approved' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-time-line text-white text-sm"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-amber-900 font-semibold mb-1">Marks Pending Approval</h4>
                <p className="text-amber-700 text-sm">
                  {examData.status === 'verified'
                    ? 'These marks have been verified by the Dean of Studies and are awaiting final approval from the Director before being officially published.'
                    : 'These marks are currently under review and have not yet been published. They will be visible once approved by the Dean of Studies and Director.'}
                </p>
              </div>
            </div>
          )}

          {/* Exam Summary Card */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{examData.name}</h3>
                <p className="text-teal-100 mt-1">{examData.date}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{examData.average}%</p>
                <p className="text-teal-100">Average Score</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-6 pt-6 border-t border-white/20">
              <div>
                <p className="text-2xl font-bold">{examData.total}/{examData.maxTotal}</p>
                <p className="text-sm text-teal-100">Total Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{examData.rank}</p>
                <p className="text-sm text-teal-100">Class Rank</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{examData.classSize}</p>
                <p className="text-sm text-teal-100">Class Size</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {examData.subjects.filter(s => s.grade.startsWith('A')).length}
                </p>
                <p className="text-sm text-teal-100">A Grades</p>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Subject Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Teacher</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Score</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Percentage</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {examData.subjects.map((subject, index) => {
                    const percentage = (subject.score / subject.maxScore) * 100;
                    return (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">{subject.subject}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{subject.teacher}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-semibold text-gray-900">{subject.score}/{subject.maxScore}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getProgressColor(percentage)}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-12">{percentage.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 text-sm font-bold rounded-full whitespace-nowrap ${getGradeColor(subject.grade)}`}>
                            {subject.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Graph */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Subject Performance Comparison</h3>
            <div className="space-y-4">
              {examData.subjects.map((subject, index) => {
                const percentage = (subject.score / subject.maxScore) * 100;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">{subject.subject}</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProgressColor(percentage)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-bold text-gray-900">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Report Card Modal — powered by real Supabase data */}
      {showReportCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {reportCardLoading ? (
            <div className="bg-white rounded-2xl p-12 flex flex-col items-center gap-4 shadow-xl">
              <i className="ri-loader-4-line text-5xl text-teal-600 animate-spin"></i>
              <p className="text-gray-700 font-medium">Loading your report card...</p>
            </div>
          ) : reportCardError ? (
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl text-center">
              <i className="ri-error-warning-line text-5xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Could Not Load Report Card</h3>
              <p className="text-sm text-gray-600 mb-6">{reportCardError}</p>
              <button
                onClick={() => setShowReportCard(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
              >
                Close
              </button>
            </div>
          ) : reportCardData ? (
            <ReportCardPreview
              data={reportCardData}
              onClose={() => setShowReportCard(false)}
            />
          ) : (
            <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-xl text-center">
              <i className="ri-file-unknow-line text-5xl text-gray-400 mb-4"></i>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Report Card Not Available</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your report card for this term has not been generated yet. Please contact your school administrator.
              </p>
              <button
                onClick={() => setShowReportCard(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}