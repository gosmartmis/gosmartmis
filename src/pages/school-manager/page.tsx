import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AcademicManagement from './components/AcademicManagement';
import TermManagement from './components/TermManagement';
import AcademicAnalytics from './components/AcademicAnalytics';
import FinalApproval from './components/FinalApproval';
import ReportCardControl from './components/ReportCardControl';
import MessagesMonitoring from './components/MessagesMonitoring';
import StudentPromotion from './components/StudentPromotion';
import SchoolManagement from './components/SchoolManagement';
import AcademicOverview from './components/AcademicOverview';
import FeeConfiguration from './components/FeeConfiguration';
import RiskAlerts from './components/RiskAlerts';
import Messages from './components/Messages';
import Settings from './components/Settings';
import TopStudents from './components/TopStudents';

type TabType =
  | 'dashboard'
  | 'academic-management'
  | 'term-management'
  | 'analytics'
  | 'final-approval'
  | 'report-cards'
  | 'messages-monitoring'
  | 'student-promotion'
  | 'school-management'
  | 'academic-overview'
  | 'fee-configuration'
  | 'risk-alerts'
  | 'messages'
  | 'settings'
  | 'top-students'
  | 'marks-approval'
  | 'fee-config';

export default function SchoolManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'academic-overview':
        return <AcademicOverview />;
      case 'analytics':
        return <AcademicAnalytics setActiveTab={setActiveTab} />;
      case 'top-students':
        return <TopStudents />;
      case 'marks-approval':
      case 'final-approval':
        return <FinalApproval />;
      case 'report-cards':
        return <ReportCardControl />;
      case 'student-promotion':
        return <StudentPromotion />;
      case 'term-management':
        return <TermManagement />;
      case 'fee-config':
      case 'fee-configuration':
        return <FeeConfiguration />;
      case 'academic-management':
        return <AcademicManagement />;
      case 'school-management':
        return <SchoolManagement />;
      case 'messages':
      case 'messages-monitoring':
        return <MessagesMonitoring />;
      case 'risk-alerts':
        return <RiskAlerts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="school_manager" />
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
}