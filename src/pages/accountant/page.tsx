import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FeeManagement from './components/FeeManagement';
import Payments from './components/Payments';
import StockManagement from './components/StockManagement';
import Payroll from './components/Payroll';
import FinancialReports from './components/FinancialReports';
import TaxManagement from './components/TaxManagement';
import RiskAlerts from './components/RiskAlerts';

export default function AccountantPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="accountant" />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'fee-management' && <FeeManagement />}
          {activeTab === 'payments' && <Payments />}
          {activeTab === 'stock' && <StockManagement />}
          {activeTab === 'payroll' && <Payroll />}
          {activeTab === 'reports' && <FinancialReports />}
          {activeTab === 'tax' && <TaxManagement />}
          {activeTab === 'risk-alerts' && <RiskAlerts />}
          {activeTab === 'messages' && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Messages - Coming Soon</div>}
          {activeTab === 'settings' && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Settings - Coming Soon</div>}
        </main>
      </div>
    </div>
  );
}