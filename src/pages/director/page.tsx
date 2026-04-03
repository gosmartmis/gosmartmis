import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AcademicManagement from './components/AcademicManagement';
import AcademicOverview from './components/AcademicOverview';
import AcademicAnalytics from './components/AcademicAnalytics';
import SchoolManagement from './components/SchoolManagement';
import FinalApproval from './components/FinalApproval';
import ReportCardControl from './components/ReportCardControl';
import StudentPromotion from './components/StudentPromotion';
import TermManagement from './components/TermManagement';
import FeeConfiguration from './components/FeeConfiguration';
import MessagesMonitoring from './components/MessagesMonitoring';
import Messages from './components/Messages';
import RiskAlerts from './components/RiskAlerts';
import Settings from './components/Settings';
import TopStudents from './components/TopStudents';
import UserManagement from './components/UserManagement';
import DirectorActivityLog from './components/DirectorActivityLog';

export default function DirectorPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
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
      case 'report-card-control':
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
      case 'user-management':
        return <UserManagement />;
      case 'activity-log':
        return <DirectorActivityLog />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="director" />
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeSection={activeTab} 
          onSectionChange={(section) => {
            setActiveTab(section);
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