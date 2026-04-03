import { useState } from 'react';
import { terms as mockTerms } from '../../../mocks/terms';

interface Term {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_number: number;
  term_name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'locked';
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
}

interface TermClosingSummary {
  totalStudents: number;
  averagesCalculated: number;
  rankingsCalculated: number;
  reportCardsReady: number;
  marksLocked: boolean;
}

export default function TermManagement() {
  const [terms, setTerms] = useState<Term[]>(mockTerms);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [closingSummary, setClosingSummary] = useState<TermClosingSummary | null>(null);

  const filteredTerms = terms.filter(term =>
    term.term_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.academic_year_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const simulateTermClosing = async () => {
    setIsProcessing(true);
    
    // Step 1: Lock marks editing
    setProcessingStep('Locking marks editing...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Calculate final averages
    setProcessingStep('Calculating final averages for all students...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step 3: Calculate class rankings
    setProcessingStep('Calculating class rankings...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Step 4: Prepare report cards
    setProcessingStep('Preparing report cards for generation...');
    await new Promise(resolve => setTimeout(resolve, 1300));
    
    // Step 5: Update analytics
    setProcessingStep('Updating academic analytics...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate summary
    const summary: TermClosingSummary = {
      totalStudents: 487,
      averagesCalculated: 487,
      rankingsCalculated: 487,
      reportCardsReady: 487,
      marksLocked: true
    };
    
    setClosingSummary(summary);
    setIsProcessing(false);
    
    return summary;
  };

  const handleCloseTerm = async () => {
    if (!selectedTerm || !closeReason.trim()) return;

    await simulateTermClosing();

    setTerms(terms.map(term =>
      term.id === selectedTerm.id
        ? {
            ...term,
            status: 'locked',
            locked_at: new Date().toISOString(),
            locked_by: 'Director John Smith'
          }
        : term
    ));

    setShowCloseModal(false);
    setShowSuccessModal(true);
    setCloseReason('');
  };

  const handleReopenTerm = () => {
    if (!selectedTerm || !reopenReason.trim()) return;

    setTerms(terms.map(term =>
      term.id === selectedTerm.id
        ? {
            ...term,
            status: 'open',
            locked_at: null,
            locked_by: null
          }
        : term
    ));

    setShowReopenModal(false);
    setReopenReason('');
    setSelectedTerm(null);
  };

  const openCloseModal = (term: Term) => {
    setSelectedTerm(term);
    setShowCloseModal(true);
  };

  const openReopenModal = (term: Term) => {
    setSelectedTerm(term);
    setShowReopenModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Term Management</h1>
        <p className="text-gray-600">Close or reopen academic terms to control marks entry and finalize academic records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Open Terms</p>
              <p className="text-3xl font-bold text-teal-600">
                {terms.filter(t => t.status === 'open').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-lock-unlock-line text-2xl text-teal-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Closed Terms</p>
              <p className="text-3xl font-bold text-gray-900">
                {terms.filter(t => t.status === 'locked').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-lock-line text-2xl text-gray-900"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Terms</p>
              <p className="text-3xl font-bold text-gray-900">{terms.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-line text-2xl text-gray-900"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <input
            type="text"
            placeholder="Search by term name or academic year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Terms Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Closed By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Closed Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTerms.map((term) => (
                <tr key={term.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                        <i className="ri-calendar-check-line text-lg text-teal-600"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{term.term_name}</p>
                        <p className="text-sm text-gray-500">Term {term.term_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{term.academic_year_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{formatDate(term.start_date)}</p>
                      <p className="text-gray-500">to {formatDate(term.end_date)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {term.status === 'open' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                        <i className="ri-lock-unlock-line mr-1"></i>
                        Open
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <i className="ri-lock-line mr-1"></i>
                        Closed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {term.locked_by || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {term.locked_at ? formatDate(term.locked_at) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {term.status === 'open' ? (
                      <button
                        onClick={() => openCloseModal(term)}
                        className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-lock-line mr-2"></i>
                        Close Term
                      </button>
                    ) : (
                      <button
                        onClick={() => openReopenModal(term)}
                        className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-lock-unlock-line mr-2"></i>
                        Reopen Term
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Close Term Modal */}
      {showCloseModal && selectedTerm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-lock-line text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Close Term</h3>
                <p className="text-sm text-gray-600">{selectedTerm.term_name} - {selectedTerm.academic_year_id}</p>
              </div>
            </div>

            {!isProcessing && !closingSummary && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <i className="ri-alert-line text-yellow-600 text-lg mr-3 flex-shrink-0 mt-0.5"></i>
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-2">Warning: Closing this term will automatically:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Lock marks editing (teachers cannot edit marks)</li>
                        <li>Calculate final averages for all students</li>
                        <li>Calculate class rankings for all students</li>
                        <li>Prepare report cards for generation</li>
                        <li>Update academic analytics with term data</li>
                        <li>Make all academic records permanent</li>
                      </ul>
                      <p className="mt-3 font-semibold">Only the Director or School Manager can reopen a closed term.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason for Closing Term <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value)}
                    placeholder="Enter the reason for closing this term (e.g., 'All marks approved and verified', 'End of term assessments completed')..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCloseModal(false);
                      setCloseReason('');
                      setSelectedTerm(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseTerm}
                    disabled={!closeReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <i className="ri-lock-line mr-2"></i>
                    Close Term
                  </button>
                </div>
              </>
            )}

            {isProcessing && (
              <div className="py-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Processing Term Closure...</p>
                  <p className="text-sm text-gray-600">{processingStep}</p>
                </div>
              </div>
            )}

            {closingSummary && (
              <div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <i className="ri-checkbox-circle-line text-teal-600 text-2xl mr-3"></i>
                    <p className="font-semibold text-teal-900">Term closure completed successfully!</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{closingSummary.totalStudents}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Averages Calculated</p>
                      <p className="text-2xl font-bold text-teal-600">{closingSummary.averagesCalculated}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Rankings Calculated</p>
                      <p className="text-2xl font-bold text-teal-600">{closingSummary.rankingsCalculated}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Report Cards Ready</p>
                      <p className="text-2xl font-bold text-teal-600">{closingSummary.reportCardsReady}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCloseModal(false);
                    setClosingSummary(null);
                    setSelectedTerm(null);
                  }}
                  className="w-full px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reopen Term Modal */}
      {showReopenModal && selectedTerm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-lock-unlock-line text-2xl text-teal-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Reopen Term</h3>
                <p className="text-sm text-gray-600">{selectedTerm.term_name}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <i className="ri-information-line text-blue-600 text-lg mr-3 flex-shrink-0 mt-0.5"></i>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Reopening this term will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Allow teachers to edit marks again</li>
                    <li>Allow Dean to modify marks</li>
                    <li>Enable new marks entry</li>
                    <li>Unlock report cards</li>
                    <li>Reset term status to open</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reason for Reopening <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Enter the reason for reopening this term..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenReason('');
                  setSelectedTerm(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleReopenTerm}
                disabled={!reopenReason.trim()}
                className="flex-1 px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <i className="ri-lock-unlock-line mr-2"></i>
                Reopen Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}