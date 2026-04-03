import { useState } from 'react';
import { ReportCardData } from '../types/report-card';
import { downloadReportCard, previewReportCard } from '../utils/reportCardGenerator';
import { sampleReportCardData, sampleReportCardData2 } from '../mocks/report-cards';

interface ReportCardPreviewProps {
  data: ReportCardData;
  onClose: () => void;
}

const ReportCardPreview: React.FC<ReportCardPreviewProps> = ({ data, onClose }) => {
  const handleDownload = () => {
    downloadReportCard(data);
  };

  const handlePreview = () => {
    previewReportCard(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Report Card Preview</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Report Card Content */}
        <div className="p-8 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-3xl mx-auto">
            {/* School Branding */}
            <div className="text-center mb-6">
              {data.schoolBranding.logo && (
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    <img 
                      src={data.schoolBranding.logo} 
                      alt="School Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {data.schoolBranding.name}
              </h1>
              <p className="text-sm italic text-gray-600 mb-2">
                "{data.schoolBranding.motto}"
              </p>
              <p className="text-xs text-gray-500">{data.schoolBranding.address}</p>
              <p className="text-xs text-gray-500">Tel: {data.schoolBranding.phone}</p>
              <div className="mt-4 space-y-1">
                <p className="text-sm font-semibold text-gray-700">
                  Academic Year: {data.schoolBranding.academicYear}
                </p>
                <p className="text-sm font-semibold text-gray-700">
                  Term: {data.schoolBranding.term}
                </p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 border-t border-b py-2">
                STUDENT REPORT CARD
              </h2>
            </div>

            {/* Student Information */}
            <div className="mb-6 border-b pb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">STUDENT INFORMATION</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Student Name:</span> {data.studentInfo.name}</p>
                <p><span className="font-medium">Student Code:</span> {data.studentInfo.studentCode}</p>
                <p><span className="font-medium">Class:</span> {data.studentInfo.class}</p>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="mb-6 border-b pb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-3">ACADEMIC PERFORMANCE</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-2 px-3 font-semibold">Subject</th>
                      <th className="text-center py-2 px-3 font-semibold">Score</th>
                      <th className="text-center py-2 px-3 font-semibold">Percentage</th>
                      <th className="text-left py-2 px-3 font-semibold">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subjects.map((subject, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-2 px-3">{subject.subject}</td>
                        <td className="text-center py-2 px-3">
                          {subject.score}/{subject.maxScore}
                        </td>
                        <td className="text-center py-2 px-3">{subject.percentage.toFixed(1)}%</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                              <div
                                className={`h-2 rounded-full ${
                                  subject.percentage >= 70
                                    ? 'bg-green-500'
                                    : subject.percentage >= 50
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${subject.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t space-y-1 text-sm font-semibold">
                <p>Total Score: {data.totalScore}/{data.maxTotalScore}</p>
                <p>Average Score: {data.averageScore.toFixed(1)}%</p>
                <p>Class Rank: {data.classRank} / {data.totalStudents}</p>
              </div>
            </div>

            {/* Teacher Comment */}
            <div className="mb-6 border-b pb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">TEACHER COMMENT</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{data.teacherComment}</p>
            </div>

            {/* Director Comment */}
            <div className="mb-6 border-b pb-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2">DIRECTOR COMMENT</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{data.directorComment}</p>
            </div>

            {/* Decision */}
            <div className="mb-6 text-center">
              <div
                className={`inline-block px-6 py-3 rounded-lg font-bold text-sm ${
                  data.decision === 'promoted'
                    ? 'bg-green-100 text-green-700'
                    : data.decision === 'repeat'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                DECISION: {data.decision.toUpperCase()}
              </div>
            </div>

            {/* Signatures */}
            <div className="mb-6 border-t pt-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-medium mb-8">Class Teacher</p>
                  <div className="border-t border-gray-400 pt-1">
                    <p className="text-xs text-gray-500">Signature & Date</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-8">Director</p>
                  <div className="border-t border-gray-400 pt-1">
                    <p className="text-xs text-gray-500">Signature & Date</p>
                  </div>
                </div>
              </div>

              {/* Official Stamp */}
              <div className="mt-8 text-center">
                <div className="inline-block border-2 border-dashed border-gray-300 rounded-full w-24 h-24 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Official<br/>Stamp</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 italic">
              Generated on: {data.generatedDate}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Close
          </button>
          <button
            onClick={handlePreview}
            className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
          >
            <i className="ri-eye-line mr-2"></i>
            Preview PDF
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-download-line mr-2"></i>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo Component
export const ReportCardDemo: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportCardData | null>(null);

  const handlePreviewReport = (data: ReportCardData) => {
    setSelectedReport(data);
    setShowPreview(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Report Card Generator Demo</h2>
        <p className="text-sm text-gray-600">
          Test the report card generation system with sample data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample Report 1 */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-text-line text-xl text-teal-600"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">
                {sampleReportCardData.studentInfo.name}
              </h3>
              <p className="text-sm text-gray-600">
                {sampleReportCardData.studentInfo.class} • {sampleReportCardData.studentInfo.studentCode}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Average: {sampleReportCardData.averageScore}% • Rank: {sampleReportCardData.classRank}/{sampleReportCardData.totalStudents}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                sampleReportCardData.decision === 'promoted'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {sampleReportCardData.decision.toUpperCase()}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePreviewReport(sampleReportCardData)}
              className="flex-1 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
            >
              <i className="ri-eye-line mr-2"></i>
              Preview
            </button>
            <button
              onClick={() => downloadReportCard(sampleReportCardData)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              <i className="ri-download-line mr-2"></i>
              Download
            </button>
          </div>
        </div>

        {/* Sample Report 2 */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-text-line text-xl text-orange-600"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">
                {sampleReportCardData2.studentInfo.name}
              </h3>
              <p className="text-sm text-gray-600">
                {sampleReportCardData2.studentInfo.class} • {sampleReportCardData2.studentInfo.studentCode}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Average: {sampleReportCardData2.averageScore}% • Rank: {sampleReportCardData2.classRank}/{sampleReportCardData2.totalStudents}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                sampleReportCardData2.decision === 'conditional'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {sampleReportCardData2.decision.toUpperCase()}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePreviewReport(sampleReportCardData2)}
              className="flex-1 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
            >
              <i className="ri-eye-line mr-2"></i>
              Preview
            </button>
            <button
              onClick={() => downloadReportCard(sampleReportCardData2)}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              <i className="ri-download-line mr-2"></i>
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedReport && (
        <ReportCardPreview
          data={selectedReport}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default ReportCardPreview;