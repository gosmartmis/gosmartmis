import { useState, useEffect } from 'react';
import ReportCardPreview from '../../../components/ReportCardPreview';
import { generateReportCardPDF } from '../../../utils/reportCardGenerator';
import { fetchReportCardData } from '../../../utils/reportCardFetcher';
import { ReportCardData } from '../../../types/report-card';
import { useStudentDashboard } from '../../../hooks/useStudentDashboard';
import { useAuth } from '../../../hooks/useAuth';
import { useTerms, Term } from '../../../hooks/useTerms';
import FeeAlertBanner from './FeeAlertBanner';

interface SubjectPerformance {
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface RecentMark {
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  term: string;
}

interface UpcomingEvent {
  title: string;
  date: string;
  type: 'exam' | 'holiday' | 'meeting' | 'event';
}

export default function Dashboard() {
  const { profile } = useAuth();

  // ✅ Pass schoolId so the hook actually fetches terms
  const { terms, activeTerm } = useTerms(profile?.school_id ?? null);

  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [showReportCardPreview, setShowReportCardPreview] = useState(false);
  const [showFeesLockModal, setShowFeesLockModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);
  const [fetchingRC, setFetchingRC] = useState(false);
  const [rcError, setRcError] = useState('');

  const {
    studentInfo,
    subjectPerformance,
    recentMarks,
    reportCardStatus,
    feeStatus,
    loading,
    error
  } = useStudentDashboard(profile?.id || '', selectedTermId);

  // ✅ Proper useEffect — runs when terms loads, defaults to active term then first term
  useEffect(() => {
    if (terms.length > 0 && !selectedTermId) {
      const defaultTerm = activeTerm ?? terms[0];
      setSelectedTermId(defaultTerm.id);
    }
  }, [terms, activeTerm, selectedTermId]);

  // ── Derive real upcoming events from term dates ──────────────────────────
  const upcomingEvents = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    type EventType = 'exam' | 'holiday' | 'meeting' | 'event';

    interface DerivedEvent {
      title: string;
      date: string;
      rawDate: Date;
      type: EventType;
      label: string;
    }

    const events: DerivedEvent[] = [];

    terms.forEach((term: Term) => {
      if (term.start_date) {
        const startDate = new Date(term.start_date);
        startDate.setHours(0, 0, 0, 0);
        if (startDate >= today) {
          events.push({
            title: `${term.name} Begins`,
            date: term.start_date,
            rawDate: startDate,
            type: 'event',
            label: formatEventDate(startDate, today),
          });
        }
      }
      if (term.end_date) {
        const endDate = new Date(term.end_date);
        endDate.setHours(0, 0, 0, 0);
        if (endDate >= today) {
          events.push({
            title: `${term.name} Ends`,
            date: term.end_date,
            rawDate: endDate,
            type: 'holiday',
            label: formatEventDate(endDate, today),
          });
        }
      }
    });

    return events
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
      .slice(0, 4);
  })();

  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceTextColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'exam': return 'ri-file-list-3-line';
      case 'holiday': return 'ri-calendar-event-line';
      case 'meeting': return 'ri-group-line';
      case 'event': return 'ri-trophy-line';
      default: return 'ri-calendar-line';
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case 'exam': return 'bg-red-50 text-red-600 border-red-200';
      case 'holiday': return 'bg-green-50 text-green-600 border-green-200';
      case 'meeting': return 'bg-teal-50 text-teal-600 border-teal-200';
      case 'event': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  /** Fetch real report card data, checking fee/approval gates first */
  const loadReportCard = async (): Promise<ReportCardData | null> => {
    if (!studentInfo?.id || !selectedTermId) {
      setRcError('Missing student or term information.');
      return null;
    }
    setFetchingRC(true);
    setRcError('');
    try {
      const { data, error: fetchError } = await fetchReportCardData(studentInfo.id, selectedTermId);
      if (fetchError || !data) {
        setRcError(fetchError || 'Could not load report card.');
        return null;
      }
      setReportCardData(data);
      return data;
    } catch (err) {
      setRcError('Failed to fetch report card data.');
      return null;
    } finally {
      setFetchingRC(false);
    }
  };

  const handleDownloadReportCard = async () => {
    if (!reportCardStatus) return;
    if (reportCardStatus.feesBalance > 0 || reportCardStatus.downloadLocked) {
      setShowFeesLockModal(true);
      return;
    }
    if (!reportCardStatus.marksApproved) return;

    setIsDownloading(true);
    try {
      const data = reportCardData || await loadReportCard();
      if (!data) return;
      await generateReportCardPDF(data).then(doc => {
        const name = data.studentInfo.name.replace(/\s+/g, '_');
        const term = data.schoolBranding.term.replace(/\s+/g, '_');
        doc.save(`ReportCard_${name}_${term}.pdf`);
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewReportCard = async () => {
    if (!reportCardStatus) return;
    if (reportCardStatus.feesBalance > 0 || reportCardStatus.downloadLocked) {
      setShowFeesLockModal(true);
      return;
    }
    if (!reportCardStatus.marksApproved) return;

    const data = reportCardData || await loadReportCard();
    if (data) setShowReportCardPreview(true);
  };

  const getReportCardButtonStatus = () => {
    if (!reportCardStatus || !reportCardStatus.marksApproved) {
      return { disabled: true, text: 'Not Available', icon: 'ri-lock-line', color: 'bg-gray-100 text-gray-400 cursor-not-allowed' };
    }
    if (reportCardStatus.feesBalance > 0 || reportCardStatus.downloadLocked) {
      return { disabled: false, text: 'Locked - Fees Unpaid', icon: 'ri-lock-line', color: 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer' };
    }
    return { disabled: false, text: 'Download Report Card', icon: 'ri-download-line', color: 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer' };
  };

  const buttonStatus = getReportCardButtonStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-teal-600 animate-spin"></i>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
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
            <h3 className="font-bold text-red-900">Error Loading Dashboard</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <i className="ri-information-line text-2xl text-yellow-600"></i>
          <div>
            <h3 className="font-bold text-yellow-900">No Student Data</h3>
            <p className="text-sm text-yellow-700">Unable to load student information. Please contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome, {studentInfo.name}!</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {profile?.registration_number && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-mono font-bold px-3 py-1 rounded-full">
                  <i className="ri-hashtag text-white/80 text-xs"></i>
                  {profile.registration_number}
                </span>
              )}
              <span className="text-teal-100 text-sm">Class: <span className="font-semibold text-white">{studentInfo.class}</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Class Rank</div>
              <div className="text-lg font-bold">#{studentInfo.classRank}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
              <div className="text-xs text-teal-50 mb-1">Average</div>
              <div className="text-lg font-bold">{studentInfo.averageScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Alert Banner — shown immediately on login if there's any balance issue */}
      {feeStatus && feeStatus.hasBalance && (
        <FeeAlertBanner
          feeStatus={feeStatus}
          onNavigateFees={() => {
            // Navigate to the student fees/marks page — dispatch a custom event
            // that the sidebar can pick up to switch tabs
            window.dispatchEvent(new CustomEvent('student-navigate', { detail: 'fees' }));
          }}
        />
      )}

      {/* RC fetch error */}
      {rcError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <i className="ri-error-warning-line text-red-600" />
          <p className="text-sm text-red-700">{rcError}</p>
          <button onClick={() => setRcError('')} className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"><i className="ri-close-line" /></button>
        </div>
      )}

      {/* Report Card Availability Banner */}
      {reportCardStatus && reportCardStatus.marksApproved && reportCardStatus.reportCardGenerated && (
        <div className={`rounded-2xl p-5 md:p-6 border-2 ${
          reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <i className={`text-2xl ${
                  reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0
                    ? 'ri-lock-line text-red-600' : 'ri-file-text-line text-green-600'
                }`}></i>
              </div>
              <div>
                <h3 className={`font-bold ${reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0 ? 'text-red-900' : 'text-green-900'}`}>
                  {reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0 ? 'Report Card Locked' : 'Report Card Available'}
                </h3>
                <p className={`text-sm ${reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0
                    ? `Outstanding balance: ${reportCardStatus.feesBalance.toLocaleString()} Frw`
                    : reportCardStatus.generatedDate
                    ? `Generated on ${new Date(reportCardStatus.generatedDate).toLocaleDateString()}`
                    : 'Available for download'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!reportCardStatus.downloadLocked && reportCardStatus.feesBalance === 0 && (
                <>
                  <button
                    onClick={handleViewReportCard}
                    disabled={fetchingRC}
                    className="px-4 py-2 bg-white border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {fetchingRC ? <><i className="ri-loader-4-line animate-spin mr-1" />Loading...</> : <><i className="ri-eye-line mr-2" />View</>}
                  </button>
                  <button
                    onClick={handleDownloadReportCard}
                    disabled={isDownloading || fetchingRC}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {isDownloading ? <><i className="ri-loader-4-line animate-spin mr-1" />Generating...</> : <><i className="ri-download-line mr-2" />Download PDF</>}
                  </button>
                </>
              )}
              {(reportCardStatus.downloadLocked || reportCardStatus.feesBalance > 0) && (
                <button onClick={() => setShowFeesLockModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors whitespace-nowrap">
                  <i className="ri-information-line mr-2" />View Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Marks Not Approved Banner */}
      {reportCardStatus && !reportCardStatus.marksApproved && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-time-line text-2xl text-yellow-600"></i>
            </div>
            <div>
              <h3 className="font-bold text-yellow-900">Report Card Not Yet Available</h3>
              <p className="text-sm text-yellow-700">Your marks are being reviewed. Report card will be available once approved by the Dean and Director.</p>
            </div>
          </div>
        </div>
      )}

      {/* Term Selector */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Academic Performance</h2>
        <select
          value={selectedTermId}
          onChange={(e) => {
            setSelectedTermId(e.target.value);
            setReportCardData(null); // reset cached RC on term change
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
        >
          {terms.map(term => (
            <option key={term.id} value={term.id}>{term.name}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-school-line text-2xl text-white"></i>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Assigned Class</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-800">{studentInfo.class}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-calendar-check-line text-2xl text-white"></i>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Attendance Rate</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-800">{studentInfo.attendanceRate}%</p>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${studentInfo.attendanceRate}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{studentInfo.presentDays} / {studentInfo.totalSchoolDays} days</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-bar-chart-box-line text-2xl text-white"></i>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Average Score</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-800">{studentInfo.averageScore}%</p>
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${getPerformanceColor(studentInfo.averageScore)}`} style={{ width: `${studentInfo.averageScore}%` }}></div>
          </div>
          <p className={`text-xs font-medium mt-2 ${getPerformanceTextColor(studentInfo.averageScore)}`}>
            {studentInfo.averageScore >= 80 ? 'Excellent' : studentInfo.averageScore >= 60 ? 'Good' : 'Needs Improvement'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 hover:shadow-md hover:-translate-y-1 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="ri-trophy-line text-2xl text-white"></i>
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Class Ranking</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-800">
            {studentInfo.classRank} <span className="text-lg text-gray-500">/ {studentInfo.totalStudents}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">Top {Math.round((studentInfo.classRank / studentInfo.totalStudents) * 100)}% of class</p>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Subject Performance</h3>
        {subjectPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Percentage</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Performance</th>
                </tr>
              </thead>
              <tbody>
                {subjectPerformance.map((subject, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-800">{subject.subject}</td>
                    <td className="py-4 px-4 text-center text-gray-700">{subject.score}/{subject.maxScore}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-semibold ${getPerformanceTextColor(subject.percentage)}`}>{subject.percentage}%</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div className={`h-3 rounded-full ${getPerformanceColor(subject.percentage)}`} style={{ width: `${subject.percentage}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {subject.percentage >= 80 ? 'Excellent' : subject.percentage >= 60 ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-file-list-line text-4xl mb-2"></i>
            <p>No subject performance data available for this term</p>
          </div>
        )}
      </div>

      {/* Recent Marks & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Marks</h3>
          {recentMarks.length > 0 ? (
            <div className="space-y-3">
              {recentMarks.map((mark, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{mark.subject}</p>
                    <p className="text-xs text-gray-500">{mark.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{mark.score}/{mark.maxScore}</p>
                    <p className={`text-sm font-semibold ${getPerformanceTextColor(mark.percentage)}`}>{mark.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-file-list-line text-4xl mb-2"></i>
              <p>No recent marks available</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Upcoming Events</h3>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${getEventColor(event.type)}`}>
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <i className={`${getEventIcon(event.type)} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{event.title}</p>
                    <p className="text-xs opacity-75 mt-0.5">{event.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 mb-3">
                <i className="ri-calendar-check-line text-2xl text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">No upcoming events</p>
              <p className="text-xs text-gray-400 mt-1">Events will appear here when terms are scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleViewReportCard}
            disabled={(buttonStatus.disabled && !(reportCardStatus?.downloadLocked)) || fetchingRC}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${buttonStatus.color} disabled:opacity-50`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              buttonStatus.disabled ? 'bg-gray-300' :
              (reportCardStatus?.downloadLocked || (reportCardStatus?.feesBalance ?? 0) > 0) ? 'bg-red-600' : 'bg-teal-600'
            }`}>
              <i className={`${fetchingRC ? 'ri-loader-4-line animate-spin' : buttonStatus.icon} text-xl text-white`}></i>
            </div>
            <span className="text-xs md:text-sm font-medium text-center whitespace-nowrap">
              {fetchingRC ? 'Loading...' : (reportCardStatus?.downloadLocked || (reportCardStatus?.feesBalance ?? 0) > 0) ? 'View Report Card' : buttonStatus.text}
            </span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <i className="ri-message-3-line text-xl text-white"></i>
            </div>
            <span className="text-xs md:text-sm font-medium text-green-900 whitespace-nowrap">Send Message</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center">
              <i className="ri-calendar-2-line text-xl text-white"></i>
            </div>
            <span className="text-xs md:text-sm font-medium text-violet-900 whitespace-nowrap">View Timetable</span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
              <i className="ri-calendar-check-line text-xl text-white"></i>
            </div>
            <span className="text-xs md:text-sm font-medium text-amber-900 whitespace-nowrap">Attendance</span>
          </button>
        </div>
      </div>

      {/* Report Card Preview Modal */}
      {showReportCardPreview && reportCardData && (
        <ReportCardPreview
          data={reportCardData}
          onClose={() => setShowReportCardPreview(false)}
        />
      )}

      {/* Fees Lock Modal */}
      {showFeesLockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-lock-line text-3xl text-red-600"></i>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Report Card Locked</h2>
            <p className="text-gray-600 text-center mb-6">Report card download is locked due to unpaid school fees.</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-900">Outstanding Balance:</span>
                <span className="text-lg font-bold text-red-600">{(reportCardStatus?.feesBalance ?? 0).toLocaleString()} Frw</span>
              </div>
              <p className="text-xs text-red-700">Payment must be completed before report card access is granted.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowFeesLockModal(false)} className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors whitespace-nowrap cursor-pointer">Close</button>
              <button className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer">
                <i className="ri-phone-line mr-2"></i>Contact School
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatEventDate(date: Date, today: Date): string {
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (diffDays === 0) return `Today — ${formatted}`;
  if (diffDays === 1) return `Tomorrow — ${formatted}`;
  if (diffDays <= 7) return `In ${diffDays} days — ${formatted}`;
  if (diffDays <= 30) return `In ${Math.round(diffDays / 7)} week${Math.round(diffDays / 7) !== 1 ? 's' : ''} — ${formatted}`;
  return formatted;
}