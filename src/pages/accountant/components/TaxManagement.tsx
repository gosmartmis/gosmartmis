import { useState } from 'react';

export default function TaxManagement() {
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [showVATCalculator, setShowVATCalculator] = useState(false);
  const [showPAYECalculator, setShowPAYECalculator] = useState(false);

  // VAT Management Data (18% standard rate in Rwanda)
  const vatSummary = {
    outputVAT: 9450000, // VAT on sales
    inputVAT: 3240000,  // VAT on purchases
    netVAT: 6210000     // Payable to RRA
  };

  const vatTransactions = [
    { date: '2024-01-28', type: 'Output VAT', description: 'School Fees Collection', amount: 9450000, status: 'Recorded' },
    { date: '2024-01-25', type: 'Input VAT', description: 'Office Supplies Purchase', amount: 540000, status: 'Recorded' },
    { date: '2024-01-20', type: 'Input VAT', description: 'Equipment Purchase', amount: 1800000, status: 'Recorded' },
    { date: '2024-01-15', type: 'Input VAT', description: 'Maintenance Services', amount: 900000, status: 'Recorded' }
  ];

  // PAYE Tax Brackets (Rwanda RRA)
  const payeTaxBrackets = [
    { range: '0 - 30,000', rate: '0%', description: 'Tax-free threshold' },
    { range: '30,001 - 100,000', rate: '20%', description: 'First bracket' },
    { range: '100,001+', rate: '30%', description: 'Higher bracket' }
  ];

  const payeRecords = [
    { employee: 'Jean Baptiste Mugabo', grossSalary: 850000, taxableIncome: 820000, paye: 194000, netSalary: 656000, status: 'Paid' },
    { employee: 'Marie Claire Uwase', grossSalary: 750000, taxableIncome: 720000, paye: 164000, netSalary: 586000, status: 'Paid' },
    { employee: 'Patrick Nkurunziza', grossSalary: 650000, taxableIncome: 620000, paye: 134000, netSalary: 516000, status: 'Paid' },
    { employee: 'Grace Mukamana', grossSalary: 550000, taxableIncome: 520000, paye: 104000, netSalary: 446000, status: 'Paid' },
    { employee: 'David Habimana', grossSalary: 450000, taxableIncome: 420000, paye: 74000, netSalary: 376000, status: 'Paid' }
  ];

  // RSSB Contributions (Employee 3% + Employer 5%)
  const rssbSummary = {
    employeeContribution: 1680000, // 3% of gross salaries
    employerContribution: 2800000, // 5% of gross salaries
    totalContribution: 4480000,
    totalGrossSalaries: 56000000
  };

  const rssbRecords = [
    { employee: 'Jean Baptiste Mugabo', grossSalary: 850000, employee3: 25500, employer5: 42500, total: 68000 },
    { employee: 'Marie Claire Uwase', grossSalary: 750000, employee3: 22500, employer5: 37500, total: 60000 },
    { employee: 'Patrick Nkurunziza', grossSalary: 650000, employee3: 19500, employer5: 32500, total: 52000 },
    { employee: 'Grace Mukamana', grossSalary: 550000, employee3: 16500, employer5: 27500, total: 44000 },
    { employee: 'David Habimana', grossSalary: 450000, employee3: 13500, employer5: 22500, total: 36000 }
  ];

  // Withholding Tax Records
  const withholdingTaxRecords = [
    { date: '2024-01-28', vendor: 'ABC Supplies Ltd', invoiceNo: 'INV-2024-001', amount: 5000000, whtRate: '3%', whtAmount: 150000, status: 'Paid' },
    { date: '2024-01-25', vendor: 'Tech Solutions Rwanda', invoiceNo: 'INV-2024-002', amount: 3000000, whtRate: '15%', whtAmount: 450000, status: 'Paid' },
    { date: '2024-01-20', vendor: 'Construction Co.', invoiceNo: 'INV-2024-003', amount: 8000000, whtRate: '3%', whtAmount: 240000, status: 'Pending' },
    { date: '2024-01-15', vendor: 'Consulting Services', invoiceNo: 'INV-2024-004', amount: 2000000, whtRate: '15%', whtAmount: 300000, status: 'Paid' }
  ];

  // Tax Filing Status
  const taxFilingStatus = [
    { taxType: 'VAT', period: 'January 2024', dueDate: '2024-02-15', amount: 6210000, status: 'Filed', filedDate: '2024-02-10' },
    { taxType: 'PAYE', period: 'January 2024', dueDate: '2024-02-15', amount: 670000, status: 'Filed', filedDate: '2024-02-12' },
    { taxType: 'RSSB', period: 'January 2024', dueDate: '2024-02-15', amount: 4480000, status: 'Filed', filedDate: '2024-02-11' },
    { taxType: 'Withholding Tax', period: 'January 2024', dueDate: '2024-02-15', amount: 1140000, status: 'Pending', filedDate: '-' },
    { taxType: 'VAT', period: 'February 2024', dueDate: '2024-03-15', amount: 0, status: 'Upcoming', filedDate: '-' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculatePAYE = (grossSalary: number) => {
    const taxableIncome = grossSalary - 30000; // Deduct tax-free threshold
    let paye = 0;

    if (taxableIncome <= 0) {
      paye = 0;
    } else if (taxableIncome <= 70000) {
      paye = taxableIncome * 0.20;
    } else {
      paye = (70000 * 0.20) + ((taxableIncome - 70000) * 0.30);
    }

    return Math.round(paye);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tax Management</h1>
          <p className="text-sm text-slate-600 mt-1">Rwanda Revenue Authority (RRA) compliant tax management</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap flex items-center gap-2">
            <i className="ri-file-download-line"></i>
            Download Tax Report
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-percent-line text-blue-600 text-lg"></i>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">VAT Payable (18%)</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(vatSummary.netVAT)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-purple-600 text-lg"></i>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">PAYE Total</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(670000)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-shield-line text-teal-600 text-lg"></i>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">RSSB Contributions</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(rssbSummary.totalContribution)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-file-list-line text-orange-600 text-lg"></i>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Withholding Tax</p>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(1140000)}</p>
        </div>
      </div>

      {/* VAT Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-percent-line text-teal-600"></i>
            VAT Management (18% Standard Rate)
          </h2>
          <button
            onClick={() => setShowVATCalculator(!showVATCalculator)}
            className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors whitespace-nowrap"
          >
            <i className="ri-calculator-line mr-1"></i>
            VAT Calculator
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Output VAT (Sales)</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(vatSummary.outputVAT)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Input VAT (Purchases)</p>
              <p className="text-xl font-bold text-green-900">{formatCurrency(vatSummary.inputVAT)}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-sm text-teal-700 mb-1">Net VAT Payable</p>
              <p className="text-xl font-bold text-teal-900">{formatCurrency(vatSummary.netVAT)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vatTransactions.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{item.date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        item.type === 'Output VAT' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">{item.description}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAYE Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-user-line text-teal-600"></i>
            PAYE (Pay As You Earn) - RRA Tax Brackets
          </h2>
          <button
            onClick={() => setShowPAYECalculator(!showPAYECalculator)}
            className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors whitespace-nowrap"
          >
            <i className="ri-calculator-line mr-1"></i>
            PAYE Calculator
          </button>
        </div>
        <div className="p-6">
          {/* Tax Brackets */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Rwanda PAYE Tax Brackets</h3>
            <div className="grid grid-cols-3 gap-4">
              {payeTaxBrackets.map((bracket, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">{bracket.description}</p>
                  <p className="text-sm font-semibold text-slate-800">{bracket.range} RWF</p>
                  <p className="text-lg font-bold text-teal-600">{bracket.rate}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Gross Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Taxable Income</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">PAYE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Net Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payeRecords.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.employee}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.grossSalary)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.taxableIncome)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-red-600">{formatCurrency(item.paye)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-teal-600">{formatCurrency(item.netSalary)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RSSB Contributions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-shield-line text-teal-600"></i>
            RSSB Contributions (Employee 3% + Employer 5%)
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Total Gross Salaries</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(rssbSummary.totalGrossSalaries)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Employee 3%</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(rssbSummary.employeeContribution)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">Employer 5%</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(rssbSummary.employerContribution)}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-4">
              <p className="text-sm text-teal-700 mb-1">Total RSSB</p>
              <p className="text-xl font-bold text-teal-900">{formatCurrency(rssbSummary.totalContribution)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Gross Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Employee 3%</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Employer 5%</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rssbRecords.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.employee}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.grossSalary)}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-medium">{formatCurrency(item.employee3)}</td>
                    <td className="px-4 py-3 text-sm text-purple-600 font-medium">{formatCurrency(item.employer5)}</td>
                    <td className="px-4 py-3 text-sm text-teal-600 font-bold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withholding Tax */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-file-list-line text-teal-600"></i>
            Withholding Tax Records
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Invoice No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">WHT Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">WHT Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {withholdingTaxRecords.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{item.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.vendor}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.invoiceNo}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                      {item.whtRate}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-teal-600">{formatCurrency(item.whtAmount)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Filing Status */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <i className="ri-calendar-check-line text-teal-600"></i>
            Tax Filing Status & Due Dates
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tax Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Filed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {taxFilingStatus.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.taxType}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.period}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.dueDate}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {item.amount > 0 ? formatCurrency(item.amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      item.status === 'Filed' ? 'bg-green-100 text-green-700' :
                      item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{item.filedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}