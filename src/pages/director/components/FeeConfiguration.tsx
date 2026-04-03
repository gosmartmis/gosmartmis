import { useState } from 'react';

interface FeeConfiguration {
  id: string;
  term_id: string;
  term_name: string;
  academic_year: string;
  nursery_fee: number;
  primary_fee: number;
  secondary_fee: number;
  auto_assign: boolean;
  assigned_date: string | null;
  total_students_assigned: number;
  status: 'pending' | 'assigned' | 'active';
}

export default function FeeConfiguration() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<FeeConfiguration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [feeConfigs, setFeeConfigs] = useState<FeeConfiguration[]>([
    {
      id: 'FC-001',
      term_id: 'term-001',
      term_name: 'Term 1',
      academic_year: '2025',
      nursery_fee: 80000,
      primary_fee: 100000,
      secondary_fee: 120000,
      auto_assign: true,
      assigned_date: '2025-01-06T08:00:00Z',
      total_students_assigned: 450,
      status: 'assigned'
    },
    {
      id: 'FC-002',
      term_id: 'term-002',
      term_name: 'Term 2',
      academic_year: '2025',
      nursery_fee: 80000,
      primary_fee: 100000,
      secondary_fee: 120000,
      auto_assign: true,
      assigned_date: '2025-04-28T08:00:00Z',
      total_students_assigned: 455,
      status: 'assigned'
    },
    {
      id: 'FC-003',
      term_id: 'term-003',
      term_name: 'Term 3',
      academic_year: '2025',
      nursery_fee: 80000,
      primary_fee: 100000,
      secondary_fee: 120000,
      auto_assign: false,
      assigned_date: null,
      total_students_assigned: 0,
      status: 'pending'
    }
  ]);

  const [newConfig, setNewConfig] = useState({
    term_id: '',
    nursery_fee: 80000,
    primary_fee: 100000,
    secondary_fee: 120000,
    auto_assign: true
  });

  const filteredConfigs = feeConfigs.filter(config =>
    config.term_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.academic_year.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateConfig = () => {
    const newFeeConfig: FeeConfiguration = {
      id: `FC-${String(feeConfigs.length + 1).padStart(3, '0')}`,
      term_id: newConfig.term_id,
      term_name: `Term ${feeConfigs.length + 1}`,
      academic_year: '2025',
      nursery_fee: newConfig.nursery_fee,
      primary_fee: newConfig.primary_fee,
      secondary_fee: newConfig.secondary_fee,
      auto_assign: newConfig.auto_assign,
      assigned_date: null,
      total_students_assigned: 0,
      status: 'pending'
    };

    setFeeConfigs([...feeConfigs, newFeeConfig]);
    setShowConfigModal(false);
    setNewConfig({
      term_id: '',
      nursery_fee: 80000,
      primary_fee: 100000,
      secondary_fee: 120000,
      auto_assign: true
    });
  };

  const handleAssignFees = (config: FeeConfiguration) => {
    setSelectedConfig(config);
    setShowAssignModal(true);
  };

  const executeAssignment = () => {
    if (!selectedConfig) return;

    setFeeConfigs(feeConfigs.map(config =>
      config.id === selectedConfig.id
        ? {
            ...config,
            assigned_date: new Date().toISOString(),
            total_students_assigned: 450,
            status: 'assigned'
          }
        : config
    ));

    setShowAssignModal(false);
    setSelectedConfig(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `RWF ${amount.toLocaleString()}`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Configuration</h1>
        <p className="text-gray-600">Configure and automatically assign school fees for each term</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Configurations</p>
              <p className="text-3xl font-bold text-gray-900">{feeConfigs.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-settings-3-line text-2xl text-gray-900"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Assigned Terms</p>
              <p className="text-3xl font-bold text-emerald-600">
                {feeConfigs.filter(c => c.status === 'assigned').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-emerald-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Assignment</p>
              <p className="text-3xl font-bold text-amber-600">
                {feeConfigs.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-2xl text-amber-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Students Assigned</p>
              <p className="text-3xl font-bold text-teal-600">
                {feeConfigs.reduce((sum, c) => sum + c.total_students_assigned, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-group-line text-2xl text-teal-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
          <input
            type="text"
            placeholder="Search by term or academic year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="ml-4 inline-flex items-center px-6 py-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <i className="ri-add-line mr-2 text-lg"></i>
          Configure New Term
        </button>
      </div>

      {/* Fee Configurations Table */}
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
                  Nursery Fee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Primary Fee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Secondary Fee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Students Assigned
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Assigned Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredConfigs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                        <i className="ri-calendar-line text-lg text-teal-600"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{config.term_name}</p>
                        <p className="text-sm text-gray-500">{config.term_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{config.academic_year}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(config.nursery_fee)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(config.primary_fee)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(config.secondary_fee)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{config.total_students_assigned}</span>
                  </td>
                  <td className="px-6 py-4">
                    {config.status === 'assigned' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        Assigned
                      </span>
                    ) : config.status === 'active' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                        <i className="ri-play-circle-line mr-1"></i>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <i className="ri-time-line mr-1"></i>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {config.assigned_date ? formatDate(config.assigned_date) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {config.status === 'pending' && (
                        <button
                          onClick={() => handleAssignFees(config)}
                          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                        >
                          <i className="ri-send-plane-line mr-2"></i>
                          Assign Fees
                        </button>
                      )}
                      <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <i className="ri-eye-line text-gray-600 text-lg"></i>
                      </button>
                      <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <i className="ri-edit-line text-gray-600 text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure New Term Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-settings-3-line text-2xl text-teal-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Configure Term Fees</h3>
                <p className="text-sm text-gray-600">Set fee amounts for the new term</p>
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Term <span className="text-red-500">*</span>
                </label>
                <select
                  value={newConfig.term_id}
                  onChange={(e) => setNewConfig({ ...newConfig, term_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a term</option>
                  <option value="term-001">Term 1 - 2025</option>
                  <option value="term-002">Term 2 - 2025</option>
                  <option value="term-003">Term 3 - 2025</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nursery Fee (RWF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newConfig.nursery_fee}
                    onChange={(e) => setNewConfig({ ...newConfig, nursery_fee: Number(e.target.value) })}
                    placeholder="80000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Fee (RWF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newConfig.primary_fee}
                    onChange={(e) => setNewConfig({ ...newConfig, primary_fee: Number(e.target.value) })}
                    placeholder="100000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Secondary Fee (RWF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newConfig.secondary_fee}
                    onChange={(e) => setNewConfig({ ...newConfig, secondary_fee: Number(e.target.value) })}
                    placeholder="120000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-600 text-lg mr-3 flex-shrink-0 mt-0.5"></i>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Automatic Fee Assignment</p>
                    <p>When you activate this term, the system will automatically create payment records for all enrolled students based on their grade level.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-assign"
                  checked={newConfig.auto_assign}
                  onChange={(e) => setNewConfig({ ...newConfig, auto_assign: e.target.checked })}
                  className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="auto-assign" className="ml-3 text-sm font-medium text-gray-700">
                  Enable automatic fee assignment when term is activated
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setNewConfig({
                    term_id: '',
                    nursery_fee: 80000,
                    primary_fee: 100000,
                    secondary_fee: 120000,
                    auto_assign: true
                  });
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConfig}
                disabled={!newConfig.term_id}
                className="flex-1 px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <i className="ri-save-line mr-2"></i>
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Fees Confirmation Modal */}
      {showAssignModal && selectedConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                <i className="ri-send-plane-line text-2xl text-teal-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Assign Fees to Students</h3>
                <p className="text-sm text-gray-600">{selectedConfig.term_name} - {selectedConfig.academic_year}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <i className="ri-alert-line text-amber-600 text-lg mr-3 flex-shrink-0 mt-0.5"></i>
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-2">This action will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Create payment records for all enrolled students</li>
                    <li>Assign fees based on student grade level</li>
                    <li>Set initial balance equal to total fees</li>
                    <li>Send notifications to parents about new term fees</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Fee Assignment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nursery Students:</span>
                  <span className="font-semibold text-gray-900">150 × {formatCurrency(selectedConfig.nursery_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Primary Students:</span>
                  <span className="font-semibold text-gray-900">200 × {formatCurrency(selectedConfig.primary_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Secondary Students:</span>
                  <span className="font-semibold text-gray-900">100 × {formatCurrency(selectedConfig.secondary_fee)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-900">Total Students:</span>
                    <span className="font-bold text-teal-600">450</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-bold text-gray-900">Total Amount:</span>
                    <span className="font-bold text-teal-600">RWF 46,000,000</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedConfig(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={executeAssignment}
                className="flex-1 px-4 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-checkbox-circle-line mr-2"></i>
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}