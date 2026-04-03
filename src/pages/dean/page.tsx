import { useState } from 'react';
import DemoBanner from '../../components/feature/DemoBanner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AcademicOverview from './components/AcademicOverview';
import MarksVerification from './components/MarksVerification';
import MarksApproval from './components/MarksApproval';
import ReportCardManagement from './components/ReportCardManagement';
import TimetableManagement from './components/TimetableManagement';
import TeacherWorkload from './components/TeacherWorkload';
import RiskAlerts from './components/RiskAlerts';
import StudentRiskMonitoring from './components/StudentRiskMonitoring';
import Messages from './components/Messages';
import Settings from './components/Settings';
import { useAuth } from '../../hooks/useAuth';
import { useDeanAlerts } from '../../hooks/useDeanAlerts';

export default function DeanPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const schoolId = profile?.school_id ?? null;

  const { alerts, unreadCount, markAsRead, markAllAsRead } = useDeanAlerts(schoolId);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'academic-overview':
        return <AcademicOverview />;
      case 'marks-verification':
        return <MarksVerification />;
      case 'marks-approval':
        return <MarksApproval />;
      case 'report-cards':
        return <ReportCardManagement />;
      case 'timetable':
        return <TimetableManagement setActiveTab={setActiveTab} />;
      case 'teacher-workload':
        return <TeacherWorkload schoolId={schoolId} />;
      case 'risk-alerts':
        return <RiskAlerts />;
      case 'student-risk-monitoring':
        return <StudentRiskMonitoring />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner role="dean" />
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        alerts={alerts}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onNavigateToVerification={() => {
          setActiveTab('marks-verification');
          setSidebarOpen(false);
        }}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          alertCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
